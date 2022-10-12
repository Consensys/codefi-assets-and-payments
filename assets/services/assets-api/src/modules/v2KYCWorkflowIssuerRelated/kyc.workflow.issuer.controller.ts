import {
  Controller,
  Post,
  Delete,
  Query,
  Body,
  HttpCode,
  Put,
  Get,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import {
  InviteForIssuerBodyInput,
  InviteForIssuerOutput,
  SubmitForIssuerBodyInput,
  SubmitForIssuerOutput,
  ReviewForIssuerBodyInput,
  ReviewForIssuerOutput,
  AllowListForIssuerOutput,
  RetrieveIssuerLinkQueryInput,
  RetrieveIssuerLinkOutput,
  UnvalidateOrRejectIssuerLinkBodyInput,
  UnvalidateOrRejectIssuerLinkOutput,
  DeleteIssuerLinkBodyInput,
  DeleteIssuerLinkOutput,
  AllowListForIssuerAsVerifierBodyInput,
  ReviewForIssuerAsThirdPartyBodyInput,
  AllowListForIssuerBodyInput,
  UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  InviteForIssuerAsThirdPartyBodyInput,
  DeleteTokenLinkAsThirdPartyBodyInput,
} from './kyc.workflow.issuer.dto';
import { EntityType } from 'src/types/entity';
import { KYCWorkflowGenericService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import {
  AllowListOutput,
  UnvalidateOutput,
} from 'src/modules/v2KYCWorkflow/kyc.workflow.dto';
import { LinkService } from 'src/modules/v2Link/link.service';
import { KYCWorkflowHelperService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service';
import { UserType } from 'src/types/user';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { FunctionName } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/workflows/kyc/issuer-related')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCWorkflowIssuerRelatedController {
  constructor(
    private readonly kycWorkflowHelperService: KYCWorkflowHelperService,
    private readonly kycWorkflowGenericService: KYCWorkflowGenericService,
    private readonly kycWorkflowAllowListService: KYCWorkflowAllowListService,
    private readonly linkService: LinkService,
  ) {}

  @Post('/form/invite/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForIssuerAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForIssuerBodyInput,
  ): Promise<InviteForIssuerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: InviteForIssuerOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          userContext[UserContextKeys.USER_ID], // Since this endpoint is called by the issuer, he specifies his own ID as issuerId
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for issuer-related on-boarding, as reviewer',
        'inviteForIssuerAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/invite/underwriter')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForIssuerAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForIssuerAsThirdPartyBodyInput,
  ): Promise<InviteForIssuerOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      if (!inviteBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: InviteForIssuerOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for issuer-related on-boarding as underwriter',
        'inviteForIssuerAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/form/invite/broker')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForIssuerAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForIssuerAsThirdPartyBodyInput,
  ): Promise<InviteForIssuerOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      if (!inviteBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: InviteForIssuerOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.issuerId, // The broker needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for issuer-related on-boarding as broker',
        'inviteForIssuerAsBroker',
        true,
        500,
      );
    }
  }

  @Post('/form/submit/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async submitForIssuer(
    @UserContext() userContext: IUserContext,
    @Body() submitBody: SubmitForIssuerBodyInput,
  ): Promise<SubmitForIssuerOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: SubmitForIssuerOutput =
        await this.kycWorkflowGenericService.submitKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          submitBody.issuerId,
          EntityType.ISSUER,
          submitBody.elements,
          undefined, //assetClassKey
          submitBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting issuer-related KYC',
        'submitForIssuer',
        true,
        500,
      );
    }
  }

  @Post('/form/review/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForIssuerAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ReviewForIssuerBodyInput,
  ): Promise<ReviewForIssuerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: ReviewForIssuerOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          userContext[UserContextKeys.USER_ID],
          EntityType.ISSUER,
          reviewBody.validations,
          undefined, // assetClassKey
          reviewBody.clientCategory,
          reviewBody.riskProfile,
          reviewBody.validityDate,
          reviewBody.comment,
          reviewBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reviewing issuer-related KYC, as reviewer',
        'reviewForIssuerAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/review/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForIssuerAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ReviewForIssuerAsThirdPartyBodyInput,
  ): Promise<ReviewForIssuerOutput> {
    try {
      const typeFunctionUser = UserType.VERIFIER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      if (!reviewBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, verifier shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: ReviewForIssuerOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.issuerId, // The verifier needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          reviewBody.validations,
          undefined, // assetClassKey
          reviewBody.clientCategory,
          reviewBody.riskProfile,
          reviewBody.validityDate,
          reviewBody.comment,
          reviewBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reviewing issuer-related KYC, as verifier',
        'reviewForIssuerAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/form/review/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForIssuerAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ReviewForIssuerAsThirdPartyBodyInput,
  ): Promise<ReviewForIssuerOutput> {
    try {
      const typeFunctionUser = UserType.UNDERWRITER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      if (!reviewBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: ReviewForIssuerOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          reviewBody.validations,
          undefined, // assetClassKey
          reviewBody.clientCategory,
          reviewBody.riskProfile,
          reviewBody.validityDate,
          reviewBody.comment,
          reviewBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reviewing issuer-related KYC, as underwriter',
        'reviewForIssuerAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/form/review/broker')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForIssuerAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ReviewForIssuerAsThirdPartyBodyInput,
  ): Promise<ReviewForIssuerOutput> {
    try {
      const typeFunctionUser = UserType.BROKER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      if (!reviewBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: ReviewForIssuerOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.issuerId, // The broker needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          reviewBody.validations,
          undefined, // assetClassKey
          reviewBody.clientCategory,
          reviewBody.riskProfile,
          reviewBody.validityDate,
          reviewBody.comment,
          reviewBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reviewing issuer-related KYC, as broker',
        'reviewForIssuerAsBroker',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForIssuerAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForIssuerBodyInput,
  ): Promise<AllowListForIssuerOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          userContext[UserContextKeys.USER_ID],
          EntityType.ISSUER,
          undefined, // assetClassKey
          allowListBody.clientCategory,
          allowListBody.riskProfile,
          allowListBody.validityDate,
          allowListBody.comment,
          allowListBody.sendNotification,
          FunctionName.KYC_INVITE,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'allowListing user for issuer as reviewer',
        'allowListUserForIssuerAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/verifier')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForIssuerAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForIssuerAsVerifierBodyInput,
  ): Promise<AllowListForIssuerOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      if (!allowListBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, verifier shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.issuerId, // The verifier needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          allowListBody.clientCategory,
          allowListBody.riskProfile,
          allowListBody.validityDate,
          allowListBody.comment,
          allowListBody.sendNotification,
          FunctionName.KYC_INVITE,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'allowListing user for issuer as verifier',
        'allowListUserForIssuerAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/underwriter')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForIssuerAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForIssuerAsVerifierBodyInput,
  ): Promise<AllowListForIssuerOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      if (!allowListBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          allowListBody.clientCategory,
          allowListBody.riskProfile,
          allowListBody.validityDate,
          allowListBody.comment,
          allowListBody.sendNotification,
          FunctionName.KYC_INVITE,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'allowListing user for issuer as underwriter',
        'allowListUserForIssuerAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/broker')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForIssuerAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForIssuerAsVerifierBodyInput,
  ): Promise<AllowListForIssuerOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      if (!allowListBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.issuerId, // The broker needs to specify for which issuer the investor shall be on-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          allowListBody.clientCategory,
          allowListBody.riskProfile,
          allowListBody.validityDate,
          allowListBody.comment,
          allowListBody.sendNotification,
          FunctionName.KYC_INVITE,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'allowListing user for issuer as broker',
        'allowListUserForIssuerAsBroker',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUserIssuerLink(
    @UserContext() userContext: IUserContext,
    @Query() linkQuery: RetrieveIssuerLinkQueryInput,
  ): Promise<RetrieveIssuerLinkOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const link: Link = await this.linkService.retrieveStrictUserEntityLink(
        userContext[UserContextKeys.TENANT_ID],
        linkQuery.submitterId,
        UserType.INVESTOR,
        linkQuery.issuerId,
        EntityType.ISSUER,
        undefined, //assetClassKey
      );

      const response: RetrieveIssuerLinkOutput = {
        link: link,
        message: `Link between user ${linkQuery.submitterId} and issuer ${linkQuery.issuerId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user-issuer link',
        'retrieveUserIssuerLink',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForIssuerAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          userContext[UserContextKeys.USER_ID],
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for issuer as reviewer',
        'unvalidateUserForIssuerAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForIssuerAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, verifier shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.issuerId, // The verifier needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for issuer as verifier',
        'unvalidateUserForIssuerAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForIssuerAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for issuer as underwriter',
        'unvalidateUserForIssuerAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/broker')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForIssuerAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.issuerId, // The broker needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for issuer as broker',
        'unvalidateUserForIssuerAsBroker',
        true,
        500,
      );
    }
  }

  @Put('/reject/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForIssuerAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          userContext[UserContextKeys.USER_ID],
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for issuer as reviewer',
        'rejectUserForIssuerAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/reject/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForIssuerAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, verifier shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.issuerId, // The verifier needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for issuer as verifier',
        'rejectUserForIssuerAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/reject/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForIssuerAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for issuer as underwriter',
        'rejectUserForIssuerAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Put('/reject/broker')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForIssuerAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectIssuerLinkAsThirdPartyBodyInput,
  ): Promise<UnvalidateOrRejectIssuerLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.issuerId, // The broker needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for issuer as broker',
        'rejectUserForIssuerAsBroker',
        true,
        500,
      );
    }
  }

  @Delete('/remove/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async deleteUserTokenLinkAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: DeleteIssuerLinkBodyInput,
  ): Promise<DeleteIssuerLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteIssuerLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          userContext[UserContextKeys.USER_ID],
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-issuer link, as reviewer',
        'deleteUserTokenLinkAsReviewer',
        true,
        500,
      );
    }
  }

  @Delete('/remove/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async deleteUserTokenLinkAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: DeleteTokenLinkAsThirdPartyBodyInput,
  ): Promise<DeleteIssuerLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, underwriter shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: DeleteIssuerLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.issuerId, // The underwriter needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-issuer link as underwriter',
        'deleteUserTokenLinkAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Delete('/remove/broker')
  @HttpCode(200)
  @Protected(true, [])
  async deleteUserTokenLinkAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: DeleteTokenLinkAsThirdPartyBodyInput,
  ): Promise<DeleteIssuerLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      if (!linkBody.issuerId) {
        ErrorService.throwError(
          'As this is an "issuer-related" on-boarding, broker shall specify the "issuerId" of the issuer, the on-boarding relates to',
        );
      }

      const response: DeleteIssuerLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.issuerId, // The broker needs to specify for which issuer the investor shall be off-boarded
          EntityType.ISSUER,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-issuer link as broker',
        'deleteUserTokenLinkAsBroker',
        true,
        500,
      );
    }
  }
}
