import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { LinkService } from 'src/modules/v2Link/link.service';
import { keys as TokenKeys, Token } from 'src/types/token';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { EntityType, entityTypeToKycType } from 'src/types/entity';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { Wallet } from 'src/types/wallet';
import {
  CreateLinkOutput,
  LinkState,
  Link,
} from 'src/types/workflow/workflowInstances/link';

import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { AllowListOutput, UnvalidateOutput } from '../kyc.workflow.dto';

import { ClientCategory, RiskProfile } from 'src/types/kyc/review';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { FunctionName } from 'src/types/smartContract';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { Project } from 'src/types/project';
import { Config } from 'src/types/config';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class KYCWorkflowAllowListService {
  constructor(
    private readonly entityService: EntityService,
    private readonly kycDataService: KYCDataService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(KYCWorkflowAllowListService.name);
  }

  /**
   * [AllowList submitter for entity]
   */
  async allowListSubmitterForEntityandCreateLinkIfRequired(
    tenantId: string,
    reviewer: User,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string,
    clientCategory: ClientCategory,
    riskProfile: RiskProfile,
    validityDate: Date,
    comment: string,
    sendNotification: boolean,
    functionName: FunctionName,
    authToken: string,
  ): Promise<AllowListOutput> {
    try {
      // Retrieve submitter
      const submitter: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        submitterId,
        true,
      );

      // Retrieve entity
      let entityServiceResponse;
      if (
        functionName === FunctionName.INIT_ASSET_INSTANCE ||
        functionName === FunctionName.SUBMIT_ASSET_INSTANCE
      ) {
        // In case the entity is being created, we can bypass authorization check
        // because issuer-entity link doesn't necessarily exist yet
        // (example: in case asset is being pre-initialized by an
        // INVESTOR, asset's issuer is not already defined)
        entityServiceResponse = await this.entityService.retrieveEntity(
          tenantId,
          entityId,
          entityType,
        );
      } else {
        // In other cases, once entity is already created, we shall
        // check if user is authorized to retrieve entity
        entityServiceResponse =
          await this.entityService.retrieveEntityIfAuthorized(
            tenantId,
            reviewer[UserKeys.USER_ID],
            'allowList investor',
            entityId,
            entityType,
          );
      }

      const [project, issuer, token, config]: [Project, User, Token, Config] =
        entityServiceResponse;

      if (
        entityType === EntityType.TOKEN &&
        assetClassKey &&
        token[TokenKeys.ASSET_CLASSES].indexOf(assetClassKey) < 0
      ) {
        ErrorService.throwError(
          `${assetClassKey} is not an asset class for token ${
            token[TokenKeys.TOKEN_ID]
          }`,
        );
      }

      // In case the reviewer is a KYC verifier, we need to check if the submitter-entity-link already exists
      if (reviewer[UserKeys.USER_TYPE] === UserType.VERIFIER) {
        const userEntityLinks: Array<Link> =
          await this.linkService.strictListAllUserEntityLinks(
            tenantId,
            submitterId,
            submitter[UserKeys.USER_TYPE],
            entityId,
            entityType,
            assetClassKey,
          );

        if (userEntityLinks.length < 1) {
          ErrorService.throwError(
            `no link was found between ${submitter[
              UserKeys.USER_TYPE
            ].toLowerCase()} ${submitterId} and${
              assetClassKey && entityType === EntityType.TOKEN
                ? ` asset class ${assetClassKey} of`
                : ''
            } ${entityType.toLowerCase()} ${
              entityId || ''
            } (investor needs to be invited first)`,
          );
        }
      }

      // Retrieve submitter's default wallet
      const defaultWallet: Wallet = this.walletService.extractWalletFromUser(
        submitter,
        undefined,
      );

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

      // Create link between investor and entity, if required
      const linkCreationResponse: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          reviewer[UserKeys.USER_TYPE],
          reviewer[UserKeys.USER_ID], // brokerId if reviewer's userType is BROKER
          submitter,
          functionName,
          entityType,
          project, // entityProject (only for project-related KYC)
          issuer, // entityUser (only for issuer-related KYC)
          token, // entityToken (only for token-related KYC)
          assetClassKey,
          defaultWallet,
        );
      const initialLink: Link = linkCreationResponse.link;

      // If the caller is a broker, make sure the link contains the correct brokerId
      if (reviewer[UserKeys.USER_TYPE] === UserType.BROKER) {
        this.linkService.checkBrokerLinks(
          initialLink,
          reviewer[UserKeys.USER_ID],
        );
      }

      const updatedLink: Link =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          initialLink[LinkKeys.ID],
          FunctionName.KYC_ALLOWLIST,
          reviewer[UserKeys.USER_TYPE],
          LinkState.VALIDATED,
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

      return {
        link: updatedLink,
        newLink: linkCreationResponse.newLink,
        message: `User ${submitterId} successfully allowListed for${
          assetClassKey ? ` asset class ${assetClassKey} of` : ''
        } ${entityType.toLowerCase()} ${entityId || ''} (${
          entityTypeToKycType[entityType]
        } KYC)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'allowListing submitter for entity',
        'allowListSubmitterForEntity',
        false,
        500,
      );
    }
  }

  /**
   * [Unvalidate/Reject submitter for entity]
   */
  async unvalidateOrRejectSubmitterForEntity(
    tenantId: string,
    reviewer: User,
    functionName: FunctionName,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string, // only used if 'entityType=TOKEN'
    sendNotification: boolean,
    authToken: string,
  ): Promise<UnvalidateOutput> {
    try {
      // Check submitter exists
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
          "unvalidate investor's KYC",
          entityId,
          entityType,
        );

      let nextLinkState: LinkState;
      if (functionName === FunctionName.KYC_UNVALIDATE) {
        nextLinkState = LinkState.INVITED;
      } else if (functionName === FunctionName.KYC_REJECT) {
        nextLinkState = LinkState.REJECTED;
      } else {
        ErrorService.throwError(`invalid function name: ${functionName}`);
      }

      // Retrieve list of links between investor and entity
      const exhaustiveUserEntityLinks: Array<Link> =
        await this.linkService.exhaustiveListAllUserEntityLinks(
          tenantId,
          submitterId,
          UserType.INVESTOR,
          entityId,
          entityType,
          assetClassKey,
        );

      if (exhaustiveUserEntityLinks.length === 0) {
        ErrorService.throwError(
          `no investor link was found between user ${submitterId} and ${entityType.toLowerCase()} ${entityId}`,
        );
      }

      // A broker can only unvalidate links that he created
      const exhaustiveUserEntityLinks2: Array<Link> =
        reviewer[UserKeys.USER_TYPE] === UserType.BROKER
          ? exhaustiveUserEntityLinks.filter((link: Link) => {
              return link[LinkKeys.BROKER_ID] === reviewer[UserKeys.USER_ID];
            })
          : exhaustiveUserEntityLinks;

      if (exhaustiveUserEntityLinks2.length === 0) {
        ErrorService.throwError(
          `no investor link was found between user ${submitterId} and ${entityType.toLowerCase()} ${entityId}, for broker with id ${
            reviewer[UserKeys.USER_ID]
          }`,
        );
      }

      // Update all links
      const updatedLinks: Array<Link> = await Promise.all(
        exhaustiveUserEntityLinks2.map((linkToUnvalidate: Link) => {
          // Update user-entity link
          return this.workflowService.updateWorkflowInstance(
            tenantId,
            linkToUnvalidate[LinkKeys.ID],
            functionName,
            reviewer[UserKeys.USER_TYPE],
            nextLinkState,
            linkToUnvalidate,
          );
        }),
      );

      // Delete all corresponding KYC reviews
      await Promise.all(
        exhaustiveUserEntityLinks2.map((linkToUnvalidate: Link) => {
          // Delete KYC review
          return this.kycDataService.deleteKycReviewForTemplate(
            tenantId,
            submitterId,
            entityType,
            linkToUnvalidate[LinkKeys.ASSET_CLASS],
            project,
            issuer,
            token,
            config,
          );
        }),
      );

      if (sendNotification) {
        // Send email notification
        if (functionName === FunctionName.KYC_UNVALIDATE) {
          this.apiMailingCallService.sendInvestorKYCReviewInformation(
            tenantId,
            issuer,
            submitter,
            authToken,
          );
        } else {
          this.apiMailingCallService.sendInvestorKYCRejected(
            tenantId,
            issuer,
            submitter,
            authToken,
          );
        }
      }

      return {
        links: updatedLinks,
        message: `User ${submitterId} ${
          functionName === FunctionName.KYC_UNVALIDATE
            ? 'unvalidated'
            : 'rejected'
        } successfully for${
          assetClassKey ? ` asset class ${assetClassKey} of` : ''
        } ${entityType.toLowerCase()} ${entityId || ''} (${
          entityTypeToKycType[entityType]
        } KYC)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating/rejecting submitter for entity',
        'unvalidateOrRejectSubmitterForEntity',
        false,
        500,
      );
    }
  }
}
