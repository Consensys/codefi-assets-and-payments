import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { DeleteUserOutput } from '../user.dto';
import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { DeleteKycDataOutput } from 'src/modules/v2KYCData/kyc.data.dto';
import { keys as UserKeys, User } from 'src/types/user';
import { EntityType } from 'src/types/entity';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { ApiAdminCallService } from 'src/modules/v2ApiCall/api.call.service/admin';
import { Auth0User } from 'src/types/authentication';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class UserDeletionService {
  constructor(
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly kycDataService: KYCDataService,
    private readonly apiAdminCallService: ApiAdminCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
  ) {}

  /**
   * [Delete a specific user + associated data]
   */
  async deleteUserById(
    tenantId: string,
    userId: string,
    auth0UserDelete: boolean,
  ): Promise<DeleteUserOutput> {
    try {
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      const deletedAuth0Users: Array<string> = [];
      if (auth0UserDelete) {
        // We try to retrieve the user in Auth0 to make sure it exists
        const auth0User: Auth0User =
          await this.apiAdminCallService.retrieveUsersInAuth0ById(
            tenantId,
            user[UserKeys.AUTH_ID],
          );

        await this.apiAdminCallService.deleteUserInAuth0ById(
          tenantId,
          auth0User.userId,
        );
        deletedAuth0Users.push(auth0User.userId);
      }

      // Caution: KYC data deletion needs to be performed before Links deletion (links are used to delete KYC)

      // Delete KYC data
      const deletedKycData1: DeleteKycDataOutput =
        user[UserKeys.DATA] &&
        user[UserKeys.DATA][UserKeys.DATA__KYC_TEMPLATE_ID]
          ? await this.kycDataService.deleteAllEntityKycData(
              tenantId,
              userId,
              EntityType.ISSUER,
            )
          : {
              deletedElementInstances: [],
              deletedElementReviews: [],
              deletedTemplateReviews: [],
              message: '',
            };

      const deletedKycData2: DeleteKycDataOutput =
        await this.kycDataService.deleteAllInvestorKycData(tenantId, userId);

      // Delete links
      const deletedLinkIds1: Array<number> =
        await this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          userId,
          WorkflowType.LINK,
        );
      const deletedLinkIds2: Array<number> =
        await this.workflowService.deleteAllUserWorkflowInstances(
          tenantId,
          userId,
          WorkflowType.LINK,
        );

      const [deletedActionIds, deletedTokenDeploymentIds, deletedOrderIds]: [
        Array<number>,
        Array<number>,
        Array<number>,
      ] = await Promise.all([
        this.workflowService.deleteAllUserWorkflowInstances(
          tenantId,
          userId,
          WorkflowType.ACTION,
        ),
        this.workflowService.deleteAllUserWorkflowInstances(
          tenantId,
          userId,
          WorkflowType.TOKEN,
        ),
        this.workflowService.deleteAllUserWorkflowInstances(
          tenantId,
          userId,
          WorkflowType.ORDER,
        ),
      ]);

      await this.apiEntityCallService.deleteEntity(tenantId, userId);

      return {
        deletedElementInstances: deletedKycData1.deletedElementInstances.concat(
          deletedKycData2.deletedElementInstances,
        ),
        deletedElementReviews: deletedKycData1.deletedElementReviews.concat(
          deletedKycData2.deletedElementReviews,
        ),
        deletedTemplateReviews: deletedKycData1.deletedTemplateReviews.concat(
          deletedKycData2.deletedTemplateReviews,
        ),
        deletedTokenDeployments: deletedTokenDeploymentIds,
        deletedActions: deletedActionIds,
        deletedOrders: deletedOrderIds,
        deletedLinks: deletedLinkIds1.concat(deletedLinkIds2),
        deletedAuth0Users,
        message: `User ${userId} deleted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting a user',
        'deleteUserById',
        false,
        500,
      );
    }
  }
}
