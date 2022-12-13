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
  InviteForPlatformBodyInput,
  InviteForPlatformOutput,
  SubmitForPlatformBodyInput,
  SubmitForPlatformOutput,
  ValidateForPlatformBodyInput,
  ValidateForPlatformOutput,
  AllowListForPlatformBodyInput,
  AllowListForPlatformOutput,
  UnvalidateOrRejectPlatformLinkBodyInput,
  UnvalidateOrRejectPlatformLinkOutput,
  ValidateForVerifierBodyInput,
  ValidateForVerifierOutput,
  RetrievePlatformLinkQueryInput,
  RetrievePlatformLinkOutput,
  DeletePlatformLinkBodyInput,
  DeletePlatformLinkOutput,
} from './kyc.workflow.platform.dto';
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
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/workflows/kyc/platform-related')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCWorkflowPlatformRelatedController {
  constructor(
    private readonly kycWorkflowHelperService: KYCWorkflowHelperService,
    private readonly kycWorkflowGenericService: KYCWorkflowGenericService,
    private readonly kycWorkflowAllowListService: KYCWorkflowAllowListService,
    private readonly linkService: LinkService,
  ) {}

  @Post('/form/invite/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForPlatformAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForPlatformBodyInput,
  ): Promise<InviteForPlatformOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: InviteForPlatformOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for platform, as reviewer',
        'inviteForPlatformAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/submit/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async submitForPlatform(
    @UserContext() userContext: IUserContext,
    @Body() submitBody: SubmitForPlatformBodyInput,
  ): Promise<SubmitForPlatformOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SubmitForPlatformOutput =
        await this.kycWorkflowGenericService.submitKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          undefined, // entityId
          EntityType.PLATFORM,
          submitBody.elements,
          undefined, //assetClassKey
          submitBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting KYC for platform',
        'submitForPlatform',
        true,
        500,
      );
    }
  }

  @Post('/form/review/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForPlatformAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForPlatformBodyInput,
  ): Promise<ValidateForPlatformOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: ValidateForPlatformOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
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
        'reviewing platform-related KYC, as reviewer',
        'reviewForPlatformAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/review/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async validateForPlatformAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForVerifierBodyInput,
  ): Promise<ValidateForVerifierOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: ValidateForVerifierOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
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
        'validating KYC for platform, as verifier',
        'validateForPlatformAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async allowListInvestorForPlatformAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForPlatformBodyInput,
  ): Promise<AllowListForPlatformOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
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
        'allowListing user for platform as reviewer',
        'allowListInvestorForPlatformAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/verifier')
  @HttpCode(201)
  @Protected(true, [])
  async allowListInvestorForPlatformAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForPlatformBodyInput,
  ): Promise<AllowListForPlatformOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
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
        'allowListing user for platform as verifier',
        'allowListInvestorForPlatformAsVerifier',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUserPlatformLink(
    @UserContext() userContext: IUserContext,
    @Query() linkQuery: RetrievePlatformLinkQueryInput,
  ): Promise<RetrievePlatformLinkOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const link: Link = await this.linkService.retrieveStrictUserEntityLink(
        userContext[UserContextKeys.TENANT_ID],
        linkQuery.submitterId,
        UserType.INVESTOR,
        undefined, // entityId
        EntityType.PLATFORM,
        undefined, //assetClassKey
      );

      const response: RetrievePlatformLinkOutput = {
        link: link,
        message: `Link between user ${linkQuery.submitterId} and platform retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user-platform link',
        'retrieveUserPlatformLink',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForPlatformAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectPlatformLinkBodyInput,
  ): Promise<UnvalidateOrRejectPlatformLinkOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for platform as reviewer',
        'unvalidateUserForPlatformAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForPlatformAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectPlatformLinkBodyInput,
  ): Promise<UnvalidateOrRejectPlatformLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for platform as verifier',
        'unvalidateUserForPlatformAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/reject/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForPlatformAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectPlatformLinkBodyInput,
  ): Promise<UnvalidateOrRejectPlatformLinkOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for platform as reviewer',
        'rejectUserForPlatformAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/reject/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForPlatformAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectPlatformLinkBodyInput,
  ): Promise<UnvalidateOrRejectPlatformLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for platform as verifier',
        'rejectUserForPlatformAsVerifier',
        true,
        500,
      );
    }
  }

  @Delete('/remove/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async deleteUserPlatformLinkAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: DeletePlatformLinkBodyInput,
  ): Promise<DeletePlatformLinkOutput> {
    try {
      checkUserType(UserType.ADMIN, userContext[UserContextKeys.USER]);

      const response: DeletePlatformLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          undefined, // entityId
          EntityType.PLATFORM,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-platform link, as reviewer',
        'deleteUserPlatformLinkAsReviewer',
        true,
        500,
      );
    }
  }
}
