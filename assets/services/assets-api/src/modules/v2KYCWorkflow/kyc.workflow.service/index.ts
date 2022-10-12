import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { LinkService } from 'src/modules/v2Link/link.service';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { EntityType } from 'src/types/entity';
import { Config } from 'src/types/config';
import { Project } from 'src/types/project';
import { keys as TokenKeys, Token } from 'src/types/token';
import {
  ERC20Balances,
  ERC721Balances,
  ERC1400Balances,
  keys as BalanceKeys,
} from 'src/types/balance';

import { KYCDataService } from 'src/modules/v2KYCData/kyc.data.service';
import { UnlinkOutput } from '../kyc.workflow.dto';
import { DeleteKycDataOutput } from 'src/modules/v2KYCData/kyc.data.dto';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { keys as LinkKeys } from 'src/types/workflow/workflowInstances';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class KYCWorkflowHelperService {
  constructor(
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly entityService: EntityService,
    private readonly kycDataService: KYCDataService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly linkService: LinkService,
    private readonly balanceService: BalanceService,
  ) {}

  /**
   * [Unlink user from entity]
   */
  async unlinkUserFromEntity(
    tenantId: string,
    reviewer: User,
    submitterId: string,
    entityId: string,
    entityType: EntityType,
    assetClassKey: string, // only used if 'entityType=TOKEN'
  ): Promise<UnlinkOutput> {
    try {
      // Check if submitter is already linked to entity (e.g. submitter is invited for entity)
      const link: Link = await this.linkService.retrieveStrictUserEntityLink(
        tenantId,
        submitterId,
        UserType.INVESTOR,
        entityId,
        entityType,
        assetClassKey,
      );

      // If the caller is a broker, make sure the link contains the correct brokerId
      if (reviewer[UserKeys.USER_TYPE] === UserType.BROKER) {
        this.linkService.checkBrokerLinks(link, reviewer[UserKeys.USER_ID]);
      }

      // Check if submitter exists
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        submitterId,
        true,
      );

      // Check if user is issuer of the entity
      const [, , token]: [Project, User, Token, Config] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          reviewer[UserKeys.USER_ID],
          'unlink user from entity link',
          entityId,
          entityType,
        );

      // Check that balances are non null (only if token is deployed)
      if (
        (entityType === EntityType.TOKEN ||
          entityType === EntityType.ASSET_CLASS) &&
        token[TokenKeys.DEFAULT_DEPLOYMENT] // We shall only try to fetch balances if token is deployed, otherwise we skip this check
      ) {
        const allBalances: ERC20Balances | ERC721Balances | ERC1400Balances =
          await this.balanceService.listAllUserBalancesForAnyToken(
            tenantId,
            reviewer[UserKeys.USER_ID],
            user,
            [link],
            token,
            assetClassKey,
            false,
            false, // extensionDeployed (Here we don't care about balances "on hold" stored in the extension. By setting the value to 'false', we will not retrieve those.)
          );
        if (allBalances[BalanceKeys.TOTAL] > 0) {
          ErrorService.throwError(
            `user cannont be removed because of non negative (balance: ${
              allBalances[BalanceKeys.TOTAL]
            })`,
          );
        }
      }

      // Delete KYC review (if there is one)
      const kycDataDeletionResponse: DeleteKycDataOutput =
        await this.kycDataService.deleteSubmitterKycDataForEntity(
          tenantId,
          submitterId,
          entityId,
          entityType,
          assetClassKey,
          false, // deleteElementInstances
          true, // deleteReviews
        );

      // Update investor-token link
      await this.workflowService.deleteWorkflowInstance(
        tenantId,
        link[LinkKeys.ID],
      );

      return {
        deletedElementReviews: kycDataDeletionResponse.deletedElementReviews,
        deletedTemplateReviews: kycDataDeletionResponse.deletedTemplateReviews,
        message: `User ${submitterId} unlinked successfully from${
          assetClassKey ? ` asset class ${assetClassKey} of` : ''
        } ${entityType.toLowerCase()} ${entityId || ''}`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'unlinking user from entity',
        'unlinkUserFromEntity',
        false,
        500,
      );
    }
  }
}
