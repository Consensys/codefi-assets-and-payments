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
  InviteForTokenBodyInput,
  InviteForTokenOutput,
  SubmitForTokenBodyInput,
  SubmitForTokenOutput,
  ValidateForTokenBodyInput,
  ValidateForTokenOutput,
  AllowListForTokenBodyInput,
  AllowListForTokenOutput,
  RetrieveTokenLinkQueryInput,
  RetrieveTokenLinkOutput,
  UnvalidateOrRejectTokenLinkBodyInput,
  UnvalidateOrRejectTokenLinkOutput,
  DeleteTokenLinkBodyInput,
  DeleteTokenLinkOutput,
} from './kyc.workflow.token.dto';
import { EntityType } from 'src/types/entity';
import { KYCWorkflowGenericService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/workflow';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import {
  AllowListOutput,
  UnvalidateOutput,
} from 'src/modules/v2KYCWorkflow/kyc.workflow.dto';
import { LinkService } from 'src/modules/v2Link/link.service';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { KYCWorkflowHelperService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { setToLowerCase } from 'src/utils/case';
import { FunctionName } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/workflows/kyc/token-related')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCWorkflowTokenRelatedController {
  constructor(
    private readonly kycWorkflowHelperService: KYCWorkflowHelperService,
    private readonly kycWorkflowGenericService: KYCWorkflowGenericService,
    private readonly kycWorkflowAllowListService: KYCWorkflowAllowListService,
    private readonly linkService: LinkService,
  ) {}

  @Post('/form/invite/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForTokenAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForTokenBodyInput,
  ): Promise<InviteForTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: InviteForTokenOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(inviteBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for token, as reviewer',
        'inviteForTokenAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/invite/underwriter')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForTokenAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForTokenBodyInput,
  ): Promise<InviteForTokenOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: InviteForTokenOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(inviteBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for token as underwriter',
        'inviteForTokenAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/form/invite/broker')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForTokenAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForTokenBodyInput,
  ): Promise<InviteForTokenOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: InviteForTokenOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(inviteBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for token as broker',
        'inviteForTokenAsBroker',
        true,
        500,
      );
    }
  }

  @Post('/form/submit/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async submitForToken(
    @UserContext() userContext: IUserContext,
    @Body() submitBody: SubmitForTokenBodyInput,
  ): Promise<SubmitForTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SubmitForTokenOutput =
        await this.kycWorkflowGenericService.submitKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          submitBody.tokenId,
          EntityType.TOKEN,
          submitBody.elements,
          setToLowerCase(submitBody.assetClass),
          submitBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting token-related KYC',
        'submitForToken',
        true,
        500,
      );
    }
  }

  @Post('/form/review/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForTokenAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForTokenBodyInput,
  ): Promise<ValidateForTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: ValidateForTokenOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.tokenId,
          EntityType.TOKEN,
          reviewBody.validations,
          setToLowerCase(reviewBody.assetClass),
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
        'reviewing token-related KYC, as reviewer',
        'reviewForTokenAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/review/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForTokenAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForTokenBodyInput,
  ): Promise<ValidateForTokenOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: ValidateForTokenOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.tokenId,
          EntityType.TOKEN,
          reviewBody.validations,
          setToLowerCase(reviewBody.assetClass),
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
        'reviewing token-related KYC, as verifier',
        'reviewForTokenAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/form/review/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForTokenAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForTokenBodyInput,
  ): Promise<ValidateForTokenOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: ValidateForTokenOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.tokenId,
          EntityType.TOKEN,
          reviewBody.validations,
          setToLowerCase(reviewBody.assetClass),
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
        'reviewing token-related KYC, as underwriter',
        'reviewForTokenAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/form/review/broker')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForTokenAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForTokenBodyInput,
  ): Promise<ValidateForTokenOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: ValidateForTokenOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.tokenId,
          EntityType.TOKEN,
          reviewBody.validations,
          setToLowerCase(reviewBody.assetClass),
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
        'reviewing token-related KYC, as broker',
        'reviewForTokenAsBroker',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForTokenAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForTokenBodyInput,
  ): Promise<AllowListForTokenOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(allowListBody.assetClass), // assetClassKey
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
        'allowListing user for token as reviewer',
        'allowListUserForTokenAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/verifier')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForTokenAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForTokenBodyInput,
  ): Promise<AllowListForTokenOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(allowListBody.assetClass), // assetClassKey
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
        'allowListing user for token as verifier',
        'allowListUserForTokenAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/underwriter')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForTokenAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForTokenBodyInput,
  ): Promise<AllowListForTokenOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(allowListBody.assetClass), // assetClassKey
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
        'allowListing user for token as underwriter',
        'allowListUserForTokenAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/broker')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForTokenAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForTokenBodyInput,
  ): Promise<AllowListForTokenOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(allowListBody.assetClass), // assetClassKey
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
        'allowListing user for token as broker',
        'allowListUserForTokenAsBroker',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUserTokenLink(
    @UserContext() userContext: IUserContext,
    @Query() linkQuery: RetrieveTokenLinkQueryInput,
  ): Promise<RetrieveTokenLinkOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      if (linkQuery.submitterId !== userContext[UserContextKeys.USER_ID]) {
        const issuer: User =
          await this.linkService.retrieveIssuerLinkedToEntity(
            userContext[UserContextKeys.TENANT_ID],
            linkQuery.tokenId,
            EntityType.TOKEN,
          );
        if (issuer[UserKeys.USER_ID] !== userContext[UserContextKeys.USER_ID]) {
          ErrorService.throwError(
            `only the token's issuer ${
              issuer[UserKeys.USER_ID]
            } is authorized to retrieve user-token link`,
          );
        }
      }

      const links: Array<Link> =
        await this.linkService.exhaustiveListAllUserEntityLinks(
          userContext[UserContextKeys.TENANT_ID],
          linkQuery.submitterId,
          UserType.INVESTOR,
          linkQuery.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkQuery.assetClass),
        );

      const response: RetrieveTokenLinkOutput = {
        links: links,
        message: `${links.length} link(s) between user ${linkQuery.submitterId} and token ${linkQuery.tokenId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user-token link(s)',
        'retrieveUserTokenLink',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForTokenAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for token as reviewer',
        'unvalidateUserForTokenAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForTokenAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for token as verifier',
        'unvalidateUserForTokenAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForTokenAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for token as underwriter',
        'unvalidateUserForTokenAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/broker')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForTokenAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for token as broker',
        'unvalidateUserForTokenAsBroker',
        true,
        500,
      );
    }
  }

  @Put('/reject/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForTokenAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for token as reviewer',
        'rejectUserForTokenAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/reject/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForTokenAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for token as verifier',
        'rejectUserForTokenAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/reject/underwriter')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForTokenAsUnderwriter(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for token as underwriter',
        'rejectUserForTokenAsUnderwriter',
        true,
        500,
      );
    }
  }

  @Put('/reject/broker')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForTokenAsBroker(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectTokenLinkBodyInput,
  ): Promise<UnvalidateOrRejectTokenLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for token as broker',
        'rejectUserForTokenAsBroker',
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
    @Body() linkBody: DeleteTokenLinkBodyInput,
  ): Promise<DeleteTokenLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteTokenLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-token link, as reviewer',
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
    @Body() linkBody: DeleteTokenLinkBodyInput,
  ): Promise<DeleteTokenLinkOutput> {
    try {
      checkUserType(UserType.UNDERWRITER, userContext[UserContextKeys.USER]);

      const response: DeleteTokenLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-token link as underwriter',
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
    @Body() linkBody: DeleteTokenLinkBodyInput,
  ): Promise<DeleteTokenLinkOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: DeleteTokenLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.tokenId,
          EntityType.TOKEN,
          setToLowerCase(linkBody.assetClass),
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-token link as broker',
        'deleteUserTokenLinkAsBroker',
        true,
        500,
      );
    }
  }
}
