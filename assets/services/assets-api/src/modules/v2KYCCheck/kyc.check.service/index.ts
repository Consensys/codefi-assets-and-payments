import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { keys as UserKeys, User, UserNature } from 'src/types/user';
import { keys as TokenKeys, Token } from 'src/types/token';
import { EntityType } from 'src/types/entity';
import {
  keys as KycTemplateKeys,
  NATURAL_PERSON_SECTION,
  LEGAL_PERSON_SECTION,
  RawKycTemplate,
} from 'src/types/kyc/template';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { KycGranularity } from 'src/types/kyc/review';
import { LinkService } from 'src/modules/v2Link/link.service';
import { keys as ProjectKeys, Project } from 'src/types/project';
import { keys as ConfigKeys, Config } from 'src/types/config';
import { retrieveEntityId } from 'src/utils/entity';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';

@Injectable()
export class KycCheckService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly apiKycCallService: ApiKycCallService,
    private readonly linkService: LinkService,
  ) {}

  /**
   * Extract the KYC bypass status from entity's (token/issuer) data, depending on the type of KYC (local or global).
   */
  extractKycByPassStatusFromEntity(
    entityType: EntityType,
    project: Project,
    issuer: User,
    token: Token,
    config: Config,
  ): boolean {
    try {
      if (entityType === EntityType.PROJECT) {
        if (
          project &&
          project[ProjectKeys.DATA] &&
          project[ProjectKeys.DATA][ProjectKeys.DATA__BYPASS_KYC_CHECKS]
        ) {
          return true;
        } else {
          return false;
        }
      } else if (entityType === EntityType.ISSUER) {
        if (
          issuer &&
          issuer[UserKeys.DATA] &&
          issuer[UserKeys.DATA][UserKeys.DATA__BYPASS_KYC_CHECKS]
        ) {
          return true;
        } else {
          return false;
        }
      } else if (entityType === EntityType.TOKEN) {
        if (
          token &&
          token[TokenKeys.DATA] &&
          token[TokenKeys.DATA][TokenKeys.DATA__BYPASS_KYC_CHECKS]
        ) {
          return true;
        } else {
          return false;
        }
      } else if (entityType === EntityType.PLATFORM) {
        if (
          config &&
          config[ConfigKeys.DATA] &&
          config[ConfigKeys.DATA][ConfigKeys.DATA__BYPASS_KYC_CHECKS]
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting KYC bypass status from entity',
        'extractKycByPassStatusFromEntity',
        false,
        500,
      );
    }
  }

  /**
   * Extract the kyc template id from token/issuer's data, depending on the
   * type of KYC (project-related, issuer-related, token-related, platform-related).
   *
   * In case the KYC is project-related:
   *  - Retrieve the KYC template from project
   *
   * In case the KYC is issuer-related:
   *  - Retrieve the KYC template from issuer
   *
   * In case the KYC is token-related:
   *  - Retrieve the KYC template from token
   *
   * In case the KYC is platform-related:
   *  - Retrieve the KYC template from platform
   */
  async extractKycTemplateIdFromEntity(
    tenantId: string,
    entityType: EntityType,
    project: Project,
    issuer: User,
    token: Token,
    config: Config,
  ): Promise<string> {
    try {
      let kycTemplateId: string;

      if (entityType === EntityType.PROJECT) {
        if (project && project[ProjectKeys.KYC_TEMPLATE_ID]) {
          kycTemplateId = project[ProjectKeys.KYC_TEMPLATE_ID];
        }
      } else if (entityType === EntityType.ISSUER) {
        if (
          issuer &&
          issuer[UserKeys.DATA] &&
          issuer[UserKeys.DATA][UserKeys.DATA__KYC_TEMPLATE_ID]
        ) {
          kycTemplateId = issuer[UserKeys.DATA][UserKeys.DATA__KYC_TEMPLATE_ID];
        }
      } else if (entityType === EntityType.TOKEN) {
        if (
          token &&
          token[TokenKeys.DATA] &&
          token[TokenKeys.DATA][TokenKeys.DATA__KYC_TEMPLATE_ID]
        ) {
          kycTemplateId =
            token[TokenKeys.DATA][TokenKeys.DATA__KYC_TEMPLATE_ID];
        }
      } else if (entityType === EntityType.PLATFORM) {
        if (
          config &&
          config[ConfigKeys.DATA] &&
          config[ConfigKeys.DATA][ConfigKeys.DATA__KYC_TEMPLATE_ID]
        ) {
          kycTemplateId =
            config[ConfigKeys.DATA][ConfigKeys.DATA__KYC_TEMPLATE_ID];
        }
      } else {
        ErrorService.throwError(`invalid entity type (${entityType})`);
      }

      if (!kycTemplateId) {
        const defaultKycTemplate: RawKycTemplate =
          await this.kycTemplateService.retrieveDefaultCodefiKycTemplate(
            tenantId,
          );
        kycTemplateId = defaultKycTemplate[KycTemplateKeys.TEMPLATE_ID];
      }

      if (!kycTemplateId) {
        ErrorService.throwError(
          `${entityType} has no kycTemplateId (value needs to be defined in data field)`,
        );
      }

      return kycTemplateId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting KYC template from entity',
        'extractKycTemplateIdFromEntity',
        false,
        500,
      );
    }
  }

  retrieveAdaptedKycTemplateTopSectionKeysBatch(users: Array<User>): {
    [userId: string]: Array<string>;
  } {
    try {
      return users.reduce(
        (map, user: User) => ({
          ...map,
          [user[UserKeys.USER_ID]]:
            this.retrieveAdaptedKycTemplateTopSectionKeys(user),
        }),
        {},
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving batch of adapted KYC template top section key',
        'retrieveAdaptedKycTemplateTopSectionKeysBatch',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve adapted KYC template top section key
   *  - If user's nature is NATURAL, return natural person section key
   *  - If user's nature is LEGAL, return legal person section key
   */
  retrieveAdaptedKycTemplateTopSectionKeys(user: User): Array<string> {
    try {
      const templateTopSectionKeys: Array<string> = [];

      if (user[UserKeys.USER_NATURE] === UserNature.NATURAL) {
        templateTopSectionKeys.push(NATURAL_PERSON_SECTION);
      } else if (user[UserKeys.USER_NATURE] === UserNature.LEGAL) {
        templateTopSectionKeys.push(LEGAL_PERSON_SECTION);
      } else {
        ErrorService.throwError(
          `unknown userNature (${user[UserKeys.USER_NATURE]}) for user ${
            user[UserKeys.USER_ID]
          }`,
        );
      }

      return templateTopSectionKeys;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving adapted KYC template top section key',
        'retrieveAdaptedKycTemplateTopSectionKeys',
        false,
        500,
      );
    }
  }

  async checkKycValidationsForTokenOperationBatch(
    tenantId: string,
    submitters: Array<User>,
    issuer: User,
    token: Token,
    config: Config,
    assetClassKey: string,
    userLabel: string,
  ): Promise<boolean> {
    try {
      const [
        [isValidTokenRelatedKyc, tokenRelatedKycInvalidMessage],
        [isValidIssuerRelatedKyc /*, issuerRelatedKycInvalidMessage*/],
        [isValidPlatformRelatedKyc /*, platformRelatedKycInvalidMessage*/],
      ] = await Promise.all([
        this.checkGlobalKycValidationBatch(
          tenantId,
          submitters,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.TOKEN, // entityType
          undefined, // project
          undefined, // issuer (useless here since we check user's KYC at token level - not at issuer level)
          token,
          undefined, // config (useless here since we check user's KYC at token level - not at platform level)
          assetClassKey,
          EntityType.TOKEN, // kycTemplateType
        ),
        this.checkGlobalKycValidationBatch(
          tenantId,
          submitters,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.ISSUER, // entityType
          undefined, // project (useless here since we check user's KYC at issuer level - not at project level)
          issuer,
          undefined, // token (useless here since we check user's KYC at issuer level - not at token level)
          undefined, // config (useless here since we check user's KYC at issuer level - not at platform level)
          undefined, // assetClassKey (useless here since we check user's KYC at issuer level - not at asset class level)
          EntityType.TOKEN, // kycTemplateType
        ),
        this.checkGlobalKycValidationBatch(
          tenantId,
          submitters,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.PLATFORM, // entityType
          undefined, // project (useless here since we check user's KYC at platform level - not at project level)
          undefined, // issuer (useless here since we check user's KYC at platform level - not at issuer level)
          undefined, // token (useless here since we check user's KYC at platform level - not at token level)
          config, // config (useless here since we check user's KYC at platform level - not at platform level)
          undefined, // assetClassKey (useless here since we check user's KYC at issuer level - not at asset class level)
          EntityType.TOKEN, // kycTemplateType
        ),
      ]);

      if (isValidTokenRelatedKyc) {
        this.logger.info(
          {},
          `Batch of ${submitters.length} ${userLabel} validated at token level`,
        );
      } else if (isValidIssuerRelatedKyc) {
        this.logger.info(
          {},
          `Batch of ${submitters.length} ${userLabel} validated at issuer level`,
        );
      } else if (isValidPlatformRelatedKyc) {
        this.logger.info(
          {},
          `Batch of ${submitters.length} ${userLabel} validated at platform level`,
        );
      } else {
        ErrorService.throwError(
          `KYC not complete for at least one of the ${userLabel} included in the batch, for token ${
            token[TokenKeys.TOKEN_ID]
          }: ${tokenRelatedKycInvalidMessage} (unlocked token operations like mint/transfer/burn/hold can only be achieved by verified users)`,
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if batch of users got their KYC validated for a token operation',
        'checkKycValidationsForTokenOperationBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Check KYC validation state for token operation]
   * Verify the user has a validated KYC status to perform a token operation.
   *  - First check if user is validated at token level
   *  - If not, check if user is validated at issuer level (but for token KYC template)
   */
  async checkKycValidationForTokenOperation(
    tenantId: string,
    submitter: User,
    issuer: User,
    token: Token,
    config: Config,
    assetClassKey: string,
    userLabel: string,
  ): Promise<boolean> {
    try {
      const [
        [isValidTokenRelatedKyc, tokenRelatedKycInvalidMessage],
        [isValidIssuerRelatedKyc /*, issuerRelatedKycInvalidMessage*/],
        [isValidPlatformRelatedKyc /*, platformRelatedKycInvalidMessage*/],
      ] = await Promise.all([
        this.checkGlobalKycValidation(
          tenantId,
          submitter,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.TOKEN, // entityType
          undefined, // project
          undefined, // issuer (useless here since we check user's KYC at token level - not at issuer level)
          token,
          undefined, // config (useless here since we check user's KYC at token level - not at platform level)
          assetClassKey,
          EntityType.TOKEN, // kycTemplateType
        ),
        this.checkGlobalKycValidation(
          tenantId,
          submitter,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.ISSUER, // entityType
          undefined, // project (useless here since we check user's KYC at issuer level - not at project level)
          issuer,
          token, // token is required as we extract KYC template from it
          undefined, // config (useless here since we check user's KYC at issuer level - not at platform level)
          undefined, // assetClassKey (useless here since we check user's KYC at issuer level - not at asset class level)
          EntityType.TOKEN, // kycTemplateType
        ),
        this.checkGlobalKycValidation(
          tenantId,
          submitter,
          KycGranularity.TEMPLATE_OR_ELEMENT,
          EntityType.PLATFORM, // entityType
          undefined, // project (useless here since we check user's KYC at platform level - not at project level)
          undefined, // issuer (useless here since we check user's KYC at platform level - not at issuer level)
          token, // token is required as we extract KYC template from it
          config, // config (useless here since we check user's KYC at platform level - not at platform level)
          undefined, // assetClassKey (useless here since we check user's KYC at issuer level - not at asset class level)
          EntityType.TOKEN, // kycTemplateType
        ),
      ]);

      if (isValidTokenRelatedKyc) {
        this.logger.info(
          {},
          `${userLabel} ${
            submitter[UserKeys.USER_ID]
          } validated at token level`,
        );
      } else if (isValidIssuerRelatedKyc) {
        this.logger.info(
          {},
          `${userLabel} ${
            submitter[UserKeys.USER_ID]
          } validated at issuer level`,
        );
      } else if (isValidPlatformRelatedKyc) {
        this.logger.info(
          {},
          `${userLabel} ${
            submitter[UserKeys.USER_ID]
          } validated at platform level`,
        );
      } else {
        ErrorService.throwError(
          `KYC not complete for ${userLabel.toLowerCase()} ${
            submitter[UserKeys.USER_ID]
          } for token ${
            token[TokenKeys.TOKEN_ID]
          }: ${tokenRelatedKycInvalidMessage} (unlocked token operations like mint/transfer/burn/hold can only be achieved by verified users)`,
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if user got his KYC validated for a token operation',
        'checkKycValidationForTokenOperation',
        false,
        500,
      );
    }
  }

  /**
   * [Check KYC validation state for issuer operation]
   * Verify the user has a validated KYC status to perform a token operation.
   *  - First check if user is validated at token level
   *  - If not, check if user is validated at issuer level (but for token KYC template)
   */
  async checkKycValidationForIssuerOperation(
    tenantId: string,
    investor: User,
    issuer: User,
    userLabel: string,
  ): Promise<boolean> {
    try {
      const issuerRelatedKycCheck = await this.checkGlobalKycValidation(
        tenantId,
        investor,
        KycGranularity.TEMPLATE_OR_ELEMENT,
        EntityType.ISSUER, // entityType
        undefined, // project
        issuer,
        undefined, // token (useless here since we check user's KYC at token level - not at token level)
        undefined, // config (useless here since we check user's KYC at token level - not at platform level)
        undefined, // assetClassKey (useless here since we check user's KYC at token level - not at asset class level)
        EntityType.ISSUER, // kycTemplateType
      );
      if (issuerRelatedKycCheck[0]) {
        this.logger.info(
          {},
          `${userLabel} ${
            investor[UserKeys.USER_ID]
          } validated at issuer level`,
        );
      } else {
        ErrorService.throwError(
          `KYC not complete for ${userLabel.toLowerCase()}: ${
            issuerRelatedKycCheck[1]
          } (issuer operations like inviting/validating investors can only be achieved by verified users)`,
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if user got his KYC validated for an issuer operation',
        'checkKycValidationForIssuerOperation',
        false,
        500,
      );
    }
  }

  async checkGlobalKycValidationBatch(
    tenantId: string,
    users: Array<User>,
    granularity: KycGranularity,
    entityType: EntityType,
    project: Project, // (only for project-related KYC)
    issuer: User, // (only for issuer-related KYC)
    token: Token, // (only for token-related KYC)
    config: Config, // (only for platform-related KYC)
    assetClassKey: string, // only used if 'entityType=TOKEN'
    kycTemplateType: EntityType, // (optional - equal to entityType by default)
  ): Promise<[boolean, string]> {
    try {
      const userIds: Array<string> = users.map((user: User) => {
        return user[UserKeys.USER_ID];
      });
      const topSectionKeysByUserId: {
        [userId: string]: Array<string>;
      } = this.retrieveAdaptedKycTemplateTopSectionKeysBatch(users);

      // Retrieve KYC template ID
      const kycTemplateId: string = await this.extractKycTemplateIdFromEntity(
        tenantId,
        kycTemplateType ? kycTemplateType : entityType,
        project,
        issuer,
        token,
        config,
      );

      // Retrieve entityId
      const entityId: string = retrieveEntityId(
        entityType,
        project,
        issuer,
        token,
      );

      // Check KYC validation granularity directly in KYC-API (unique source of truth)
      const [assetClassKycValidationResponse, globalKycValidationResponse]: [
        [boolean, string],
        [boolean, string],
      ] = await Promise.all([
        assetClassKey
          ? this.apiKycCallService.checkBatchKycValidations(
              tenantId,
              userIds,
              entityId,
              assetClassKey,
              kycTemplateId,
              topSectionKeysByUserId,
              granularity,
            )
          : [false, ''],
        this.apiKycCallService.checkBatchKycValidations(
          tenantId,
          userIds,
          entityId,
          undefined, // assetClassKey
          kycTemplateId,
          topSectionKeysByUserId,
          granularity,
        ),
      ]);

      if (assetClassKycValidationResponse[0]) {
        return assetClassKycValidationResponse;
      } else {
        return globalKycValidationResponse;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if batch of users got their KYC validated either for the whole entity or for the specific asset class',
        'checkGlobalKycValidationBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Check KYC validation state]
   * Verify the user has a validated KYC status.
   *  - userId: ID of the user whom status is checked
   *  - granularity: required granularity of the KYC validation (TEMPLATE_ONLY, ELEMENT_ONLY, TEMPLATE_OR_TOKEN, TEMPLATE_AND_TOKEN)
   *  - entityType: Whether the entity linked to the investor is an issuer or a token.
   *  - project: ID of the project the check is destined for (only for project-related KYC)
   *  - issuer: ID of the issuer the check is destined for (only for issuer-related KYC)
   *  - token: token the check is destined for (only for token-related KYC)
   *  - config: config of the platform the check is destined for (only for platform-related KYC)
   *  - checkEntityLinkStatus: If true, KYC check is performed in KYC-API + in Workflow-API. If false, check is performed only in KYC-API.
   *  - userEntityLink: user-entity link, retrieved from Workflow-API (only if checkEntityLinkStatus === 'true')
   */
  async checkGlobalKycValidation(
    tenantId: string,
    user: User,
    granularity: KycGranularity,
    entityType: EntityType,
    project: Project, // (only for project-related KYC)
    issuer: User, // (only for issuer-related KYC)
    token: Token, // (only for token-related KYC)
    config: Config, // (only for platform-related KYC)
    assetClassKey: string, // only used if 'entityType=TOKEN'
    kycTemplateType: EntityType, // (optional - equal to entityType by default)
  ): Promise<[boolean, string]> {
    try {
      const templateTopSectionKeys: Array<string> =
        this.retrieveAdaptedKycTemplateTopSectionKeys(user);

      // Retrieve KYC template ID
      const kycTemplateId: string = await this.extractKycTemplateIdFromEntity(
        tenantId,
        kycTemplateType ? kycTemplateType : entityType,
        project,
        issuer,
        token,
        config,
      );

      // Retrieve entityId
      const entityId: string = retrieveEntityId(
        entityType,
        project,
        issuer,
        token,
      );

      // Check KYC validation granularity directly in KYC-API (unique source of truth)
      const [assetClassKycValidationResponse, globalKycValidationResponse]: [
        [boolean, string],
        [boolean, string],
      ] = await Promise.all([
        assetClassKey
          ? this.apiKycCallService.checkKycValidation(
              tenantId,
              user[UserKeys.USER_ID],
              entityId,
              assetClassKey,
              kycTemplateId,
              templateTopSectionKeys,
              granularity,
            )
          : [false, ''],
        this.apiKycCallService.checkKycValidation(
          tenantId,
          user[UserKeys.USER_ID],
          entityId,
          undefined, // assetClassKey
          kycTemplateId,
          templateTopSectionKeys,
          granularity,
        ),
      ]);

      if (assetClassKycValidationResponse[0]) {
        return assetClassKycValidationResponse;
      } else {
        return globalKycValidationResponse;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if user got his KYC validated either for the whole entity or for the specific asset class',
        'checkGlobalKycValidation',
        false,
        500,
      );
    }
  }
}
