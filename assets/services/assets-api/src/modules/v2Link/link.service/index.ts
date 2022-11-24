import { Injectable } from '@nestjs/common';
import ErrorService from 'src/utils/errorService';
import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';
import {
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { UserType, User } from 'src/types/user';
import { Token } from 'src/types/token';
import { Link, LinkState } from 'src/types/workflow/workflowInstances/link';
import { keys as UserKeys } from 'src/types/user';
import { keys as TokenKeys } from 'src/types/token';
import { CreateLinkOutput } from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { FunctionName, TokenCategory } from 'src/types/smartContract';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import {
  checkLinkStateValidForUserType,
  checkIfLinkedToAssetClassOrToken,
  checkIfLinkedToAssetClassOnly,
} from 'src/utils/checks/links';
import { keys as ProjectKeys, Project } from 'src/types/project';
import {
  endProtectionAgainstRaceCondition,
  protectAgainstRaceCondition,
} from 'src/utils/race';
import { NestJSPinoLogger } from '@consensys/observability';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.KYC;

@Injectable()
export class LinkService {
  constructor(
    private readonly walletService: WalletService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly partitionService: PartitionService,
    private readonly logger: NestJSPinoLogger,
  ) {}

  /**
   * [Retrieve list of all links for a given entity]
   */
  async listAllEntityLinks(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
    userIdOrIds?: string[],
  ): Promise<Array<Link>> {
    try {
      const allEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          userIdOrIds
            ? WorkflowInstanceEnum.entityIdAndUserIds
            : WorkflowInstanceEnum.entityId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          userIdOrIds, // userId
          entityId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      const allFilteredEntityLinks: Array<Link> = entityType
        ? allEntityLinks.filter((entityLink: Link) => {
            return entityLink[LinkKeys.ENTITY_TYPE] === entityType;
          })
        : allEntityLinks;

      return allFilteredEntityLinks;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of entity links',
        'listAllEntityLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all links for a given user]
   */
  async listAllUserLinks(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityType: EntityType,
    entityId: string,
    assetClass: string,
    offset: number,
    limit: number,
    withMetadata: boolean,
  ): Promise<{ links: Array<Link>; total: number }> {
    try {
      let allUserEntityLinks: Array<Link>;
      if (entityType) {
        allUserEntityLinks =
          await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.entityTypeAndUserId,
            undefined, // userEntityLinkId
            undefined, // idempotencyKey
            userId,
            undefined, // entityId
            undefined, // objectId
            entityType, // entityType
            WorkflowType.LINK,
            undefined, // otherWorkflowType
            false,
          );
      } else {
        allUserEntityLinks =
          await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.userId,
            undefined, // userEntityLinkId
            undefined, // idempotencyKey
            userId,
            undefined, // entityId
            undefined, // objectId
            undefined, // entityType
            WorkflowType.LINK,
            undefined, // otherWorkflowType
            false,
          );
      }

      let filteredUserEntityLinks: Array<Link> = allUserEntityLinks;
      if (entityId && assetClass) {
        filteredUserEntityLinks = allUserEntityLinks.filter(
          (link) =>
            link[LinkKeys.ENTITY_ID] === entityId &&
            link[LinkKeys.ASSET_CLASS] === assetClass,
        );
      } else if (entityId) {
        filteredUserEntityLinks = allUserEntityLinks.filter(
          (link) => link[LinkKeys.ENTITY_ID] === entityId,
        );
      }

      const filteredUserEntityLinks2: Array<Link> =
        filteredUserEntityLinks.filter((link) =>
          checkLinkStateValidForUserType(
            link[LinkKeys.STATE],
            userType,
            link[LinkKeys.ENTITY_TYPE],
          ),
        );

      const slicedLinksList: Array<Link> =
        limit === undefined
          ? filteredUserEntityLinks2
          : filteredUserEntityLinks2.slice(
              offset,
              Math.min(offset + limit, filteredUserEntityLinks2.length),
            );

      if (withMetadata) {
        const filteredUserEntityLinksWithMetadata: Array<Link> =
          await this.apiMetadataCallService.addMetadataToWorkflowInstances(
            tenantId,
            slicedLinksList,
            false, // withAssetData
          );

        return {
          links: filteredUserEntityLinksWithMetadata,
          total: filteredUserEntityLinks2.length,
        };
      } else {
        return {
          links: slicedLinksList,
          total: filteredUserEntityLinks2.length,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of user links',
        'listAllUserLinks',
        false,
        500,
      );
    }
  }

  async listAllUserEntityLinksBatch(
    tenantId: string,
    userIds: Array<string>,
    userTypesByUserId: { [userId: string]: UserType },
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    exhaustiveList: boolean,
    strictList: boolean,
  ): Promise<{ [userId: string]: Array<Link> }> {
    try {
      // Check input parameter is correct
      const userIds2: string[] = Object.keys(userTypesByUserId);
      let missingUserId: string;
      const allUserTypesProvided: boolean = userIds.every((userId: string) => {
        if (userIds2.includes(userId)) {
          return true;
        } else {
          missingUserId = userId;
          return false;
        }
      });
      if (!allUserTypesProvided) {
        ErrorService.throwError(
          `invalid input parameter to retrieve batch of strict userEntityLinks - 'userTypesByUserId' doesn't include userType for user ${missingUserId}`,
        );
      }

      const userEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserIds,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          userIds,
          entityId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      const userEntityLinksByUserId: {
        [userId: string]: Array<Link>;
      } = userIds.reduce(
        (map, userId: string) => ({ ...map, [userId]: [] }),
        {},
      );
      userEntityLinks.map((userEntityLink: Link) => {
        userEntityLinksByUserId[userEntityLink[LinkKeys.USER_ID]].push(
          userEntityLink,
        );
      });

      // Filter user-entity links, according to entityType
      userIds.map((userId: string) => {
        userEntityLinksByUserId[userId] = userEntityLinksByUserId[
          userId
        ].filter((userEntityLink) => {
          return userEntityLink[LinkKeys.ENTITY_TYPE] === entityType;
        });
      });

      // Filter user-entity links, according to linkState
      userIds.map((userId: string) => {
        userEntityLinksByUserId[userId] = userEntityLinksByUserId[
          userId
        ].filter((userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            userTypesByUserId[userId],
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });
      });

      // Filter user-entity links, according to assetClass link
      userIds.map((userId: string) => {
        userEntityLinksByUserId[userId] = userEntityLinksByUserId[
          userId
        ].filter((userEntityLink: Link) => {
          return checkIfLinkedToAssetClassOrToken(
            userEntityLink,
            assetClassKey,
          );
        });
      });

      if (exhaustiveList) {
        return userEntityLinksByUserId;
      } else if (strictList) {
        userIds.map((userId: string) => {
          userEntityLinksByUserId[userId] = userEntityLinksByUserId[
            userId
          ].filter((userEntityLink: Link) => {
            return checkIfLinkedToAssetClassOnly(userEntityLink, assetClassKey);
          });
        });
        return userEntityLinksByUserId;
      } else {
        ErrorService.throwError(
          'shall never happen: list shall be either exhaustive or strict',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving batch of lists of user-entity links',
        'listAllUserEntityLinksBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all links between a given user and a given entity]
   */
  async listAllUserEntityLinks(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    exhaustiveList: boolean,
    strictList: boolean,
  ): Promise<Array<Link>> {
    try {
      const userEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          userId,
          entityId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      const filteredUserEntityLinks: Array<Link> = userEntityLinks.filter(
        (userEntityLink) => {
          return userEntityLink[LinkKeys.ENTITY_TYPE] === entityType;
        },
      );

      const filteredUserEntityLinks2: Array<Link> =
        filteredUserEntityLinks.filter((userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            userType,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });

      const filteredUserEntityLinks3: Array<Link> =
        filteredUserEntityLinks2.filter((userEntityLink: Link) => {
          return checkIfLinkedToAssetClassOrToken(
            userEntityLink,
            assetClassKey,
          );
        });

      const filteredUserEntityLinks4: Array<Link> =
        filteredUserEntityLinks3.filter((userEntityLink: Link) => {
          return checkIfLinkedToAssetClassOnly(userEntityLink, assetClassKey);
        });

      if (exhaustiveList) {
        return filteredUserEntityLinks3;
      } else if (strictList) {
        return filteredUserEntityLinks4;
      } else if (filteredUserEntityLinks4.length > 0) {
        // Here we need to manage the case where user is linked both to the
        // token overall and to the asset class. In this case we want to choose
        // the link to the asset class in priority.
        return filteredUserEntityLinks4;
      } else {
        return filteredUserEntityLinks3;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving list of user-entity links',
        'listAllUserEntityLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Create user-entity-link]
   */
  async createUserEntityLink(
    tenantId: string,
    user: User,
    entityId: string,
    entityType: EntityType,
    linkState: string,
    wallet: Wallet,
    functionName: FunctionName,
    workflowTemplateId: number,
    userType: UserType,
    brokerId: string,
    assetClassKey: string,
  ): Promise<Link> {
    try {
      // Check wallet belongs to user
      this.walletService.checkWalletAddressIsValidAndRetrieveWalletIndex(
        user[UserKeys.WALLETS],
        wallet[WalletKeys.WALLET_ADDRESS],
      );

      // Create link
      const userEntityLink: Link =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          undefined, // idempotencyKey
          WorkflowType.LINK,
          functionName,
          userType,
          user[UserKeys.USER_ID],
          entityId,
          entityType,
          undefined, // objectId
          undefined, // recipientId
          brokerId, // brokerId
          undefined, // agentId
          workflowTemplateId,
          0, // quantity
          0, // price
          undefined, // documentId
          wallet[WalletKeys.WALLET_ADDRESS],
          assetClassKey, // optional - only for user-assetClass links
          undefined, // date
          linkState,
          undefined, //offerId
          undefined, //orderSide
          undefined, // data
        );

      return userEntityLink;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating user-entity link',
        'createUserEntityLink',
        false,
        500,
      );
    }
  }

  /**
   * [Create link between user and entity if required]
   */
  async createUserEntityLinkIfRequired(
    tenantId: string,
    typeFunctionUser: UserType,
    idFunctionUser: string,
    user: User,
    functionName: FunctionName,
    entityType: EntityType,
    entityProject: Project,
    entityIssuer: User,
    entityToken: Token,
    assetClassKey: string,
    wallet: Wallet,
  ): Promise<CreateLinkOutput> {
    try {
      // RACE CONDITION DANGER
      // This function is called a lot (at every "mint" operation for example), and one of its purpose
      // is to make sure we don't create multiple links between a user and an entity in the database.
      // In some extreme situations (transaction batching), this function can be called multiple
      // times in parallel, which can lead to a race condition where we create multiple links in the
      // database, while we want only one.
      // For this reason, we add a protection against race conditions.
      const funcName = 'createUserEntityLinkIfRequired';
      const funcParams = {
        tenantId,
        typeFunctionUser,
        idFunctionUser,
        user,
        functionName,
        entityType,
        entityProject,
        entityIssuer,
        entityToken,
        assetClassKey,
        wallet,
      };
      await protectAgainstRaceCondition(funcName, funcParams, 100, 1000, 1);

      // Retrieve entityId (this function exists in V2EntityModule but cannot be imported because of circular dependancy)
      let entityId: string;
      if (entityType === EntityType.PROJECT) {
        entityId = entityProject[ProjectKeys.PROJECT_ID];
      } else if (entityType === EntityType.ISSUER) {
        entityId = entityIssuer[UserKeys.USER_ID];
      } else if (entityType === EntityType.TOKEN) {
        entityId = entityToken[TokenKeys.TOKEN_ID];
      } else if (entityType === EntityType.PLATFORM) {
        // entityId = undefined;
      } else {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }

      const _assetClassKey: string = assetClassKey
        ? assetClassKey.toLowerCase()
        : assetClassKey;

      let filterforAssetClass: boolean;
      if (_assetClassKey && entityType === EntityType.TOKEN && entityToken) {
        if (
          checkTokenBelongsToExpectedCategory(entityToken, TokenCategory.HYBRID)
        ) {
          this.partitionService.checkTokenClassIsValid(
            entityToken,
            _assetClassKey,
          );

          filterforAssetClass = true;
        } else {
          ErrorService.throwError(
            `assetClass can only be specified for hybrid tokens (${
              entityToken[TokenKeys.STANDARD]
            } instead)`,
          );
        }
      }

      const userEntityLinks: Array<Link> =
        await this.strictListAllUserEntityLinks(
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          entityId,
          entityType,
          _assetClassKey,
        );

      let link: Link;
      let newLink = true;
      if (userEntityLinks && userEntityLinks.length > 0) {
        link = userEntityLinks[0];
        newLink = false;
      } else {
        const kycWorkflowId: number = (
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            TYPE_WORKFLOW_NAME,
          )
        )[WorkflowTemplateKeys.ID];

        // Check if state transition is possible, by asking Workflow-API
        const nextState: string = await WorkflowMiddleWare.checkStateTransition(
          tenantId,
          TYPE_WORKFLOW_NAME,
          undefined, // workflow instance ID
          typeFunctionUser,
          functionName, // "invite" or "allowList"
        );

        if (
          !checkLinkStateValidForUserType(
            nextState,
            user[UserKeys.USER_TYPE],
            entityType,
          )
        ) {
          ErrorService.throwError(
            `link with state ${nextState} can not be created for user with type ${
              user[UserKeys.USER_TYPE]
            }`,
          );
        }

        // Retrieve default wallet if required
        const _wallet: Wallet = wallet
          ? wallet
          : this.walletService.extractWalletFromUser(user, undefined);

        // Link between user and entity
        link = await this.createUserEntityLink(
          tenantId,
          user,
          entityId,
          entityType,
          nextState,
          _wallet,
          functionName,
          kycWorkflowId,
          typeFunctionUser,
          typeFunctionUser === UserType.BROKER ? idFunctionUser : undefined,
          filterforAssetClass ? _assetClassKey : undefined,
        );
      }

      await endProtectionAgainstRaceCondition(funcName, funcParams);

      return {
        link,
        newLink,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating user-entity link if required',
        'createUserEntityLinkIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve exhaustive list of links between user and entity]
   *
   * By "exhaustive", we mean that parameters need to correspond exactly, including assetClassKey.
   * This means:
   *  - if parameter "assetClassKey" is 'undefined', then link.assetClass needs to be 'undefined'
   *  - if parameter "assetClassKey" is equal to 'classA', then link.assetClass can be 'classA' or 'undefined'
   */
  async exhaustiveListAllUserEntityLinks(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<Array<Link>> {
    try {
      const strictUserEntityLinks: Array<Link> =
        await this.listAllUserEntityLinks(
          tenantId,
          userId,
          userType,
          entityId,
          entityType,
          assetClassKey,
          true, // exhaustive list
          false, // strictList
        );
      return strictUserEntityLinks;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing exhaustive user-entity links',
        'exhaustiveListAllUserEntityLinks',
        false,
        500,
      );
    }
  }

  async strictListAllUserEntityLinksBatch(
    tenantId: string,
    userIds: Array<string>,
    userTypesByUserId: { [userId: string]: UserType },
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<{ [userId: string]: Array<Link> }> {
    try {
      const strictUserEntityLinks: {
        [userId: string]: Array<Link>;
      } = await this.listAllUserEntityLinksBatch(
        tenantId,
        userIds,
        userTypesByUserId,
        entityId,
        entityType,
        assetClassKey,
        false, // exhaustive list
        true, // strictList
      );
      return strictUserEntityLinks;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing batch of strict user-entity links',
        'strictListAllUserEntityLinksBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve strict list of links between user and entity]
   *
   * By "strict", we mean that parameters need to correspond exactly, including assetClassKey.
   * This means:
   *  - if parameter "assetClassKey" is 'undefined', then link.assetClass needs to be 'undefined'
   *  - if parameter "assetClassKey" is equal to 'classA', then link.assetClass needs to be 'classA'
   */
  async strictListAllUserEntityLinks(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<Array<Link>> {
    try {
      const strictUserEntityLinks: Array<Link> =
        await this.listAllUserEntityLinks(
          tenantId,
          userId,
          userType,
          entityId,
          entityType,
          assetClassKey,
          false, // exhaustive list
          true, // strictList
        );
      return strictUserEntityLinks;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing strict user-entity links',
        'strictListAllUserEntityLinks',
        false,
        500,
      );
    }
  }

  async retrieveStrictUserEntityLinkBatch(
    tenantId: string,
    userIds: Array<string>,
    userTypesByUserId: { [userId: string]: UserType },
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<{ [userId: string]: Link }> {
    try {
      const userEntityLinksByUserId: {
        [userId: string]: Array<Link>;
      } = await this.strictListAllUserEntityLinksBatch(
        tenantId,
        userIds,
        userTypesByUserId,
        entityId,
        entityType,
        assetClassKey,
      );

      const userEntityLinkByUserId: {
        [userId: string]: Link;
      } = userIds.reduce(
        (map, userId: string) => ({
          ...map,
          [userId]: this.extractUniqueUserEntityLink(
            userEntityLinksByUserId[userId],
            userId, // Only required for logs
            userTypesByUserId[userId], // Only required for logs
            entityId, // Only required for logs
            entityType, // Only required for logs
            assetClassKey, // Only required for logs
          ),
        }),
        {},
      );

      return userEntityLinkByUserId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving batch of strict user-entity links',
        'retrieveStrictUserEntityLinkBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve strict link between user and entity]
   *
   * By "strict", we mean that parameters need to correspond exactly, including assetClassKey.
   * This means:
   *  - if parameter "assetClassKey" is 'undefined', then link.assetClass needs to be 'undefined'
   *  - if parameter "assetClassKey" is equal to 'classA', then link.assetClass needs to be 'classA'
   */
  async retrieveStrictUserEntityLink(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<Link> {
    try {
      const userEntityLinks: Array<Link> =
        await this.strictListAllUserEntityLinks(
          tenantId,
          userId,
          userType,
          entityId,
          entityType,
          assetClassKey,
        );

      const userEntityLink: Link = this.extractUniqueUserEntityLink(
        userEntityLinks,
        userId, // Only required for logs
        userType, // Only required for logs
        entityId, // Only required for logs
        entityType, // Only required for logs
        assetClassKey, // Only required for logs
      );

      return userEntityLink;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving strict user-entity link',
        'retrieveStrictUserEntityLink',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve strict link between user and entity OR link between user and entity's issuer]
   *
   * This role is mainly used to check if third parties are allowed to act on a given entity
   * - In case entity is a token or a project, third party can be linked directly to entity OR to entity's issuer
   * - In case entity is an issuer or a platform, third party can only be linked directly to entity
   *
   * By "strict", we mean that parameters need to correspond exactly, including assetClassKey.
   * This means:
   *  - if parameter "assetClassKey" is 'undefined', then link.assetClass needs to be 'undefined'
   *  - if parameter "assetClassKey" is equal to 'classA', then link.assetClass needs to be 'classA'
   */
  async retrieveStrictUserEntityLinkOrUserIssuerLink(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    issuerId: string, // Optional, can be undefined IF (entityType !== TOKEN/PROJECT) OR IF we're at the beginning of a tri-partite asset creation flow
    brokerId: string,
  ): Promise<Link> {
    try {
      const [researchedLink, researchedLinkForBroker]: [Link, Link] =
        await this.retrieveStrictUserEntityLinkOrUserIssuerLinkIfExisting(
          tenantId,
          userId,
          userType,
          entityId,
          entityType,
          issuerId, // Optional, can be undefined IF (entityType !== TOKEN/PROJECT) OR IF we're at the beginning of a tri-partite asset creation flow
          brokerId,
          true, // shallExist
        );

      if (brokerId) {
        return researchedLinkForBroker;
      } else {
        return researchedLink;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving strict user-entity link or user-issuer link',
        'retrieveStrictUserEntityLinkOrUserIssuerLink',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve strict link between user and entity OR link between user and entity's issuer if existing]
   *
   * This role is mainly used to check if users are allowed to act on a given entity
   * - In case entity is a token or a project, user can be linked directly to entity OR to entity's issuer
   * - In case entity is an issuer or a platform, user can only be linked directly to entity
   *
   * By "strict", we mean that parameters need to correspond exactly, including assetClassKey.
   * This means:
   *  - if parameter "assetClassKey" is 'undefined', then link.assetClass needs to be 'undefined'
   *  - if parameter "assetClassKey" is equal to 'classA', then link.assetClass needs to be 'classA'
   */
  async retrieveStrictUserEntityLinkOrUserIssuerLinkIfExisting(
    tenantId: string,
    userId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    issuerId: string, // Only required in case entityType === TOKEN or PROJECT
    brokerId: string,
    shallExist: boolean,
  ): Promise<[Link, Link]> {
    try {
      const entityHasAnIssuer: boolean =
        issuerId &&
        (entityType === EntityType.TOKEN || entityType === EntityType.PROJECT);

      // For entity's of type TOKEN or PROJECT:
      //    Check if the user is linked directly to the entity
      //    OR if the user is linked to the entity's issuer
      //
      // For entity's of type ISSUER or PLATFORM:
      //    Check if the third party is linked directly to the entity
      //
      const [userIssuerLinks, userEntityLinks]: [Array<Link>, Array<Link>] =
        await Promise.all([
          entityHasAnIssuer
            ? this.strictListAllUserEntityLinks(
                tenantId,
                userId,
                userType,
                issuerId,
                EntityType.ISSUER,
                undefined, // assetClassKey
              )
            : [],
          this.strictListAllUserEntityLinks(
            tenantId,
            userId,
            userType,
            entityId,
            entityType,
            undefined, // assetClassKey
          ),
        ]);

      let researchedLink: Link;
      if (userEntityLinks.length > 0) {
        // If there is a direct link between the user and the entity, we return it
        researchedLink = this.extractUniqueUserEntityLink(
          userEntityLinks,
          userId,
          userType,
          entityId, // Only required for logs
          entityType, // Only required for logs
          undefined, // assetClassKey
        );
      } else if (entityHasAnIssuer && userIssuerLinks.length > 0) {
        // Otherwise, if there is a direct link between the user and the entity's issuer, we return it
        researchedLink = this.extractUniqueUserEntityLink(
          userIssuerLinks,
          userId,
          userType,
          issuerId, // Only required for logs
          EntityType.ISSUER, // Only required for logs
          undefined, // assetClassKey
        );
      } else {
        // Otherwise, we return undefined
        researchedLink = undefined;
      }

      let researchedLinkForBroker: Link;
      if (brokerId) {
        // If brokerId is defined, we'll filter links to keep only those with correct brokerId
        const userIssuerLinksForBroker = userIssuerLinks.filter(
          (userIssuerLink: Link) =>
            userIssuerLink[LinkKeys.BROKER_ID] === brokerId,
        );
        const userEntityLinksForBroker = userEntityLinks.filter(
          (userEntityLink: Link) =>
            userEntityLink[LinkKeys.BROKER_ID] === brokerId,
        );

        if (userEntityLinksForBroker.length > 0) {
          // If there is a direct link between the user and the entity, we return it
          researchedLinkForBroker = this.extractUniqueUserEntityLink(
            userEntityLinksForBroker,
            userId,
            userType,
            entityId, // Only required for logs
            entityType, // Only required for logs
            undefined, // assetClassKey
          );
        } else if (entityHasAnIssuer && userIssuerLinksForBroker.length > 0) {
          // Otherwise, if there is a direct link between the user and the entity's issuer, we return it
          researchedLinkForBroker = this.extractUniqueUserEntityLink(
            userIssuerLinksForBroker,
            userId,
            userType,
            issuerId, // Only required for logs
            EntityType.ISSUER, // Only required for logs
            undefined, // assetClassKey
          );
        } else {
          // Otherwise, we return undefined
          researchedLinkForBroker = undefined;
        }
      }

      if (
        shallExist &&
        !researchedLink &&
        (!brokerId || !researchedLinkForBroker)
      ) {
        ErrorService.throwError(
          `no link user-${entityType.toLowerCase()} link was found between user ${userId} and ${entityType.toLowerCase()} ${entityId}`,
        );
      }

      return [researchedLink, researchedLinkForBroker];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving strict user-entity link or user-issuer link if existing',
        'retrieveStrictUserEntityLinkOrUserIssuerLinkIfExisting',
        false,
        500,
      );
    }
  }

  extractUniqueUserEntityLink(
    userEntityLinks: Array<Link>,
    userId: string, // Only required for logs
    userType: UserType, // Only required for logs
    entityId: string, // Only required for logs
    entityType: EntityType, // Only required for logs
    assetClassKey: string, // Only required for logs
  ): Link {
    try {
      if (userEntityLinks.length === 0) {
        ErrorService.throwError(
          `no ${userType.toLowerCase()} link was found between user ${userId} and${
            assetClassKey && entityType === EntityType.TOKEN
              ? ` asset class ${assetClassKey} of`
              : ''
          } ${entityType.toLowerCase()} ${entityId || ''}`,
        );
      } else if (userEntityLinks.length > 1) {
        ErrorService.throwError(
          `no unique ${userType.toLowerCase()} link was found between user ${userId} and${
            assetClassKey && entityType === EntityType.TOKEN
              ? ` asset class ${assetClassKey} of`
              : ''
          } ${entityType.toLowerCase()} ${entityId || ''} (${
            userEntityLinks.length
          } were found)`,
        );
      } else {
        return userEntityLinks[0];
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting unique user-entity link',
        'extractUniqueUserEntityLink',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve entity's issuer]
   */
  async retrieveIssuerLinkedToEntity(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<User> {
    try {
      return this.retrieveFirstUserLinkedToEntityIfExisting(
        tenantId,
        UserType.ISSUER,
        entityId,
        entityType,
        true,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer linked to entity',
        'retrieveIssuerLinkedToEntity',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve entity's issuer (if existing)]
   */
  async retrieveIssuerLinkedToEntityIfExisting(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<User> {
    try {
      return this.retrieveFirstUserLinkedToEntityIfExisting(
        tenantId,
        UserType.ISSUER,
        entityId,
        entityType,
        false,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving issuer linked to entity if existing',
        'retrieveIssuerLinkedToEntityIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve first user linked to entity]
   */
  async retrieveFirstUserLinkedToEntity(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
    userType: UserType,
  ): Promise<User> {
    try {
      return this.retrieveFirstUserLinkedToEntityIfExisting(
        tenantId,
        userType,
        entityId,
        entityType,
        true,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        `retrieving first ${userType} linked to entity`,
        'retrieveFirstUserLinkedToEntity',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve first user linked to entity (if existing)]
   *  entityId: ID of entity(token/project) whom we want to retrieve the issuer from
   *
   * This function is used to retrieve an entity's unkque user of a given type in Metadata DB by:
   * 1) retrieving the list of user-entity-links for the entity.
   * 2) Filtering the user-entity-link to retrieve the entity's unique userId.
   * 3) retrieving the user in Metadata DB thanks to the userId.
   *
   */
  async retrieveFirstUserLinkedToEntityIfExisting(
    tenantId: string,
    userType: UserType,
    entityId: string,
    entityType: EntityType,
    shallExist: boolean,
  ): Promise<User> {
    try {
      const userEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          undefined, // userId
          entityId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      if (shallExist && userEntityLinks.length === 0) {
        ErrorService.throwError(
          `no link was found for this ${entityType.toLowerCase()}, including no issuer-${entityType.toLowerCase()} link`,
        );
      }

      const filteredEntityLinks: Array<Link> = userEntityLinks.filter(
        (userEntityLink: Link) =>
          checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            userType,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          ),
      );

      // Fetch users
      const userIds: Array<string> = filteredEntityLinks.map(
        (userEntityLink: Link) => {
          return userEntityLink[LinkKeys.USER_ID];
        },
      );

      const users: Array<User> =
        await this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          userIds,
          true, // includeWallets
        );
      const usersMap = new Map(
        users.map((user) => [user[UserKeys.USER_ID], user]),
      );

      const filteredEntityLinks2: Array<Link> = filteredEntityLinks.filter(
        (userEntityLink2: Link) => {
          const user: User = usersMap.get(userEntityLink2[LinkKeys.USER_ID]);
          if (user?.[UserKeys.USER_TYPE] === userType) {
            return true;
          } else {
            return false;
          }
        },
      );

      // This sorts workflow instances array: [oldest link, ..., newest link]
      // Links are supposed to be already sorted in that same order when retrieved from Workflow-Api, but we do it explicitely here for security reasons
      const sortedEntityLinks: Array<Link> = filteredEntityLinks2.sort(
        (a: Link, b: Link) => {
          const timestampA: number = new Date(a[LinkKeys.CREATED_AT]).getTime();
          const timestampB: number = new Date(b[LinkKeys.CREATED_AT]).getTime();
          return timestampA - timestampB;
        },
      );

      if (shallExist && sortedEntityLinks.length === 0) {
        ErrorService.throwError(
          `no ${userType.toLowerCase()}-${entityType.toLowerCase()} link was found for this ${entityType.toLowerCase()}`,
        );
      } else if (sortedEntityLinks.length > 1) {
        ErrorService.throwError(
          `shall never happen: multiple ${userType.toLowerCase()}-${entityType.toLowerCase()} links (${
            sortedEntityLinks.length
          })`,
        );
      }

      if (sortedEntityLinks.length > 0) {
        const firstUserEntityLink: Link = sortedEntityLinks[0];
        const firstUserId: string = firstUserEntityLink[LinkKeys.USER_ID];
        const firstUser: User = usersMap.get(firstUserId);

        return {
          ...firstUser,
          [UserKeys.LINK]: firstUserEntityLink,
        };
      } else {
        // In case the first user (for example the issuer) has already been deleted, the response will be undefined
        return undefined;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving first user linked to entity if existing',
        'retrieveFirstUserLinkedToEntityIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Check if link is unique]
   * This function is used to check if there is a single link between a user and an entity
   */
  checkLinkIsUnique(
    linkArray: Array<Link>,
    userType: UserType,
    userId: string,
    entityType: EntityType,
    entityId: string,
  ): boolean {
    try {
      if (linkArray.length < 1 && userType !== UserType.SUPERADMIN) {
        ErrorService.throwError(
          `${userType.toLowerCase()} ${userId} is not linked to ${entityType.toLowerCase()} ${entityId}`,
        );
      } else if (linkArray.length > 1) {
        ErrorService.throwError(
          `multiple links between ${userType.toLowerCase()} ${userId} and ${entityType.toLowerCase()} ${entityId}: shall never happen`,
        );
      } else {
        return true;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking link unicity',
        'checkLinkIsUnique',
        false,
        500,
      );
    }
  }

  /**
   * [Check if the investor is onboarded by the broker]
   * This function is used to check if the given investor is onboarded by the specific broker
   */
  async checkUserOnboardedbyBroker(
    tenantId: string,
    user: User,
    entityId: string,
    entityType: EntityType,
    issuerId: string, // Optional, can be undefined IF (entityType !== TOKEN/PROJECT) OR IF we're at the beginning of a tri-partite asset creation flow
    brokerId: string,
  ): Promise<boolean> {
    try {
      // Craft labels required for error messages
      const userLabel = `${user[UserKeys.USER_TYPE].toLowerCase()} with id ${
        user[UserKeys.USER_ID]
      }`;
      const entityLabel = `${entityType.toLowerCase()} with id ${entityId}`;

      const [researchedLink, researchedLinkForBroker]: [Link, Link] =
        await this.retrieveStrictUserEntityLinkOrUserIssuerLinkIfExisting(
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          entityId,
          entityType,
          issuerId, // Optional, can be undefined IF (entityType !== TOKEN/PROJECT) OR IF we're at the beginning of a tri-partite asset creation flow
          brokerId,
          false, // shallExist
        );

      if (!researchedLinkForBroker) {
        if (researchedLink) {
          const verbLabel =
            researchedLink[LinkKeys.STATE] === LinkState.VALIDATED
              ? 'finalized'
              : 'started';
          ErrorService.throwError(
            `${userLabel} has ${verbLabel} his on-boarding for ${entityLabel}, but the on-boarding was not done with the broker`,
          );
        } else {
          ErrorService.throwError(
            `${userLabel} has not been on-boarded for ${entityLabel}`,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking user is onboarded by broker',
        'checkUserOnboardedbyBroker',
        false,
        500,
      );
    }
  }

  /**
   * [Check if links are all linked to a broker]
   * This function is used to check if all the given links are linked to the specific broker
   */
  checkBrokerLinks(linkArray: Array<Link> | Link, brokerId: string): boolean {
    try {
      const links: Array<Link> = Array.isArray(linkArray)
        ? linkArray
        : [linkArray];

      let invalidLink: number;
      let invalidLinkFound: boolean;
      links.map((link) => {
        if (link[LinkKeys.BROKER_ID] && link[LinkKeys.BROKER_ID] !== brokerId) {
          invalidLink = link[LinkKeys.ID];
          invalidLinkFound = true;
        }
      });

      if (invalidLinkFound) {
        ErrorService.throwError(
          `Link with id ${
            invalidLink[LinkKeys.ID]
          } was created by broker with id ${
            invalidLink[LinkKeys.BROKER_ID]
          }. As a consequence, action can not be performed by broker with id ${brokerId}`,
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "checking link's broker id",
        'checkBrokerLinks',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve broker id from a given investor id]
   * This function is used to retrieve the broker id from a given investor id,
   * return undefined if the investor was not onboarded by a broker.
   */
  async retrieveBrokerIdIfExisting(
    tenantId: string,
    investorId: string,
    issuerId: string,
  ): Promise<string> {
    try {
      // Retreive the investor's user-issuer links
      const investorIssuerLinks: Array<Link> =
        await this.strictListAllUserEntityLinks(
          tenantId,
          investorId,
          UserType.INVESTOR,
          issuerId,
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      if (
        investorIssuerLinks &&
        investorIssuerLinks.length > 0 &&
        investorIssuerLinks[0]
      ) {
        return investorIssuerLinks[0][LinkKeys.BROKER_ID];
      } else {
        return undefined;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving broker id if existing',
        'retrieveBrokerIdIfExisting',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of investor ids linked to the third party (verifier | notary | nav manager | broker)]
   * Returns the list of ids of all investors linked to the third party.
   */
  async listAllInvestorIdsLinkedToThirdParty(
    tenantId: string,
    thirdPartyId: string,
    thirdPartyType: UserType,
  ): Promise<{
    [userId: string]: boolean;
  }> {
    try {
      if (
        thirdPartyType !== UserType.VERIFIER &&
        thirdPartyType !== UserType.NOTARY &&
        thirdPartyType !== UserType.UNDERWRITER &&
        thirdPartyType !== UserType.BROKER
      ) {
        ErrorService.throwError(
          `invalid userType for a third party (${thirdPartyType})`,
        );
      }

      // Fetch thirdParty-entity links
      const allThirdPartyEntityLinks: Array<Link> = (
        await this.listAllUserLinks(
          tenantId,
          thirdPartyId, // userId
          thirdPartyType, // userType
          undefined, // entityType
          undefined, // entityId
          undefined, // assetClass
          undefined, // offset
          undefined, // limit
          true, // withMetadata
        )
      ).links;
      // For each entity linked to third party, fetch user-entity links
      const allUserEntityLinks: Array<Array<Link>> = await Promise.all(
        allThirdPartyEntityLinks.map((link: Link) => {
          return this.listAllEntityLinks(
            tenantId,
            link[LinkKeys.ENTITY_ID],
            link[LinkKeys.ENTITY_TYPE],
          );
        }),
      );
      // Merge all user-entity links
      const allUserEntityLinksAsArray: Array<Link> = allUserEntityLinks.reduce(
        (a: Array<Link>, b: Array<Link>) => {
          return [...a, ...b];
        },
        [],
      );

      // Filter investor-entity links
      let allInvestorEntityLinks: Array<Link> =
        allUserEntityLinksAsArray.filter((userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            UserType.INVESTOR,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });

      // For BROKER, filtering out investors that were not onboarded by the broker.
      if (thirdPartyType === UserType.BROKER) {
        allInvestorEntityLinks = allInvestorEntityLinks.filter(
          (link) => link[LinkKeys.BROKER_ID] === thirdPartyId,
        );
      }

      // Create investors map (used to extract list of investor ids in a deduplicated way)
      //  CAUTION: keep in mind that there can be multiple links for a given investor (he can potentially
      //  be linked to 2 different tokens controller by the same third party), which means some links
      //  are potentially overridden in the mapping process.
      const investorsMap: {
        [userId: string]: boolean;
      } = allInvestorEntityLinks.reduce(
        (map, investorEntityLink: Link) => ({
          ...map,
          [investorEntityLink[LinkKeys.USER_ID]]: true,
        }),
        {},
      );

      // Return list of investor ids
      return investorsMap;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all investor ids linked to third party',
        'listAllInvestorIdsLinkedToThirdParty',
        false,
        500,
      );
    }
  }
}
