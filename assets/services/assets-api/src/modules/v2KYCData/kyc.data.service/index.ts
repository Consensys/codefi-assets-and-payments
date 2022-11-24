import { Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';

import { EntityType, entityTypeToKycType } from 'src/types/entity';
import ErrorService from 'src/utils/errorService';
import { LinkService } from 'src/modules/v2Link/link.service';
import { User, UserType } from 'src/types/user';
import { Token } from 'src/types/token';
import { TemplateEnum, ReviewEnum } from 'src/old/constants/enum';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import {
  keys as KycTemplateKeys,
  RawKycTemplate,
  KycTemplate,
  KycTemplateTopSection,
  KycTemplateSection,
} from 'src/types/kyc/template';
import {
  keys as KycElementKeys,
  KycElement,
  KycElementInstance,
  KycElementAndElementInstance,
} from 'src/types/kyc/element';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import {
  keys as KycReviewKeys,
  KycReview,
  ReviewStatus,
  ReviewScope,
  ClientCategory,
  RiskProfile,
  KycGranularity,
} from 'src/types/kyc/review';
import {
  DeleteKycDataOutput,
  SaveKycDataAsSubmitterOutput,
} from '../kyc.data.dto';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { checkLinkStateValidForUserType } from 'src/utils/checks/links';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { retrieveEntityId } from 'src/utils/entity';
import { keys as KycDataKeys, KycDataResponse } from 'src/types/kyc/data';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class KYCDataService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly entityService: EntityService,
    private readonly kycCheckHelperService: KycCheckService,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly linkService: LinkService,
    private readonly apiKycCallService: ApiKycCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Create KYC element instances]
   */
  async createKycElementInstances(
    tenantId: string,
    userId: string,
    userEmail: string,
    elementInstances: Array<{
      [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
      [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
      [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
    }>,
  ): Promise<SaveKycDataAsSubmitterOutput> {
    try {
      const newElementInstances: Array<{
        [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
        [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
        [KycElementKeys.ELEMENT_INSTANCE_USER_ID]: string;
        [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
      }> = [];

      for (const elementInstance of elementInstances) {
        const newElementInstance: {
          [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
          [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
          [KycElementKeys.ELEMENT_INSTANCE_USER_ID]: string;
          [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
        } = {
          ...elementInstance,
          [KycElementKeys.ELEMENT_INSTANCE_USER_ID]: userId,
        };
        newElementInstances.push(newElementInstance);
      }

      const kycElementInstanceCreationResponses: Array<
        [KycElementInstance, boolean]
      > = await this.apiKycCallService.createKycElementsInstances(
        tenantId,
        newElementInstances,
        userId,
        userEmail,
      );

      const formattedElementInstances: Array<{
        elementInstance: KycElementInstance;
        newElementInstance: boolean;
      }> = kycElementInstanceCreationResponses.map(
        (kycElementInstanceCreationResponse) => {
          return {
            elementInstance: kycElementInstanceCreationResponse[0],
            newElementInstance: kycElementInstanceCreationResponse[1],
          };
        },
      );

      return {
        elementInstances: formattedElementInstances,
        message: `${formattedElementInstances.length} KYC element instance(s) saved successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'create KYC element Instances',
        'createElementInstances',
        false,
        500,
      );
    }
  }

  /**
   * Create a KYC review at template level, thus allowing submitter to bypass the KYC workflow]
   *
   * AllowListing a user off-chain means creating a "KycReview" object in the KYC DB.
   */
  async createOrUpdateKycReviewForTemplate(
    tenantId: string,
    submitterId: string,
    entityType: EntityType,
    project: Project,
    issuer: User,
    token: Token,
    config: Config,
    assetClassKey: string,
    clientCategory: ClientCategory,
    riskProfile: RiskProfile,
    validityDate: Date,
    comment: string,
  ): Promise<[KycReview, boolean]> {
    try {
      // Retrieve entityId
      const entityId: string = retrieveEntityId(
        entityType,
        project,
        issuer,
        token,
      );

      // Retrieve template ID
      const templateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project, // project (only for project-related KYC)
          issuer, // issuer (only for issuer-related KYC)
          token, // token (only for token-related KYC)
          config, // platform config (only for platform-related KYC)
        );

      // Retrieve KYC template review (if any)
      const templateReviews: Array<KycReview> =
        await this.apiKycCallService.retrieveKycReviews(
          tenantId,
          ReviewEnum.objectIdAndEntityIdAndInvestorId,
          templateId,
          entityId,
          assetClassKey,
          submitterId,
        );

      if (templateReviews && templateReviews.length === 0) {
        // Case 1: no review --> Create new KYC review

        // Prepare KYC review
        const kycReviews = [
          {
            [KycReviewKeys.REVIEW_SCOPE]: ReviewScope.TEMPLATE,
            [KycReviewKeys.REVIEW_ENTITY_ID]: entityId,
            [KycReviewKeys.REVIEW_ENTITY_CLASS]: assetClassKey,
            [KycReviewKeys.REVIEW_ENTITY_TYPE]: entityType,
            [KycReviewKeys.REVIEW_OBJECT_ID]: templateId,
            [KycReviewKeys.REVIEW_INVESTOR_ID]: submitterId,
            [KycReviewKeys.REVIEW_STATUS]: ReviewStatus.VALIDATED,
            [KycReviewKeys.REVIEW_CATEGORY]: clientCategory
              ? clientCategory
              : undefined,
            [KycReviewKeys.REVIEW_RISK_PROFILE]: riskProfile
              ? riskProfile
              : undefined,
            [KycReviewKeys.REVIEW_VALIDITY_DATE]: validityDate
              ? validityDate
              : undefined,
            [KycReviewKeys.REVIEW_COMMENT]: comment ? comment : undefined,
          },
        ];

        // Create KYC review
        const response: Array<[KycReview, boolean]> =
          await this.apiKycCallService.createKycReviews(tenantId, kycReviews);

        if (response.length !== 1) {
          ErrorService.throwError(
            `number of created KYC reviews shall be equal to 1 (${response.length} instead)`,
          );
        }
        return response[0];
      } else if (templateReviews && templateReviews.length === 1) {
        // Case 2: existing review --> Update existing KYC review

        // -------------> TODO
        // Prepare KYC review
        const currentTemplateReview: KycReview = templateReviews[0];

        const kycReviews = [
          {
            [KycReviewKeys.DEPRECATED_REVIEW_ID]:
              currentTemplateReview[KycReviewKeys.REVIEW_ID],
            [KycReviewKeys.REVIEW_STATUS]:
              currentTemplateReview[KycReviewKeys.REVIEW_STATUS],
            [KycReviewKeys.REVIEW_CATEGORY]: clientCategory
              ? clientCategory
              : currentTemplateReview[KycReviewKeys.REVIEW_CATEGORY]
              ? currentTemplateReview[KycReviewKeys.REVIEW_CATEGORY]
              : undefined,
            [KycReviewKeys.REVIEW_RISK_PROFILE]: riskProfile
              ? riskProfile
              : currentTemplateReview[KycReviewKeys.REVIEW_RISK_PROFILE]
              ? currentTemplateReview[KycReviewKeys.REVIEW_RISK_PROFILE]
              : undefined,
            [KycReviewKeys.REVIEW_VALIDITY_DATE]: validityDate
              ? validityDate
              : currentTemplateReview[KycReviewKeys.REVIEW_VALIDITY_DATE]
              ? currentTemplateReview[KycReviewKeys.REVIEW_VALIDITY_DATE]
              : undefined,
            [KycReviewKeys.REVIEW_COMMENT]: comment
              ? comment
              : currentTemplateReview[KycReviewKeys.REVIEW_COMMENT]
              ? currentTemplateReview[KycReviewKeys.REVIEW_COMMENT]
              : undefined,
          },
        ];

        // Create KYC review
        const response: Array<KycReview> =
          await this.apiKycCallService.updateKycReviews(tenantId, kycReviews);

        if (response.length !== 1) {
          ErrorService.throwError(
            `number of updated KYC reviews shall be equal to 1 (${response.length} instead)`,
          );
        }
        return [response[0], false];
      } else if (templateReviews && templateReviews.length > 1) {
        ErrorService.throwError(
          'shall never happen: more than 1 KYC template review',
        );
      } else {
        ErrorService.throwError(
          'shall never happen: negative length for array',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating or updating KYC review for template',
        'createOrUpdateKycReviewForTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Create KYC reviews for KYC element instances]
   *
   * Once an investor's submitted KYC element instances, he needs to authorize the issuer to
   * access those elements.
   * This can be achieved by creating KYC reviews, e.g. links between KYC element instances
   * and the entity (token/issuer)
   * The status of the KYC reviews neeeds to be SUBMITTED at creation.
   */
  async createKycReviewsForElementInstances(
    tenantId: string,
    kycElementInstancesMapping: {
      [elementKey: string]: KycElementInstance;
    },
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<Array<[KycReview, boolean]>> {
    try {
      const elementInstances: Array<KycElementInstance> = [];
      Object.keys(kycElementInstancesMapping).map((elementKey: string) => {
        elementInstances.push(kycElementInstancesMapping[elementKey]);
      });

      if (elementInstances.length <= 0) {
        ErrorService.throwError(
          'array of KYC element instances shall not be empty',
        );
      }

      // Select all element instances requiring to be shared (by creating a KYCC review)
      const notSharedElementInstances = elementInstances.filter(
        (elementInstance: KycElementInstance) => {
          return (
            elementInstance[KycElementKeys.ELEMENT_INSTANCE_REVIEW_STATUS] ===
            ReviewStatus.NOT_SHARED
          );
        },
      );

      // Prepare KYC reviews
      const kycReviews: Array<{
        objectId: string;
        entityId: string;
        entityType: EntityType;
        entityClass: string;
        status: ReviewStatus;
        scope: ReviewScope;
      }> = notSharedElementInstances.map(
        (elementInstance: KycElementInstance) => {
          return {
            objectId: elementInstance[KycElementKeys.ELEMENT_INSTANCE_ID],
            entityId: entityId,
            entityType,
            entityClass: assetClassKey || undefined,
            status: ReviewStatus.SUBMITTED,
            scope: ReviewScope.ELEMENT_INSTANCE,
          };
        },
      );

      // Create KYC reviews
      if (kycReviews.length > 0) {
        const response: Array<[KycReview, boolean]> =
          await this.apiKycCallService.createKycReviews(tenantId, kycReviews);
        return response;
      } else {
        return [];
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating KYC reviews for element instances',
        'createKycReviewsForElementInstances',
        false,
        500,
      );
    }
  }

  /**
   * [Validated kyc elements to issuer]
   *
   * Once an investor's submitted kyc elements, and authorizes the issuer to
   * access those elements, the issuer needs to validate those elements
   * This can be achieved by updating the link between the kyc element and the issuer for
   * each element.
   * The status of the link neeeds to be VALIDATED.
   *
   */
  async updateKycReviews(
    tenantId,
    reviews: Array<{
      [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
      [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
      [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
      [KycReviewKeys.REVIEW_COMMENT]?: string;
    }>,
  ): Promise<Array<KycReview>> {
    try {
      if (reviews.length <= 0) {
        ErrorService.throwError('array of KYC reviews shall not be empty');
      }

      let invalidReviewFound = false;
      let invalidStatusFound: ReviewStatus;
      reviews.map((review) => {
        if (
          review[KycReviewKeys.REVIEW_STATUS] !== ReviewStatus.SUBMITTED &&
          review[KycReviewKeys.REVIEW_STATUS] !== ReviewStatus.IN_REVIEW &&
          review[KycReviewKeys.REVIEW_STATUS] !== ReviewStatus.VALIDATED &&
          review[KycReviewKeys.REVIEW_STATUS] !== ReviewStatus.REJECTED
        ) {
          invalidReviewFound = true;
          invalidStatusFound = review[KycReviewKeys.REVIEW_STATUS];
        }
      });

      if (invalidReviewFound) {
        ErrorService.throwError(
          `invalid KYC review found (status ${invalidStatusFound} is not correct)`,
        );
      }

      const response: Array<KycReview> =
        await this.apiKycCallService.updateKycReviews(tenantId, reviews);

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating KYC reviews',
        'updateKycReviews',
        false,
        500,
      );
    }
  }

  /**
   * Delete a KYC review at template level, thus removing investor from entity allowList
   *
   * Removing a user from an entity's allowList means deleting
   * the "KycReview" object in the KYC DB (if it exists).
   *  - userId: ID of the user to remove from allowList
   *  - entityId: ID of the entity to remove allowList
   *  - entityType: Type of the entity to remove allowList
   *  - assetClassKey: Class of the entity to remove allowList
   */
  async deleteKycReviewForTemplate(
    tenantId: string,
    investorId: string,
    entityType: EntityType,
    assetClassKey: string,
    project: Project,
    issuer: User,
    token: Token,
    config: Config,
  ): Promise<boolean> {
    try {
      // Retrieve template ID
      const templateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project, // issuer (only for project-related KYC)
          issuer, // issuer (only for issuer-related KYC)
          token, // token (only for token-related KYC)
          config, // platform config (only for platform-related KYC)
        );

      // Retrieve entityId
      const entityId: string = retrieveEntityId(
        entityType,
        project,
        issuer,
        token,
      );

      const kycReviews: Array<KycReview> =
        await this.apiKycCallService.retrieveKycReviews(
          tenantId,
          ReviewEnum.objectIdAndEntityIdAndInvestorId,
          templateId,
          entityId,
          assetClassKey,
          investorId,
        );

      if (kycReviews.length === 1 && kycReviews[0][KycReviewKeys.REVIEW_ID]) {
        const reviewId = kycReviews[0][KycReviewKeys.REVIEW_ID];
        await this.apiKycCallService.deleteKycReview(tenantId, reviewId);
      } else if (kycReviews.length === 0) {
        this.logger.info(
          {},
          `no KYC review was found for ${
            assetClassKey ? `asset class ${assetClassKey} of ` : ''
          }${entityType.toLowerCase()} ${entityId}, and template ${templateId}, and investor ${investorId}`,
        );
      } else {
        ErrorService.throwError(
          'invalid allowList object fetched (shall never happen)',
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting KYC review for template',
        'deleteKycReviewForTemplate',
        false,
        500,
      );
    }
  }

  /**
   * Fetch all aggregated kyc data of a specific user (kyc template filled with submitted kyc elements)
   */
  async retrieveKycDataForSubmitter(
    tenantId: string,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    withValidations: boolean,
  ): Promise<KycDataResponse> {
    try {
      // Retrieve entity
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntity(tenantId, entityId, entityType);

      // Retrieve template ID
      const templateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project, // project (only for project-related KYC)
          issuer, // issuer (only for issuer-related KYC)
          token, // token (only for token-related KYC)
          config, // platform config (only for platform-related KYC)
        );

      // Retrieve KYC data
      const [kycTemplate, kycElementsList, kycElementInstancesMapping]: [
        RawKycTemplate,
        Array<KycElement>,
        {
          [elementKey: string]: KycElementInstance;
        },
      ] = await Promise.all([
        this.apiKycCallService.retrieveKycTemplate(
          tenantId,
          TemplateEnum.templateId,
          templateId,
          true,
        ),
        this.apiKycCallService.listAllKycElements(tenantId),
        this.apiKycCallService.listAllKycElementInstancesFormattedForSubmitter(
          tenantId,
          templateId,
          submitterId,
          entityId,
          assetClassKey,
          false,
        ),
      ]);

      // Retrieve KYC template review (if any)
      const templateReviews: Array<KycReview> =
        await this.apiKycCallService.retrieveKycReviews(
          tenantId,
          ReviewEnum.objectIdAndEntityIdAndInvestorId,
          templateId,
          entityId,
          assetClassKey,
          submitterId,
        );

      const templateReview: KycReview =
        templateReviews && templateReviews.length > 0
          ? templateReviews[0]
          : undefined;

      // If "withValidations" we need to fetch the KYC validation status in KYC-API (unique source of truth)
      // Otherwise, jsut return undefined values for the validations
      let [elementsValidation, templateValidation]: [
        [boolean, string],
        [boolean, string],
      ] = [undefined, undefined];
      if (withValidations) {
        const submitter: User = await this.apiEntityCallService.fetchEntity(
          tenantId,
          submitterId,
          true,
        );

        const templateTopSectionKeys: Array<string> =
          this.kycCheckHelperService.retrieveAdaptedKycTemplateTopSectionKeys(
            submitter,
          );

        [elementsValidation, templateValidation] = await Promise.all([
          this.apiKycCallService.checkKycValidation(
            tenantId,
            submitterId,
            entityId,
            assetClassKey,
            templateId,
            templateTopSectionKeys,
            KycGranularity.ELEMENT_ONLY,
          ),
          this.apiKycCallService.checkKycValidation(
            tenantId,
            submitterId,
            entityId,
            assetClassKey,
            templateId,
            templateTopSectionKeys,
            KycGranularity.TEMPLATE_ONLY,
          ),
        ]);
      }

      return {
        kycData: {
          elementReviews:
            await this.kycTemplateService.injectElementsAndElementInstancesInTemplate(
              kycTemplate,
              kycElementsList,
              kycElementInstancesMapping,
            ),
          templateReview,
        },
        kycValidations: {
          elements: elementsValidation,
          template: templateValidation,
        },
        message: `KYC data (${entityTypeToKycType[entityType]}) listed successfully for submitter ${submitterId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC data for submitter',
        'retrieveKycDataForSubmitter',
        false,
        500,
      );
    }
  }

  /**
   * Fetch all aggregated kyc data of a specific user (kyc template filled with submitted kyc elements)
   */
  async retrieveKycDataForReviewer(
    tenantId: string,
    reviewerId: string,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    withValidations: boolean,
  ): Promise<KycDataResponse> {
    try {
      // In case of local KYC, issuer is retrieved based on the token. Token is the entity.
      // In case of global KYC, issuer is the entity.

      // Retrieve entity
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          reviewerId,
          "retrieve investor's KYC data",
          entityId,
          entityType,
        );

      // Retrieve template ID
      const templateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project,
          issuer,
          token,
          config,
        );

      // Retrieve KYC data
      const [kycTemplate, kycElementsList, kycElementInstancesMapping]: [
        RawKycTemplate,
        Array<KycElement>,
        {
          [elementKey: string]: KycElementInstance;
        },
      ] = await Promise.all([
        this.apiKycCallService.retrieveKycTemplate(
          tenantId,
          TemplateEnum.templateId,
          templateId,
          true,
        ),
        this.apiKycCallService.listAllKycElements(tenantId),
        entityType === EntityType.PLATFORM
          ? this.apiKycCallService.listAllKycElementInstancesFormattedForAdmin(
              tenantId,
              templateId,
              submitterId,
              false,
            )
          : this.apiKycCallService.listAllKycElementInstancesFormattedForIssuer(
              tenantId,
              templateId,
              submitterId,
              entityId,
              assetClassKey,
              false,
            ),
      ]);

      // Retrieve KYC template review (if any)
      const templateReviews: Array<KycReview> =
        await this.apiKycCallService.retrieveKycReviews(
          tenantId,
          ReviewEnum.objectIdAndEntityIdAndInvestorId,
          templateId,
          entityId,
          assetClassKey,
          submitterId,
        );

      const templateReview: KycReview =
        templateReviews && templateReviews.length > 0
          ? templateReviews[0]
          : undefined;

      // If "withValidations" we need to fetch the KYC validation status in KYC-API (unique source of truth)
      // Otherwise, jsut return undefined values for the validations
      let [elementsValidation, templateValidation]: [
        [boolean, string],
        [boolean, string],
      ] = [undefined, undefined];
      if (withValidations) {
        const submitter: User = await this.apiEntityCallService.fetchEntity(
          tenantId,
          submitterId,
          true,
        );

        const templateTopSectionKeys: Array<string> =
          this.kycCheckHelperService.retrieveAdaptedKycTemplateTopSectionKeys(
            submitter,
          );

        [elementsValidation, templateValidation] = await Promise.all([
          this.apiKycCallService.checkKycValidation(
            tenantId,
            submitterId,
            entityId,
            assetClassKey,
            templateId,
            templateTopSectionKeys,
            KycGranularity.ELEMENT_ONLY,
          ),
          this.apiKycCallService.checkKycValidation(
            tenantId,
            submitterId,
            entityId,
            assetClassKey,
            templateId,
            templateTopSectionKeys,
            KycGranularity.TEMPLATE_ONLY,
          ),
        ]);
      }

      return {
        kycData: {
          elementReviews:
            await this.kycTemplateService.injectElementsAndElementInstancesInTemplate(
              kycTemplate,
              kycElementsList,
              kycElementInstancesMapping,
            ),
          templateReview,
        },
        kycValidations: {
          elements: elementsValidation,
          template: templateValidation,
        },
        message: `KYC data (${entityTypeToKycType[entityType]}) of submitter ${submitterId} listed successfully for reviewer ${reviewerId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving KYC data for reviewer',
        'retrieveKycDataForReviewer',
        false,
        500,
      );
    }
  }

  /**
   * Delete investor's KYC data for a given entity
   */
  async deleteSubmitterKycDataForEntity(
    tenantId: string,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    deleteElementInstances: boolean,
    deleteReviews: boolean,
  ): Promise<DeleteKycDataOutput> {
    try {
      // retrieve KYC element instances + element reviews
      const kycDataResponse: KycDataResponse =
        await this.retrieveKycDataForSubmitter(
          tenantId,
          submitterId,
          entityId,
          entityType,
          assetClassKey,
          false,
        );

      const kycTemplateFilled: KycTemplate =
        kycDataResponse[KycDataKeys.DATA][KycDataKeys.DATA__ELEMENT_REVIEWS];

      const templateId = kycTemplateFilled[KycTemplateKeys.TEMPLATE_ID];

      // retrieve template reviews
      const templateReviews: Array<KycReview> =
        await this.apiKycCallService.retrieveKycReviews(
          tenantId,
          ReviewEnum.objectIdAndEntityIdAndInvestorId,
          templateId,
          entityId,
          assetClassKey,
          submitterId,
        );

      // extract KYC element instances + element reviews
      const [elementInstancesIds, elementReviewIds]: [
        Array<string>,
        Array<string>,
      ] = this.extractElementInstancesAndReviewsIds(kycTemplateFilled);

      // extract template reviews IDs
      const templateReviewsIds: Array<string> = templateReviews.map(
        (templateReview: KycReview) => {
          return templateReview[KycReviewKeys.REVIEW_ID];
        },
      );

      // delete KYC element instances + element reviews + template reviews
      await Promise.all([
        ...(deleteElementInstances ? elementInstancesIds : []).map(
          (elementInstanceId: string) => {
            return this.apiKycCallService.deleteKycElementInstance(
              tenantId,
              elementInstanceId,
            );
          },
        ),
        ...(deleteReviews ? elementReviewIds : []).map(
          (elementReviewId: string) => {
            return this.apiKycCallService.deleteKycReview(
              tenantId,
              elementReviewId,
            );
          },
        ),
        ...(deleteReviews ? templateReviewsIds : []).map(
          (templateReviewsId: string) => {
            return this.apiKycCallService.deleteKycReview(
              tenantId,
              templateReviewsId,
            );
          },
        ),
      ]);

      return {
        deletedElementInstances: deleteElementInstances
          ? elementInstancesIds
          : [],
        deletedElementReviews: deleteReviews ? elementReviewIds : [],
        deletedTemplateReviews: deleteReviews ? templateReviewsIds : [],
        message: `KYC data (${
          entityTypeToKycType[entityType]
        }), related to ${entityType.toLowerCase()} ${entityId}, successfully deleted for submitter ${submitterId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "deleting submitter's KYC data for entity",
        'deleteSubmitterKycDataForEntity',
        false,
        500,
      );
    }
  }

  /**
   * Delete all KYC data related to a token
   */
  async deleteAllEntityKycData(
    tenantId: string,
    entityId: string,
    entityType: EntityType,
  ): Promise<DeleteKycDataOutput> {
    try {
      const allEntityLinks: Array<Link> =
        await this.linkService.listAllEntityLinks(
          tenantId,
          entityId,
          entityType,
        );

      const allFilteredEntityLinks: Array<Link> = allEntityLinks.filter(
        (userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            UserType.INVESTOR,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        },
      );

      let deletedElementInstances: Array<string> = [];
      let deletedElementReviews: Array<string> = [];
      let deletedTemplateReviews: Array<string> = [];

      await Promise.all(
        allFilteredEntityLinks.map((userEntityLink: Link) => {
          return this.deleteSubmitterKycDataForEntity(
            tenantId,
            userEntityLink[LinkKeys.USER_ID],
            userEntityLink[LinkKeys.ENTITY_ID],
            userEntityLink[LinkKeys.ENTITY_TYPE],
            userEntityLink[LinkKeys.ASSET_CLASS],
            false, // deleteElementInstances
            true, // deleteReviews
          ).then((response: DeleteKycDataOutput) => {
            deletedElementInstances = deletedElementInstances.concat(
              response.deletedElementInstances,
            );
            deletedElementReviews = deletedElementReviews.concat(
              response.deletedElementReviews,
            );
            deletedTemplateReviews = deletedTemplateReviews.concat(
              response.deletedTemplateReviews,
            );
          });
        }),
      );

      if (deletedElementInstances.length !== 0) {
        ErrorService.throwError(
          "SHALL NEVER HAPPEN: user's KYC element instances shall never be deleted when deleting a token, since they can still be used for another token",
        );
      }

      return {
        deletedElementInstances: [],
        deletedElementReviews,
        deletedTemplateReviews,
        message: `All KYC data successfully deleted for ${entityType.toLowerCase()} ${entityId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting all entity-related KYC data',
        'deleteAllEntityKycData',
        false,
        500,
      );
    }
  }

  /**
   * Delete all investor's KYC data
   */
  async deleteAllInvestorKycData(
    tenantId: string,
    investorId: string,
  ): Promise<DeleteKycDataOutput> {
    try {
      const allInvestorLinks: Array<Link> = (
        await this.linkService.listAllUserLinks(
          tenantId,
          investorId,
          UserType.INVESTOR,
          undefined, // entityType
          undefined, // entityId
          undefined, // assetClass
          undefined, // offset
          undefined, // limit
          false, // withMetadata
        )
      ).links;

      let deletedElementInstances: Array<string> = [];
      let deletedElementReviews: Array<string> = [];
      let deletedTemplateReviews: Array<string> = [];

      for (const investorLink of allInvestorLinks) {
        await this.deleteSubmitterKycDataForEntity(
          tenantId,
          investorLink[LinkKeys.USER_ID],
          investorLink[LinkKeys.ENTITY_ID],
          investorLink[LinkKeys.ENTITY_TYPE],
          investorLink[LinkKeys.ASSET_CLASS],
          true, // deleteElementInstances
          true, // deleteReviews
        ).then((response: DeleteKycDataOutput) => {
          deletedElementInstances = deletedElementInstances.concat(
            response.deletedElementInstances,
          );
          deletedElementReviews = deletedElementReviews.concat(
            response.deletedElementReviews,
          );
          deletedTemplateReviews = deletedTemplateReviews.concat(
            response.deletedTemplateReviews,
          );
        });
      }

      return {
        deletedElementInstances,
        deletedElementReviews,
        deletedTemplateReviews,
        message: `All KYC data successfully deleted for investor ${investorId}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        "deleting all investor's KYC data",
        'deleteAllInvestorKycData',
        false,
        500,
      );
    }
  }

  /**
   * Extract IDs of KYC element instances and KYC reviews
   */
  extractElementInstancesAndReviewsIds(
    kycTemplateFilled: KycTemplate,
  ): [Array<string>, Array<string>] {
    try {
      const elementReviewIds = [];
      const elementInstancesIds = [];
      // extract link and element ids
      kycTemplateFilled[KycTemplateKeys.TOP_SECTIONS].map(
        (topSection: KycTemplateTopSection) =>
          Object.values(
            topSection[KycTemplateKeys.TOP_SECTIONS__SECTIONS],
          ).forEach((section: KycTemplateSection) =>
            Object.values(section[KycTemplateKeys.SECTIONS__ELEMENTS]).map(
              (elementAndInstance: KycElementAndElementInstance) => {
                if (
                  elementAndInstance[
                    KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE
                  ]
                ) {
                  const elementInstance =
                    elementAndInstance[
                      KycElementKeys.ELEMENT_AND_INSTANCE__ELEMENT_INSTANCE
                    ];
                  if (
                    elementInstance &&
                    elementInstance[KycElementKeys.ELEMENT_INSTANCE_ID]
                  ) {
                    this.addItemToListIfRequired(
                      elementInstancesIds,
                      elementInstance[KycElementKeys.ELEMENT_INSTANCE_ID],
                    );
                  }

                  if (
                    elementInstance &&
                    elementInstance[KycElementKeys.ELEMENT_INSTANCE_REVIEW_ID]
                  ) {
                    this.addItemToListIfRequired(
                      elementReviewIds,
                      elementInstance[
                        KycElementKeys.ELEMENT_INSTANCE_REVIEW_ID
                      ],
                    );
                  }
                }
              },
            ),
          ),
      );
      return [elementInstancesIds, elementReviewIds];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting element instances and reviews IDs',
        'extractElementInstancesAndReviewsIds',
        false,
        500,
      );
    }
  }

  addItemToListIfRequired(list: Array<string>, item: string) {
    if (list.indexOf(item) < 0) {
      list.push(item);
    }
  }
}
