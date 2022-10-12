import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { TokenIdentifierEnum } from 'src/old/constants/enum';

import { keys as TokenKeys } from 'src/types/token';

import { DeleteTokenOutput } from '../token.dto';
import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { DeleteKycDataOutput } from 'src/modules/v2KYCData/kyc.data.dto';
import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { EntityType } from 'src/types/entity';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { TokenCategory } from 'src/types/smartContract';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';

@Injectable()
export class TokenDeletionService {
  constructor(
    private readonly cycleService: CycleService,
    private readonly entityService: EntityService,
    private readonly kycDataService: KYCDataService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
  ) {}

  /**
   * [Delete token]
   */
  deleteToken = async (
    tenantId: string,
    tokenCategory: TokenCategory,
    userId: string,
    tokenId: string,
  ): Promise<DeleteTokenOutput> => {
    try {
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      await this.entityService.checkEntityCanBeUpdatedOrDeleted(
        tenantId,
        userId,
        tokenId,
        EntityType.TOKEN,
        token,
      );

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      let deletedKycData: DeleteKycDataOutput;
      if (
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__KYC_TEMPLATE_ID]
      ) {
        // Caution: KYC data deletion needs to be performed before Links deletion (links are used to delete KYC)
        deletedKycData = await this.kycDataService.deleteAllEntityKycData(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        );
      }

      const deletedCycleIds: Array<string> =
        await this.cycleService.deleteAllTokenCycles(tenantId, tokenId);

      const [
        deletedTokenDeploymentIds,
        deletedNavIds,
        deletedActionIds,
        deletedOrderIds,
        deletedLinkIds,
        deletedOfferIds,
      ]: [
        Array<number>,
        Array<number>,
        Array<number>,
        Array<number>,
        Array<number>,
        Array<number>,
      ] = await Promise.all([
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.TOKEN,
        ),
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.NAV,
        ),
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.ACTION,
        ),
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.ORDER,
        ),
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.LINK,
        ),
        this.workflowService.deleteAllEntityWorkflowInstances(
          tenantId,
          tokenId,
          WorkflowType.OFFER,
        ),
      ]);

      await this.apiMetadataCallService.deleteTokenInDB(
        tenantId,
        token[TokenKeys.TOKEN_ID],
      );

      return {
        deletedCycles: deletedCycleIds,
        deletedElementReviews:
          deletedKycData && deletedKycData.deletedElementReviews
            ? deletedKycData.deletedElementReviews
            : [],
        deletedTemplateReviews:
          deletedKycData && deletedKycData.deletedTemplateReviews
            ? deletedKycData.deletedTemplateReviews
            : [],
        deletedTokenDeployments: deletedTokenDeploymentIds,
        deletedNavs: deletedNavIds,
        deletedActions: deletedActionIds,
        deletedOrders: deletedOrderIds,
        deletedLinks: deletedLinkIds,
        deletedOffers: deletedOfferIds,
        message: `${setToLowerCaseExceptFirstLetter(tokenCategory)} token ${
          token[TokenKeys.TOKEN_ID]
        } deleted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting token',
        'deleteToken',
        false,
        500,
      );
    }
  };
}
