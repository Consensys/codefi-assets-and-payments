import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { TokenIdentifierEnum, ProjectEnum } from 'src/old/constants/enum';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { keys as TokenKeys, Token } from 'src/types/token';

import { EntityType } from 'src/types/entity';
import { LinkService } from 'src/modules/v2Link/link.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { AssetCreationFlow } from 'src/types/asset';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import { Link, LinkState } from 'src/types/workflow/workflowInstances/link';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';

@Injectable()
export class EntityService {
  constructor(
    private readonly kycCheckHelperService: KycCheckService,
    private readonly linkService: LinkService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly configService: ConfigService,
    private readonly assetDataService: AssetDataService,
  ) {}

  /**
   * [Retrieve list a given entity, as issuer, KYC verifier, NAV manager, Underwriter,Agent or Broker]
   */
  async retrieveEntityIfAuthorized(
    tenantId: string,
    userId: string,
    actionDescription: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      let response: [Project, User, Token, Config];

      if (user[UserKeys.USER_TYPE] === UserType.ADMIN) {
        response = await this.retrieveEntityAsAdmin(
          tenantId,
          userId,
          actionDescription,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
        response = await this.retrieveEntityAsIssuer(
          tenantId,
          userId,
          actionDescription,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
        response = await this.retrieveEntityAsInvestor(
          tenantId,
          userId,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.VERIFIER) {
        response = await this.retrieveEntityAsVerifier(
          tenantId,
          userId,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.NAV_MANAGER) {
        response = await this.retrieveEntityAsNavManager(
          tenantId,
          userId,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.UNDERWRITER) {
        response = await this.retrieveEntityAsUnderwriter(
          tenantId,
          user,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.BROKER) {
        response = await this.retrieveEntityAsBroker(
          tenantId,
          user,
          entityId,
          entityType,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.AGENT) {
        response = await this.retrieveEntityAsAgent(
          tenantId,
          user,
          entityId,
          entityType,
        );
      } else {
        ErrorService.throwError(
          `Only users of type ${UserType.ADMIN}, ${UserType.ISSUER}, ${
            UserType.INVESTOR
          }, ${UserType.VERIFIER}, ${UserType.NAV_MANAGER}, ${
            UserType.UNDERWRITER
          },${UserType.AGENT} or ${
            UserType.BROKER
          } are allowed to retrieve ${entityType.toLowerCase()} with id ${entityId} (${
            user[UserKeys.USER_TYPE]
          } instead)`,
        );
      }

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as issuer, KYC verifier, NAV manager, Underwriter,Agent or Broker',
        'retrieveEntityIfAuthorized',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as admin, or issuer]
   */
  async retrieveEntityAsIssuer(
    tenantId: string,
    userId: string,
    actionDescription: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      // Perform checks
      if (
        entityType === EntityType.PROJECT ||
        entityType === EntityType.TOKEN
      ) {
        if (issuer[UserKeys.USER_ID] !== userId) {
          ErrorService.throwError(
            `only the ${entityType.toLowerCase()}'s issuer ${
              issuer[UserKeys.USER_ID]
            } is authorized to ${actionDescription}`,
          );
        }
      } else if (entityType === EntityType.ISSUER) {
        if (entityId !== userId) {
          throw new Error(
            `only the issuer ${
              issuer[UserKeys.USER_TYPE]
            } is authorized to ${actionDescription}`,
          );
        }
      } else if (entityType === EntityType.PLATFORM) {
        // Ok
      } else {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }

      return [project, issuer, token, config];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as issuer',
        'retrieveEntityAsIssuer',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as admin]
   */
  async retrieveEntityAsAdmin(
    tenantId: string,
    userId: string,
    actionDescription: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      // Perform checks
      if (
        entityType !== EntityType.PROJECT &&
        entityType !== EntityType.TOKEN &&
        entityType !== EntityType.ISSUER &&
        entityType !== EntityType.PLATFORM
      ) {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }

      return [project, issuer, token, config];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as admin',
        'retrieveEntityAsAdmin',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as investor]
   */
  async retrieveEntityAsInvestor(
    tenantId: string,
    investorId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      // Pre-requisite: Verify Investor is indeed linked to the entity (token, project or issuer). If not: error.
      await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        investorId,
        UserType.INVESTOR,
        entityId,
        entityType,
        undefined, // assetClassKey
      );

      const response: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as investor',
        'retrieveEntityAsInvestor',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as KYC verifier]
   */
  async retrieveEntityAsVerifier(
    tenantId: string,
    verifierId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      // Pre-requisite: Verify KYC verifier is indeed linked to the entity (token, project or issuer). If not: error.
      await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        verifierId,
        UserType.VERIFIER,
        entityId,
        entityType,
        undefined, // assetClassKey
      );

      const response: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as verifier',
        'retrieveEntityAsVerifier',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as NAV manager]
   */
  async retrieveEntityAsNavManager(
    tenantId: string,
    navManagerId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      // Pre-requisite: Verify KYC verifier is indeed linked to the entity (token or issuer). If not: error.
      await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        navManagerId,
        UserType.NAV_MANAGER,
        entityId,
        entityType,
        undefined, // assetClassKey
      );

      const response: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as NAV manager',
        'retrieveEntityAsNavManager',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as notary]
   */
  async retrieveEntityAsNotary(
    tenantId: string,
    notary: User,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      // Pre-requisite: Verify KYC verifier is indeed linked to the entity (token or issuer). If not: error.
      await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        notary[UserKeys.USER_ID],
        UserType.NOTARY,
        entityId,
        entityType,
        undefined, // assetClassKey
      );

      const response: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as notary',
        'retrieveEntityAsNotary',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as underwriter]
   */
  async retrieveEntityAsUnderwriter(
    tenantId: string,
    underwriter: User,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      return await this.retrieveEntityAsOnBoardedUser(
        tenantId,
        underwriter,
        entityId,
        entityType,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as underwriter',
        'retrieveEntityAsUnderwriter',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as broker]
   */
  async retrieveEntityAsBroker(
    tenantId: string,
    broker: User,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      return await this.retrieveEntityAsOnBoardedUser(
        tenantId,
        broker,
        entityId,
        entityType,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as broker',
        'retrieveEntityAsBroker',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as agent]
   */
  async retrieveEntityAsAgent(
    tenantId: string,
    agent: User,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      return await this.retrieveEntityAsOnBoardedUser(
        tenantId,
        agent,
        entityId,
        entityType,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as agent',
        'retrieveEntityAsAgent',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve a given entity, as on-boarded user]
   */
  async retrieveEntityAsOnBoardedUser(
    tenantId: string,
    user: User,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.retrieveEntity(tenantId, entityId, entityType);

      // Pre-requisite: Verify user is linked either directly to entity OR to entity's issuer. If not, throw error.
      const userLink: Link =
        await this.linkService.retrieveStrictUserEntityLinkOrUserIssuerLink(
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          entityId,
          entityType,
          issuer?.[UserKeys.USER_ID], // Optional, can be undefined IF (entityType !== TOKEN/PROJECT) OR IF we're at the beginning of a tri-partite asset creation flow
          undefined, // brokerId
        );

      if (userLink[LinkKeys.STATE] === LinkState.VALIDATED) {
        // This condition is very important to avoid an edge case that can occur,
        // where users can end up with incomplete KYC, while they have already been
        // validated in the past.

        // Hare are the steps that can lead to such a situation:
        // 1) Issuer sets 'kycTemplateId1' in his metadata, which means users will require to be validated for KYC template 1
        // 2) Investor gets validated by issuer for KYC template 1
        //      - An issuer-investor link is created with link.state=validated
        //      - A KYC validation is created for KYC template 1
        // 3) KYC template 1 is deleted (TODO: add a protection against this)
        // 4) Issuer sets 'kycTemplateId2' in his metadata, which means users now require to be validated for KYC template 2
        // 5) Issuer still has access to the platform, but now sees his KYC is not complete
        //      - issuer-investor link still has link.state=validated
        //      - A KYC validation is missing for KYC template 2

        // Users in such a situation, which already got on-boarded and validated shall be given
        // access to the requested entity, which is why we have this condition.
        return [project, issuer, token, config];
      }

      /******************** Check if KYC can be bypassed for this token **********************/
      let checkKyc = true;
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__BYPASS_KYC_CHECKS]
      ) {
        checkKyc = false;
      }

      if (checkKyc) {
        if (entityType === EntityType.TOKEN) {
          // User can only retrieve entity if he's been on-boarded (e.g. he validated his KYC)
          await this.kycCheckHelperService.checkKycValidationForTokenOperation(
            tenantId,
            user,
            issuer,
            token,
            config,
            undefined, // assetClassKey
            user[UserKeys.USER_TYPE].toLowerCase(),
          );
        } else if (entityType === EntityType.ISSUER) {
          await this.kycCheckHelperService.checkKycValidationForIssuerOperation(
            tenantId,
            user,
            issuer,
            user[UserKeys.USER_TYPE].toLowerCase(),
          );
        } else {
          ErrorService.throwError(
            `${user[
              UserKeys.USER_TYPE
            ].toLowerCase()}s can only act on entities of type ${
              EntityType.TOKEN
            } or ${EntityType.ISSUER}`,
          );
        }
      }

      return [project, issuer, token, config];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity as on-boarded user',
        'retrieveEntityAsOnBoardedUser',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve list of all links for a given entity, as KYC verifier]
   */
  async retrieveEntity(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<[Project, User, Token, Config]> {
    try {
      let project: Project;
      let issuer: User;
      let token: Token;
      let config: Config;

      // Retrieve entity
      if (entityType === EntityType.PROJECT) {
        issuer = await this.linkService.retrieveIssuerLinkedToEntityIfExisting(
          tenantId,
          entityId,
          entityType,
        );
        project = await this.apiMetadataCallService.retrieveProject(
          tenantId,
          ProjectEnum.projectId,
          entityId,
          true,
        );
      } else if (entityType === EntityType.ISSUER) {
        issuer = await this.apiEntityCallService.fetchEntity(
          tenantId,
          entityId,
          true,
        );
      } else if (entityType === EntityType.TOKEN) {
        issuer = await this.linkService.retrieveIssuerLinkedToEntityIfExisting(
          tenantId,
          entityId,
          entityType,
        );
        token = await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          entityId,
          true,
          undefined,
          undefined,
          true,
        );
      } else if (entityType === EntityType.PLATFORM) {
        config = await this.configService.retrieveTenantConfig(tenantId);
      } else {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }

      return [project, issuer, token, config];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving entity',
        'retrieveEntity',
        false,
        500,
      );
    }
  }

  /**
   * [Check if token can be updated or deleted]
   */
  async checkEntityCanBeUpdatedOrDeleted(
    tenantId: string,
    userId: string,
    entityId: string,
    entityType: EntityType,
    token: Token, // optional (used in case EntityType===TOKEN)
  ): Promise<boolean> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      if (
        user[UserKeys.USER_TYPE] === UserType.SUPERADMIN ||
        user[UserKeys.USER_TYPE] === UserType.ADMIN
      ) {
        // If user of type ADMIN is calling the endpoint, no check is required
        return true;
      }

      // Fetch issuer if existing
      const issuer: User =
        await this.linkService.retrieveIssuerLinkedToEntityIfExisting(
          tenantId,
          entityId,
          entityType,
        );

      // If user is the issuer of the token/project, he can update/delete it
      if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
        // If user of type ISSUER is calling the endpoint, check if he's the one who created the entity
        if (userId === issuer[UserKeys.USER_ID]) {
          return true;
        }
      }

      if (entityType === EntityType.TOKEN) {
        const {
          assetCreationFlow,
          creatorId,
          issuerId,
          reviewerId,
        }: {
          assetCreationFlow: AssetCreationFlow;
          creatorId: string;
          reviewerId: string;
          issuerId: string;
        } = this.assetDataService.retrieveAssetCreationFlowData(
          token,
          token[TokenKeys.TOKEN_ID],
          false, // reviewerIdRequired
        );

        if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
          // In the case of the Bi-party flow, the investor who requested the asset creation can also update/delete the asset
          if (
            user[UserKeys.USER_TYPE] === UserType.INVESTOR &&
            userId === creatorId
          ) {
            return true;
          }
        } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
          // In the case of the Tri-party flow, the underwrtier who initialized the asset creation and the investor who reviews the asset creation can also update/delete the asset
          if (
            user[UserKeys.USER_TYPE] === UserType.UNDERWRITER &&
            userId === creatorId
          ) {
            return true;
          } else if (
            user[UserKeys.USER_TYPE] === UserType.INVESTOR &&
            userId === reviewerId
          ) {
            return true;
          }
        }
      }

      // User is not authorized to update/delete entity
      ErrorService.throwError(
        `the user(${userId}) who wants to update/delete the ${entityType.toLowerCase()} with ID ${entityId} is neither the issuer of the ${entityType.toLowerCase()}, nor the user who created it`,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if entity can be updated/deleted',
        'checkEntityCanBeUpdatedOrDeleted',
        false,
        500,
      );
    }
  }
}
