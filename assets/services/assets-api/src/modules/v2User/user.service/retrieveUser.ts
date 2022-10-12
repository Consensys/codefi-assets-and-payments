import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import {
  TokenIdentifierEnum,
  ProjectEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import { EntityEnum, keys as UserKeys, User, UserType } from 'src/types/user';
import { UserTokenData, UserProjectData } from 'src/types/userEntityData';
import { ContractDeployed, keys as TokenKeys, Token } from 'src/types/token';

import { LinkService } from 'src/modules/v2Link/link.service';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import {
  ERC20Balances,
  ERC721Balances,
  ERC1400Balances,
} from 'src/types/balance';
import { UserVehiclesListingService } from './listAllUserVehicles';
import { EntityType } from 'src/types/entity';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { setToLowerCase } from 'src/utils/case';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { EthService, EthServiceType } from 'src/types/ethService';
import { keys as UserEntityDataKeys } from 'src/types/userEntityData';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class UserRetrievalService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly userVehiclesListingService: UserVehiclesListingService,
    private readonly linkService: LinkService,
    private readonly balanceService: BalanceService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly partitionService: PartitionService,
    private readonly walletService: WalletService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly ethHelperService: EthHelperService,
    private readonly entityService: EntityService,
  ) {}

  /**
   * [Retrieve a platform admin]
   */
  async retrievePlatformAdmin(tenantId: string): Promise<User> {
    try {
      const adminList: Array<User> =
        await this.apiEntityCallService.fetchFilteredEntities(
          tenantId,
          EntityEnum.userType,
          UserType.ADMIN,
          true, // includeWallets
        );

      if (adminList.length < 1) {
        ErrorService.throwError('shall never happen, no admin on the platform');
      }

      return adminList[0];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving platform admin',
        'retrievePlatformAdmin',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a specific user]
   */
  async retrieveUser(
    tenantId: string,
    reviewerId: string,
    reviewer: User,
    callerId: string, // (only required if tokenId is defined)
    userToRetrieveId: string,
    tokenId: string, // optional
    assetClassKey: string, // optional
    withBalances: boolean, // optional
    withVehicles: boolean, // optional
    withEthBalance: boolean, // optional
    projectId: string, // optional
    issuerId: string, //optional
  ): Promise<User> {
    try {
      let entityId: string;
      let entityType: EntityType;
      const reviewerType: UserType = reviewer[UserKeys.USER_TYPE];
      if (tokenId && projectId) {
        ErrorService.throwError(
          'token-related data and project-related data can not be queried both with the same API call',
        );
      } else if (tokenId) {
        entityId = tokenId;
        entityType = EntityType.TOKEN;
      } else if (projectId) {
        entityId = projectId;
        entityType = EntityType.PROJECT;
      } else if (issuerId) {
        entityId = issuerId;
        entityType = EntityType.ISSUER;
      }

      let userToRetrieve: User;
      if (userToRetrieveId === reviewerId) {
        this.logger.info({}, 'user is allowed to query his own info\n');
        userToRetrieve = reviewer;
      } else {
        // Thise function is called to check if reviewer is allowed to retrieve user
        userToRetrieve = await this.retrieveUserIfAuthorized(
          tenantId,
          reviewerId,
          reviewerType,
          entityId,
          entityType,
          userToRetrieveId,
        );
      }

      // FIXME: GAUTHIER

      // Optional - pre-list all token balances and store them in cache
      if (tokenId && withBalances) {
        await this.balanceService.preListAllBalancesForUserToken(
          tenantId,
          callerId,
          userToRetrieveId,
          userToRetrieve[UserKeys.USER_TYPE],
          tokenId,
        );
      }

      // Retrieve user
      const fullUserToRetrieve: User = await this.retrieveFullUser({
        tenantId,
        callerId,
        userId: userToRetrieveId,
        user: userToRetrieve,
        entityId,
        entityType,
        assetClassKey: setToLowerCase(assetClassKey),
        withVehicles,
        withBalances,
        withEthBalance,
        appendEntityInfo: true,
      });

      return fullUserToRetrieve;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user',
        'retrieveUser',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a user if authorized]
   */
  async retrieveUserIfAuthorized(
    tenantId: string,
    reviewerId: string,
    reviewerType: UserType,
    entityId: string,
    entityType: EntityType,
    userToRetrieveId: string,
  ): Promise<User> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userToRetrieveId,
        true,
      );

      if (
        reviewerType === UserType.SUPERADMIN ||
        reviewerType === UserType.ADMIN
      ) {
        // No checks to make for SUPERADMIN or ADMIN
        return user;
      }

      if (
        reviewerType !== UserType.ISSUER &&
        reviewerType !== UserType.UNDERWRITER &&
        reviewerType !== UserType.BROKER &&
        reviewerType !== UserType.AGENT &&
        reviewerType !== UserType.VERIFIER
      ) {
        ErrorService.throwError(
          `user with type ${reviewerType} not authorized to retrieve other users than himself\n`,
        );
      }

      if (!entityId) {
        ErrorService.throwError(
          'a third party can only retrieve users which are linked either to issuer, token, or project',
        );
      }

      // Check if third party is authorized to retrieve entity
      await this.entityService.retrieveEntityIfAuthorized(
        tenantId,
        reviewerId,
        'retrieve user if authorized',
        entityId,
        entityType,
      );

      // Check if user is linked to entity
      let userEntityLinks: Array<Link> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.entityIdAndUserId,
          undefined, // userEntityLinkId
          undefined, // idempotencyKey
          userToRetrieveId,
          entityId,
          undefined, // objectId
          undefined, // entityType
          WorkflowType.LINK,
          undefined, // otherWorkflowType
          false,
        );

      // If the reviewer is a broker, make sure the link contains the correct brokerId
      if (reviewerType === UserType.BROKER) {
        userEntityLinks = userEntityLinks.filter(
          (link: Link) => link[LinkKeys.BROKER_ID] === reviewerId,
        );
      }

      if (userEntityLinks.length < 1) {
        ErrorService.throwError(
          `user with ID ${userToRetrieveId} is not linked to ${entityType.toLowerCase()} with ID ${entityId}, thus can not be retrieved by ${reviewerType.toLowerCase()} with ID ${reviewerId}`,
        );
      }
      return user;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user if authorized',
        'retrieveUserIfAuthorized',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a specific user] // CAUTION: RECURSIVE FUNCTION
   */
  async retrieveFullUser({
    tenantId,
    callerId,
    userId,
    user,
    entityId,
    entityType,
    assetClassKey,
    withVehicles,
    withBalances,
    withEthBalance,
    appendEntityInfo,
  }: {
    tenantId: string;
    callerId?: string; // (only required if tokenId is defined)
    userId: string;
    entityType: EntityType;
    entityId?: string;
    user?: User;
    assetClassKey?: string; // only used if 'tokenCategory=HYBRID'
    withVehicles?: boolean;
    withBalances?: boolean;
    withEthBalance?: boolean;
    appendEntityInfo?: boolean;
  }): Promise<User> {
    try {
      if (!user) {
        user = await this.apiEntityCallService.fetchEntity(
          tenantId,
          userId,
          true,
        );
      }

      if (!entityId) {
        if (withVehicles) {
          user[UserKeys.VEHICLES] =
            await this.userVehiclesListingService.listAllUsersVehicles(
              tenantId,
              user[UserKeys.USER_ID],
            );
        }

        return user;
      } else {
        if (entityType === EntityType.TOKEN) {
          const token = await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            entityId,
            true,
            undefined,
            undefined,
            true,
          );

          const userTokenRelatedData: UserTokenData =
            await this.retrieveUserTokenRelatedData(
              tenantId,
              callerId,
              user,
              token,
              assetClassKey,
              withVehicles,
              withBalances,
              withEthBalance,
            );

          let tokenRelatedData: Token | UserTokenData;
          if (appendEntityInfo) {
            tokenRelatedData = {
              ...token,
              ...userTokenRelatedData,
            };
          } else {
            tokenRelatedData = {
              ...userTokenRelatedData,
            };
          }

          return {
            ...user,
            [UserKeys.TOKEN_RELATED_DATA]: {
              ...tokenRelatedData,
            },
          };
        } else if (entityType === EntityType.PROJECT) {
          const project: Project =
            await this.apiMetadataCallService.retrieveProject(
              tenantId,
              ProjectEnum.projectId,
              entityId,
              true,
            );

          const userProjectRelatedData: UserProjectData =
            await this.retrieveUserProjectRelatedData(
              tenantId,
              user,
              project,
              withVehicles,
            );

          let projectRelatedData: Project | UserProjectData;
          if (appendEntityInfo) {
            projectRelatedData = {
              ...project,
              ...userProjectRelatedData,
            };
          } else {
            projectRelatedData = {
              ...userProjectRelatedData,
            };
          }

          return {
            ...user,
            [UserKeys.PROJECT_RELATED_DATA]: {
              ...projectRelatedData,
            },
          };
        }
        if (entityType === EntityType.ISSUER) {
          return user;
        } else {
          ErrorService.throwError(`invalid entity type: ${entityType}`);
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving full user',
        'retrieveFullUser',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve user's token-related data]
   *
   * Token-related data contains:
   *  - the link between the user and the token
   *  - the actions history related to this token
   *  - the list of user's vehicles linked to this token
   *  - the user's token balances
   */
  async retrieveUserTokenRelatedData(
    tenantId: string,
    callerId: string,
    user: User,
    token: Token,
    assetClassKey: string, // [OPTIONAL] only used if 'tokenCategory=HYBRID'
    withVehicles: boolean,
    withBalances: boolean,
    withEthBalance: boolean,
  ): Promise<UserTokenData> {
    try {
      if (
        assetClassKey &&
        !this.partitionService.checkTokenClassIsValid(token, assetClassKey)
      ) {
        ErrorService.throwError(
          `invlid parameter, asset class ${assetClassKey} doesn't belong to list of token classes`,
        );
      }

      const userTokenLinks: Array<Link> =
        await this.linkService.exhaustiveListAllUserEntityLinks(
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          assetClassKey,
        );

      const actionsList: Array<Action> =
        await this.workflowService.listAllUserTokenWorkflowInstances(
          tenantId,
          user[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          assetClassKey,
          WorkflowType.ACTION,
          WorkflowType.ORDER, // otherWorkflowType
        );

      const ordersList: Array<Order> =
        await this.workflowService.listAllUserTokenWorkflowInstances(
          tenantId,
          user[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          assetClassKey,
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
        );

      let allFormattedVehicles: Array<User>;
      if (withVehicles) {
        const allVehicles: Array<User> =
          await this.userVehiclesListingService.listAllUsersVehicles(
            tenantId,
            user[UserKeys.USER_ID],
          );

        const allLinkedVehiclesOrUndefined: Array<User | undefined> =
          await Promise.all(
            allVehicles.map((vehicle: User) => {
              return this.linkService
                .exhaustiveListAllUserEntityLinks(
                  tenantId,
                  vehicle[UserKeys.USER_ID],
                  UserType.VEHICLE,
                  token[TokenKeys.TOKEN_ID],
                  EntityType.TOKEN,
                  assetClassKey,
                )
                .then((vehicleEntityLinks: Array<Link>) => {
                  return vehicleEntityLinks.length > 0 ? vehicle : undefined;
                });
            }),
          );

        const allLinkedVehicles: Array<User> =
          allLinkedVehiclesOrUndefined.filter((linkedVehicle) => {
            return linkedVehicle;
          });

        allFormattedVehicles = await Promise.all(
          allLinkedVehicles.map((vehicle: User) => {
            return this.retrieveUserTokenRelatedData(
              tenantId,
              callerId,
              vehicle,
              token,
              assetClassKey,
              false, // _withVehicles
              withBalances,
              withEthBalance,
            ).then((vehicleTokenRelatedData: UserTokenData) => {
              return {
                ...vehicle,
                [UserKeys.TOKEN_RELATED_DATA]: {
                  ...vehicleTokenRelatedData,
                },
              };
            });
          }),
        );
      }

      // ON-CHAIN DATA
      let allBalances: ERC20Balances | ERC721Balances | ERC1400Balances;
      let [onChainAllowlisted, onChainBlocklisted]: [boolean, boolean] = [
        undefined,
        undefined,
      ];
      // If token is deployed (address is defined), retrieve on-chain data
      // If token is still being deployed (tx pending), token.defaultContractAddress is null and retrieving on-chain data will fail
      if (token[TokenKeys.DEFAULT_DEPLOYMENT] && withBalances) {
        const ethService: EthService =
          await this.ethHelperService.createEthService(
            tenantId,
            EthServiceType.WEB3,
            token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
            token[TokenKeys.DEFAULT_NETWORK_KEY],
            false, // networkShallExist
          );

        if (ethService) {
          // ethService can be undefined in case network doesn't exist anymore or is not alive

          // Retrieve token extension (if any)
          const extensionContract: ContractDeployed =
            await this.apiSCCallService.retrieveTokenExtension(
              callerId,
              ethService,
              token[TokenKeys.DEFAULT_DEPLOYMENT],
            );

          // Retrieve balances
          if (userTokenLinks.length > 0) {
            allBalances =
              await this.balanceService.listAllUserBalancesForAnyToken(
                tenantId,
                callerId,
                user,
                userTokenLinks,
                token,
                assetClassKey,
                withEthBalance,
                extensionContract.deployed,
              );
          }

          // Retrieve on-chain allowlist/blocklist status
          //todo
          if (extensionContract.deployed && userTokenLinks.length > 0) {
            const wallet: Wallet =
              await this.walletService.extractWalletFromUserEntityLinks(
                user,
                userTokenLinks,
                assetClassKey,
              );
            [onChainAllowlisted, onChainBlocklisted] = await Promise.all([
              this.apiSCCallService.isAllowlisted(
                callerId,
                wallet[WalletKeys.WALLET_ADDRESS],
                token[TokenKeys.DEFAULT_DEPLOYMENT],
                ethService,
              ),
              this.apiSCCallService.isBlocklisted(
                callerId,
                wallet[WalletKeys.WALLET_ADDRESS],
                token[TokenKeys.DEFAULT_DEPLOYMENT],
                ethService,
              ),
            ]);
          }
        }
      }

      return {
        [UserEntityDataKeys.LINKS]: userTokenLinks,
        [UserEntityDataKeys.TOKEN_ACTIONS]: actionsList,
        [UserEntityDataKeys.TOKEN_ORDERS]: ordersList,
        [UserEntityDataKeys.VEHICLES]: allFormattedVehicles,
        [UserEntityDataKeys.BALANCES]: allBalances,
        [UserEntityDataKeys.ONCHAIN_ALLOWLIST]: onChainAllowlisted,
        [UserEntityDataKeys.ONCHAIN_BLOCKLIST]: onChainBlocklisted,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "retrieving user's token related data",
        'retrieveUserTokenRelatedData',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve user's project-related data]
   *
   * Project-related data contains:
   *  - the link between the user and the project
   *  - the list of user's vehicles linked to this project
   */
  async retrieveUserProjectRelatedData(
    tenantId: string,
    user: User,
    project: Project,
    withVehicles: boolean,
  ): Promise<UserProjectData> {
    try {
      const userProjectLinks: Array<Link> =
        await this.linkService.exhaustiveListAllUserEntityLinks(
          tenantId,
          user[UserKeys.USER_ID],
          UserType.INVESTOR,
          project[ProjectKeys.PROJECT_ID],
          EntityType.PROJECT,
          undefined, // assetClassKey
        );

      let allFormattedVehicles: Array<User>;
      if (withVehicles) {
        const allVehicles: Array<User> =
          await this.userVehiclesListingService.listAllUsersVehicles(
            tenantId,
            user[UserKeys.USER_ID],
          );

        const allLinkedVehiclesOrUndefined: Array<User | undefined> =
          await Promise.all(
            allVehicles.map((vehicle: User) => {
              return this.linkService
                .exhaustiveListAllUserEntityLinks(
                  tenantId,
                  vehicle[UserKeys.USER_ID],
                  UserType.VEHICLE,
                  project[ProjectKeys.PROJECT_ID],
                  EntityType.PROJECT,
                  undefined, // assetClassKey
                )
                .then((vehicleEntityLinks: Array<Link>) => {
                  return vehicleEntityLinks.length > 0 ? vehicle : undefined;
                });
            }),
          );

        const allLinkedVehicles: Array<User> =
          allLinkedVehiclesOrUndefined.filter((linkedVehicle) => {
            return linkedVehicle;
          });

        allFormattedVehicles = await Promise.all(
          allLinkedVehicles.map((vehicle: User) => {
            return this.retrieveUserProjectRelatedData(
              tenantId,
              vehicle,
              project,
              false, // _withVehicles
            ).then((vehicleProjectRelatedData: UserProjectData) => {
              return {
                ...vehicle,
                [UserKeys.PROJECT_RELATED_DATA]: {
                  ...vehicleProjectRelatedData,
                },
              };
            });
          }),
        );
      }

      return {
        [UserEntityDataKeys.LINKS]: userProjectLinks,
        [UserEntityDataKeys.VEHICLES]: allFormattedVehicles,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "retrieving user's project related data",
        'retrieveUserProjectRelatedData',
        false,
        500,
      );
    }
  }
}
