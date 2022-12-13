import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';

import { TemplateEnum } from 'src/old/constants/enum';
import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';
import { LinkService } from 'src/modules/v2Link/link.service';
import { Token } from 'src/types/token';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { EntityType, entityTypeToKycType } from 'src/types/entity';
import { ApiKycCallService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { Wallet } from 'src/types/wallet';
import {
  CreateLinkOutput,
  Link,
  LinkState,
} from 'src/types/workflow/workflowInstances/link';
import {
  keys as KycElementKeys,
  KycElementInstance,
} from 'src/types/kyc/element';
import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { InviteOutput, SubmitOutput, ReviewOutput } from '../kyc.workflow.dto';
import {
  keys as KycReviewKeys,
  ReviewStatus,
  KycGranularity,
  ClientCategory,
  RiskProfile,
} from 'src/types/kyc/review';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { FunctionName } from 'src/types/smartContract';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { WorkflowName } from 'src/types/workflow/workflowTemplate';
import { Project } from 'src/types/project';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { Config } from 'src/types/config';
import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { UserRetrievalService } from 'src/modules/v2User/user.service/retrieveUser';
import { UserListingService } from 'src/modules/v2User/user.service/listAllUsers';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { keys as ConfigKeys } from 'src/types/config';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.KYC;
export const MAX_KYC_VERIFIERS = 10;

@Injectable()
export class KYCWorkflowGenericService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly entityService: EntityService,
    private readonly walletService: WalletService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly kycDataService: KYCDataService,
    private readonly kycCheckHelperService: KycCheckService,
    private readonly linkService: LinkService,
    private readonly apiKycCallService: ApiKycCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly userRetrievalService: UserRetrievalService,
    private readonly userListingService: UserListingService,
    private readonly configService: ConfigService,
  ) {}
  /**
   * [Invite user to submit KYC elements in order to be verified for a given entity(token/issuer)]
   */
  async inviteUserForEntity(
    tenantId: string,
    reviewer: User,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
  ): Promise<InviteOutput> {
    try {
      const functionName: FunctionName = FunctionName.KYC_INVITE;

      const submitter: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        submitterId,
        true,
      );

      // Retrieve entity
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          reviewer[UserKeys.USER_ID],
          'invite user',
          entityId,
          entityType,
        );

      if (
        !this.kycCheckHelperService.extractKycByPassStatusFromEntity(
          entityType,
          project,
          issuer,
          token,
          config,
        )
      ) {
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

        // Check if kyc template exists
        this.apiKycCallService.retrieveKycTemplate(
          tenantId,
          TemplateEnum.templateId,
          templateId,
          true,
        );
      }

      // Retrieve submitter's default wallet
      const defaultWallet: Wallet = this.walletService.extractWalletFromUser(
        submitter,
        undefined,
      );

      // Create submitter-entity link
      const linkCreationResponse: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          reviewer[UserKeys.USER_TYPE],
          reviewer[UserKeys.USER_ID], // will be used later for brokerId if need
          submitter,
          functionName,
          entityType,
          project, // entityProject (only for project-related KYC)
          issuer, // entityUser (only for issuer-related KYC)
          token, // entityToken (only for token-related KYC)
          assetClassKey,
          defaultWallet,
        );

      let createdOrUpdatedLink: Link = linkCreationResponse.link;

      // In case user was rejected, link state needs to be updated from 'rejected' to 'invited'
      if (
        linkCreationResponse.link &&
        linkCreationResponse.link[LinkKeys.STATE] === LinkState.REJECTED
      ) {
        // Check if state transition is possible, by asking Workflow-API
        const nextState: string = await WorkflowMiddleWare.checkStateTransition(
          tenantId,
          TYPE_WORKFLOW_NAME,
          linkCreationResponse.link[LinkKeys.ID],
          reviewer[UserKeys.USER_TYPE],
          functionName,
        );

        // If the caller is a broker, make sure the link contains the correct brokerId
        if (reviewer[UserKeys.USER_TYPE] === UserType.BROKER) {
          this.linkService.checkBrokerLinks(
            linkCreationResponse.link,
            reviewer[UserKeys.USER_ID],
          );
        }

        createdOrUpdatedLink =
          await this.workflowService.updateWorkflowInstance(
            tenantId,
            linkCreationResponse.link[LinkKeys.ID],
            functionName,
            reviewer[UserKeys.USER_TYPE],
            nextState,
            linkCreationResponse.link,
          );
      }

      return {
        link: createdOrUpdatedLink,
        newLink: linkCreationResponse.newLink,
        message:
          linkCreationResponse.newLink ||
          linkCreationResponse.link[LinkKeys.STATE] === LinkState.REJECTED
            ? `${setToLowerCaseExceptFirstLetter(
                submitter[UserKeys.USER_TYPE],
              )} ${submitterId} succesfully invited to provide KYC elements for${
                assetClassKey ? ` asset class ${assetClassKey} of` : ''
              } ${entityType.toLowerCase()} ${entityId || ''}`
            : `${setToLowerCaseExceptFirstLetter(
                submitter[UserKeys.USER_TYPE],
              )} ${submitterId} was already invited for${
                assetClassKey ? ` asset class ${assetClassKey} of` : ''
              } ${entityType.toLowerCase()} ${entityId || ''}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for entity',
        'inviteUserForEntity',
        false,
        500,
      );
    }
  }

  /**
   * [Submit entity-related KYC element instances]
   *
   * This function can only be called by the submitter (underwriter/investor/vehicle/etc.).
   * It can only be called for an user-entity-link-workflow (KYC) in state INVITED.
   * It allows the submitter to:
   *  1) Submit a list of KYC element instances.
   *  2) Create a review to allow those KYC element instances to be used for their validation
   *  on this specific entity (e.g. token/issuer).
   *
   * In case the KYC element instances have already been submitted in the frame of another
   * KYC workflow (for another entity), only step 2) is performed.
   *
   * On-chain:
   *  - None.
   *
   * Off-chain state machine:
   *  - Initial state: INVITED
   *  - Destination state: KYCSUBMITTED (or INVITED)
   *      --> In case all the required KYC element instances have been submitted (e.g. one
   *          KYC element instance + one KYC review for each element of the template), the state switches
   *          to KYCSUBMITTED.
   *      --> In case all the required KYC elements have not been submitted, the
   *          state remains INVITED.
   *
   * Example of input for "elements":
   * [
   *  {
   *    "elementKey": "InvestmentObjectives_natural",
   *    "value": ["Test value"],
   *    "data": {}
   *  }
   * ]
   *
   */
  async submitKycElementInstances(
    tenantId: string,
    submitter: User,
    entityId: string,
    entityType: EntityType,
    elementInstances: Array<{
      [KycElementKeys.ELEMENT_INSTANCE_ELEMENT_KEY]: string;
      [KycElementKeys.ELEMENT_INSTANCE_VALUE]: Array<string>;
      [KycElementKeys.ELEMENT_INSTANCE_DATA]?: any;
    }>,
    assetClassKey: string, // only used if 'entityType=TOKEN'
    sendNotification: boolean,
    authToken: string,
  ): Promise<SubmitOutput> {
    try {
      const functionName: FunctionName = FunctionName.KYC_SUBMIT;

      // Check if submitter is already linked to entity (e.g. submitter is invited for entity)
      const initialLink: Link =
        await this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          submitter[UserKeys.USER_ID],
          submitter[UserKeys.USER_TYPE],
          entityId,
          entityType,
          assetClassKey,
        );

      // Retrieve entity
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntity(tenantId, entityId, entityType);

      // Retrieve kycTemplateId
      const kycTemplateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project,
          issuer,
          token,
          config,
        );

      // Idempotency
      if (initialLink[LinkKeys.STATE] === LinkState.KYCSUBMITTED) {
        // Order has already been approved, return order without updating it (idempotency)
        return {
          link: initialLink,
          updated: false,
          message: 'KYC submission was already done',
        };
      }

      // Check state transition (link state)
      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        initialLink[LinkKeys.ID], // workflow instance ID
        submitter[UserKeys.USER_TYPE],
        functionName, // submitKyc
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

      // Check if kyc template exists
      this.apiKycCallService.retrieveKycTemplate(
        tenantId,
        TemplateEnum.templateId,
        templateId,
        true,
      );

      // Save submitted KYC data
      if (elementInstances && elementInstances.length > 0) {
        await this.kycDataService.createKycElementInstances(
          tenantId,
          submitter[UserKeys.USER_ID],
          submitter[UserKeys.EMAIL],
          elementInstances,
        );
      }

      // Retrieve full list of KYC element instances
      const kycElementInstancesMapping: {
        [elementKey: string]: KycElementInstance;
      } = await this.apiKycCallService.listAllKycElementInstancesFormattedForSubmitter(
        tenantId,
        templateId,
        submitter[UserKeys.USER_ID],
        entityId,
        assetClassKey,
        false,
      );

      // Create KYC reviews for non-shared element instances,
      // in order to authorize entity (token/issuer) to access them
      await this.kycDataService.createKycReviewsForElementInstances(
        tenantId,
        kycElementInstancesMapping,
        entityId,
        entityType,
        assetClassKey,
      );

      const templateTopSectionKeys: Array<string> =
        this.kycCheckHelperService.retrieveAdaptedKycTemplateTopSectionKeys(
          submitter,
        );

      // Check submitter's KYC completion status
      const [kycIsComplete, kycCompletionMessage]: [boolean, string] =
        await this.apiKycCallService.checkKycCompletion(
          tenantId,
          submitter[UserKeys.USER_ID],
          entityId,
          assetClassKey,
          kycTemplateId,
          templateTopSectionKeys,
        );

      // If KYC submission is complete, update user-entity link status to 'kycSubmitted'
      let updatedLink: Link;

      if (kycIsComplete) {
        updatedLink = await this.workflowService.updateWorkflowInstance(
          tenantId,
          initialLink[LinkKeys.ID],
          functionName,
          submitter[UserKeys.USER_TYPE],
          nextState, // LinkState.KYCSUBMITTED
          initialLink,
        );

        let issuerOrAdmin = issuer;
        if (entityType === EntityType.PLATFORM) {
          // FIXME: email shall be sent to all admins instead of only one of them
          issuerOrAdmin = await this.userRetrievalService.retrievePlatformAdmin(
            tenantId,
          );
        }

        if (sendNotification) {
          //send email to all verifers assigned to this issuer only
          if (entityType !== EntityType.PLATFORM) {
            this.sendToAllKYCVerifiers(
              tenantId,
              issuer[UserKeys.USER_ID],
              submitter,
              authToken,
            );
          }

          this.apiMailingCallService.sendKYCSubmittedNotification(
            tenantId,
            issuerOrAdmin,
            submitter,
            authToken,
          );
        }
      }

      return {
        link: kycIsComplete ? updatedLink : initialLink,
        updated: true,
        message: kycIsComplete
          ? `KYC (${
              entityTypeToKycType[entityType]
            }) succesfully submitted by ${submitter[
              UserKeys.USER_TYPE
            ].toLowerCase()} ${
              submitter[UserKeys.USER_ID]
            } for ${entityType.toLowerCase()} ${entityId || ''}`
          : `KYC not complete: ${kycCompletionMessage}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting KYC element instances',
        'submitKycElementInstances',
        false,
        500,
      );
    }
  }

  private async sendToAllKYCVerifiers(
    tenantId: string,
    issuerId: string,
    submitter: User,
    authToken: string,
    state: Array<string> = [LinkState.VALIDATED],
  ): Promise<void> {
    try {
      const sendToAllVerifiers = (
        await this.configService.retrieveTenantConfig(tenantId)
      )[ConfigKeys.DATA][ConfigKeys.DATA__ENABLE_NOTIFY_ALL_VERIFIERS];

      if (!sendToAllVerifiers) {
        return;
      }

      const offset = 0;

      const fetchResult: {
        users: Array<User>;
        total: number;
      } = await this.userListingService.listAllUsersLinkedToIssuer(
        tenantId,
        issuerId,
        offset,
        MAX_KYC_VERIFIERS,
        [UserType.VERIFIER],
        state,
      );

      if (fetchResult.total > MAX_KYC_VERIFIERS) {
        this.logger.warn(
          `sendToAllKYCVerifers --> Too many verifers retrieved. Expect to have maximum ${MAX_KYC_VERIFIERS} users retrieve, but got ${fetchResult.total}`,
        );
      }

      if (fetchResult && fetchResult.total > 0) {
        await this.apiMailingCallService.sendKYCSubmittedNotificationToAllKYCVerifier(
          tenantId,
          fetchResult.users,
          submitter,
          authToken,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'send email to all KYC verifers',
        'sendToAllKYCVerifers',
        false,
        500,
      );
    }
  }

  /**
   * [Validate entity-related KYC element instance]
   *
   * This function can only be called by the reviewer (admin or issuer or KYC verifier).
   * It can only be called for an user-entity-link-workflow (KYC) in state KYCSUBMITTED.
   * It allows the reviewer to validate a list of KYC element instances.
   *
   * On-chain:
   *  - None.
   *
   * Off-chain state machine:
   *  - Initial state: KYCSUBMITTED
   *  - Destination state: VALIDATED (or KYCSUBMITTED)
   *      --> In case all the required KYC element instances have been validated (e.g. one
   *          KYC element instance + one validated KYC review for each KYC element), the state switches
   *          to VALIDATED.
   *      --> In case all the required KYC elements have not been validated, the
   *          state remains KYCSUBMITTED.
   *
   * Example of input for "reviews":
   * [
   *  {
   *    "reviewId": "c69ca91c-fd39-41a4-a7eb-4242ac08dae4",
   *    "status": "VALIDATED"
   *  }
   * ]
   *
   */
  async reviewKycElementInstances(
    tenantId: string,
    reviewer: User,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    reviews: Array<{
      [KycReviewKeys.DEPRECATED_REVIEW_ID]: string;
      [KycReviewKeys.REVIEW_STATUS]: ReviewStatus;
      [KycReviewKeys.REVIEW_VALIDITY_DATE]?: Date;
      [KycReviewKeys.REVIEW_COMMENT]?: string;
    }>,
    assetClassKey: string, // only used if 'entityType=TOKEN'
    clientCategory: ClientCategory,
    riskProfile: RiskProfile,
    validityDate: Date,
    comment: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<ReviewOutput> {
    try {
      const functionName: FunctionName = FunctionName.KYC_VALIDATE;

      // Retrieve entity
      const [project, issuer, token, config]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          reviewer[UserKeys.USER_ID],
          "validate investor's KYC",
          entityId,
          entityType,
        );

      // Retrieve KYC template ID
      const kycTemplateId: string =
        await this.kycCheckHelperService.extractKycTemplateIdFromEntity(
          tenantId,
          entityType,
          project,
          issuer,
          token,
          config,
        );

      // Retrieve submitter
      const submitter: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        submitterId,
        true,
      );

      // Check if submitter is already linked to entity (e.g. submitter is invited for entity)
      const initialLink: Link =
        await this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          submitterId,
          submitter[UserKeys.USER_TYPE],
          entityId,
          entityType,
          assetClassKey,
        );

      // If the caller is a broker, make sure the link contains the correct brokerId
      if (reviewer[UserKeys.USER_TYPE] === UserType.BROKER) {
        this.linkService.checkBrokerLinks(
          initialLink,
          reviewer[UserKeys.USER_ID],
        );
      }

      // Idempotency
      if (initialLink[LinkKeys.STATE] === LinkState.VALIDATED) {
        // Order has already been approved, return order without updating it (idempotency)
        return {
          link: initialLink,
          updated: false,
          message: 'KYC review was already done',
        };
      }

      // Check state transition (link state)
      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        initialLink[LinkKeys.ID], // workflow instance ID
        reviewer[UserKeys.USER_TYPE],
        functionName, // validateKyc
      );

      if (reviews && reviews.length > 0) {
        await this.kycDataService.updateKycReviews(tenantId, reviews);
      }

      // Create KYC review at template level, with "validated" status, in order to allowList investor
      await this.kycDataService.createOrUpdateKycReviewForTemplate(
        tenantId,
        submitterId,
        entityType,
        project,
        issuer,
        token,
        config,
        assetClassKey,
        clientCategory,
        riskProfile,
        validityDate,
        comment,
      );

      const templateTopSectionKeys: Array<string> =
        this.kycCheckHelperService.retrieveAdaptedKycTemplateTopSectionKeys(
          submitter,
        );

      // Check submitter's KYC validation status
      const [kycIsValidated, kycValidationMessage]: [boolean, string] =
        await this.apiKycCallService.checkKycValidation(
          tenantId,
          submitter[UserKeys.USER_ID],
          entityId,
          assetClassKey,
          kycTemplateId,
          templateTopSectionKeys,
          KycGranularity.TEMPLATE_AND_ELEMENT,
        );

      // If KYC validation is complete, update user-entity link status to 'validated'
      let updatedLink: Link;
      if (kycIsValidated) {
        updatedLink = await this.workflowService.updateWorkflowInstance(
          tenantId,
          initialLink[LinkKeys.ID],
          functionName,
          reviewer[UserKeys.USER_TYPE],
          nextState, // LinkState.VALIDATED
          initialLink,
        );

        // Send email notification
        if (sendNotification) {
          if (
            entityType === EntityType.TOKEN ||
            entityType === EntityType.ASSET_CLASS
          ) {
            this.apiMailingCallService.sendInvestorAssetInviteNotification(
              tenantId,
              submitter,
              token,
              authToken,
            );
          } else if (entityType === EntityType.ISSUER) {
            this.apiMailingCallService.sendInvestorKYCValidated(
              tenantId,
              submitter,
              authToken,
            );
          }
        }
      }

      return {
        link: kycIsValidated ? updatedLink : initialLink,
        updated: true,
        message: kycIsValidated
          ? `KYC (${
              entityTypeToKycType[entityType]
            }) succesfully validated for ${
              submitter[UserKeys.USER_TYPE]
            } ${submitter[
              UserKeys.USER_ID
            ].toLowerCase()} for ${entityType.toLowerCase()} ${entityId || ''}`
          : `KYC not complete: ${kycValidationMessage}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reviewing KYC element instances',
        'reviewKycElementInstances',
        false,
        500,
      );
    }
  }
}
