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
  InviteForProjectBodyInput,
  InviteForProjectOutput,
  SubmitForProjectBodyInput,
  SubmitForProjectOutput,
  ValidateForProjectBodyInput,
  ValidateForProjectOutput,
  AllowListForProjectBodyInput,
  AllowListForProjectOutput,
  RetrieveProjectLinkQueryInput,
  RetrieveProjectLinkOutput,
  UnvalidateOrRejectProjectLinkBodyInput,
  UnvalidateOrRejectProjectLinkOutput,
  DeleteProjectLinkBodyInput,
  DeleteProjectLinkOutput,
} from './kyc.workflow.project.dto';
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
import { FunctionName } from 'src/types/smartContract';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { Protected } from '@codefi-assets-and-payments/auth';
import { AppToHttpFilter } from '@codefi-assets-and-payments/error-handler';

@Controller('v2/workflows/kyc/project-related')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class KYCWorkflowProjectRelatedController {
  constructor(
    private readonly kycWorkflowHelperService: KYCWorkflowHelperService,
    private readonly kycWorkflowGenericService: KYCWorkflowGenericService,
    private readonly kycWorkflowAllowListService: KYCWorkflowAllowListService,
    private readonly linkService: LinkService,
  ) {}

  @Post('/form/invite/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async inviteForProjectAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() inviteBody: InviteForProjectBodyInput,
  ): Promise<InviteForProjectOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: InviteForProjectOutput =
        await this.kycWorkflowGenericService.inviteUserForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          inviteBody.submitterId,
          inviteBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'inviting user for project, as reviewer',
        'inviteForProjectAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/submit/submitter')
  @HttpCode(200)
  @Protected(true, [])
  async submitForProject(
    @UserContext() userContext: IUserContext,
    @Body() submitBody: SubmitForProjectBodyInput,
  ): Promise<SubmitForProjectOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SubmitForProjectOutput =
        await this.kycWorkflowGenericService.submitKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          submitBody.projectId,
          EntityType.PROJECT,
          submitBody.elements,
          undefined, // assetClassKey
          submitBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting project-related KYC',
        'submitForProject',
        true,
        500,
      );
    }
  }

  @Post('/form/review/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForProjectAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForProjectBodyInput,
  ): Promise<ValidateForProjectOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: ValidateForProjectOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.projectId,
          EntityType.PROJECT,
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
        'reviewing project-related KYC, as reviewer',
        'reviewForProjectAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/form/review/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async reviewForProjectAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() reviewBody: ValidateForProjectBodyInput,
  ): Promise<ValidateForProjectOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: ValidateForProjectOutput =
        await this.kycWorkflowGenericService.reviewKycElementInstances(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          reviewBody.submitterId,
          reviewBody.projectId,
          EntityType.PROJECT,
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
        'reviewing project-related KYC, as verifier',
        'reviewForProjectAsVerifier',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/reviewer')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForProjectAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForProjectBodyInput,
  ): Promise<AllowListForProjectOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.projectId,
          EntityType.PROJECT,
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
        'allowListing user for project as reviewer',
        'allowListUserForProjectAsReviewer',
        true,
        500,
      );
    }
  }

  @Post('/allowlist/verifier')
  @HttpCode(201)
  @Protected(true, [])
  async allowListUserForProjectAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() allowListBody: AllowListForProjectBodyInput,
  ): Promise<AllowListForProjectOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: AllowListOutput =
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          allowListBody.submitterId,
          allowListBody.projectId,
          EntityType.PROJECT,
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
        'allowListing user for project as verifier',
        'allowListUserForProjectAsVerifier',
        true,
        500,
      );
    }
  }

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async retrieveUserProjectLink(
    @UserContext() userContext: IUserContext,
    @Query() linkQuery: RetrieveProjectLinkQueryInput,
  ): Promise<RetrieveProjectLinkOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      if (linkQuery.submitterId !== userContext[UserContextKeys.USER_ID]) {
        const issuer: User =
          await this.linkService.retrieveIssuerLinkedToEntity(
            userContext[UserContextKeys.TENANT_ID],
            linkQuery.projectId,
            EntityType.PROJECT,
          );
        if (issuer[UserKeys.USER_ID] !== userContext[UserContextKeys.USER_ID]) {
          ErrorService.throwError(
            `only the project's issuer ${
              issuer[UserKeys.USER_ID]
            } is authorized to retrieve user-project link`,
          );
        }
      }

      const links: Array<Link> =
        await this.linkService.exhaustiveListAllUserEntityLinks(
          userContext[UserContextKeys.TENANT_ID],
          linkQuery.submitterId,
          UserType.INVESTOR,
          linkQuery.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
        );

      const response: RetrieveProjectLinkOutput = {
        links: links,
        message: `${links.length} link(s) between user ${linkQuery.submitterId} and project ${linkQuery.projectId} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving user-project link(s)',
        'retrieveUserProjectLink',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForProjectAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectProjectLinkBodyInput,
  ): Promise<UnvalidateOrRejectProjectLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for project as reviewer',
        'unvalidateUserForProjectAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/unvalidate/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async unvalidateUserForProjectAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectProjectLinkBodyInput,
  ): Promise<UnvalidateOrRejectProjectLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_UNVALIDATE,
          linkBody.submitterId,
          linkBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unvalidating user for project as verifier',
        'unvalidateUserForProjectAsVerifier',
        true,
        500,
      );
    }
  }

  @Put('/reject/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForProjectAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectProjectLinkBodyInput,
  ): Promise<UnvalidateOrRejectProjectLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for project as reviewer',
        'rejectUserForProjectAsReviewer',
        true,
        500,
      );
    }
  }

  @Put('/reject/verifier')
  @HttpCode(200)
  @Protected(true, [])
  async rejectUserForProjectAsVerifier(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: UnvalidateOrRejectProjectLinkBodyInput,
  ): Promise<UnvalidateOrRejectProjectLinkOutput> {
    try {
      checkUserType(UserType.VERIFIER, userContext[UserContextKeys.USER]);

      const response: UnvalidateOutput =
        await this.kycWorkflowAllowListService.unvalidateOrRejectSubmitterForEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          FunctionName.KYC_REJECT,
          linkBody.submitterId,
          linkBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
          linkBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting user for project as verifier',
        'rejectUserForProjectAsVerifier',
        true,
        500,
      );
    }
  }

  @Delete('/remove/reviewer')
  @HttpCode(200)
  @Protected(true, [])
  async deleteUserProjectLinkAsReviewer(
    @UserContext() userContext: IUserContext,
    @Body() linkBody: DeleteProjectLinkBodyInput,
  ): Promise<DeleteProjectLinkOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: DeleteProjectLinkOutput =
        await this.kycWorkflowHelperService.unlinkUserFromEntity(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          linkBody.submitterId,
          linkBody.projectId,
          EntityType.PROJECT,
          undefined, // assetClassKey
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting user-project link, as reviewer',
        'deleteUserProjectLinkAsReviewer',
        true,
        500,
      );
    }
  }
}
