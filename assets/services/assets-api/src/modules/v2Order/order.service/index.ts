import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';
import { Order } from 'src/types/workflow/workflowInstances/order';
import {
  keys as LinkKeys,
  WorkflowType,
  WorkflowInstance,
  OrderSide,
} from 'src/types/workflow/workflowInstances';
import { User, UserType, keys as UserKeys } from 'src/types/user';

import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import { HookCallBack } from 'src/types/hook';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { TxStatus } from 'src/types/transaction';
import { LinkService } from 'src/modules/v2Link/link.service';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { checkLinkStateValidForUserType } from 'src/utils/checks/links';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { WorkflowName } from 'src/types/workflow/workflowTemplate';
import {
  getQueryFilters,
  getFiltersForOrders,
} from 'src/utils/checks/v2Filters';
import {
  Field,
  SortCriteria,
  V2QueryOption,
} from 'src/modules/v2ApiCall/api.call.service/query';

@Injectable()
export class OrderService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly workflowInstanceService: WorkflowInstanceService,
    @Inject(forwardRef(() => TransactionHelperService))
    private readonly transactionHelperService: TransactionHelperService,
    private readonly linkService: LinkService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
  ) {}

  /**
   * Retrieve list of orders
   */
  async listAllOrders(
    tenantId: string,
    user: User,
    tokenId: string,
    workflowName: WorkflowName,
    tokenIds: Array<string>, // Optional filter (not taken into account in case tokenId is defined)
    workflowInstancesStates: Array<string>, // Optional filter
    functionNames: Array<string>, // Optional filter
    userIds: Array<string>, // Optional filter
    dates: Array<Date>, // Optional filter
    sorts?: Array<SortCriteria>, // Optional V2 Sorts
    orderSide?: OrderSide, // Optional filter
    price?: Partial<Field>,
    quantity?: Partial<Field>,
    publicOrders?: boolean, // Optional filter
  ): Promise<Array<Order>> {
    try {
      // TODO: Temporary fix
      // we will need remove this if conditinoal once the postman collection and assets front is updated to support this.
      let workflowTemplate;
      if (workflowName) {
        workflowTemplate =
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            workflowName,
          );
      }

      let queryOption: V2QueryOption;
      if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
        queryOption = {
          callerId: user[UserKeys.USER_ID],
          isInvestorQuery: publicOrders !== true,
        };
      }

      const filters = getFiltersForOrders(
        workflowName,
        workflowTemplate,
        getQueryFilters(
          user[UserKeys.USER_ID],
          workflowInstancesStates,
          functionNames,
          userIds,
          dates,
        ),
        orderSide,
        price,
        quantity,
        publicOrders,
      );

      const ordersList: Array<Order> =
        await this.workflowInstanceService.listAllWorkflowInstances(
          tenantId,
          workflowName === WorkflowName.OFFER
            ? WorkflowType.OFFER
            : WorkflowType.ORDER,
          undefined, // otherWorkflowType
          user,
          tokenId,
          tokenIds,
          workflowInstancesStates,
          functionNames,
          userIds,
          dates,
          filters,
          sorts,
          queryOption,
        );

      return ordersList;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all orders',
        'listAllOrders',
        false,
        500,
      );
    }
  }

  /**
   * [List all orders linked to the third party (verifier | notary | nav manager | broker)]
   * Returns the list of all orders linked to the third party.
   */
  async listAllOrdersLinkedToThirdParty(
    tenantId: string,
    thirdPartyId: string,
    thirdPartyType: UserType,
  ): Promise<Array<Order>> {
    try {
      if (
        thirdPartyType !== UserType.VERIFIER &&
        thirdPartyType !== UserType.NOTARY &&
        thirdPartyType !== UserType.UNDERWRITER &&
        thirdPartyType !== UserType.BROKER
      ) {
        ErrorService.throwError(
          `invalid userType for a third party (${thirdPartyType})`,
        );
      }

      // Fetch thirdParty-entity links
      const allThirdPartyEntityLinks: Array<Link> = (
        await this.linkService.listAllUserLinks(
          tenantId,
          thirdPartyId,
          thirdPartyType,
          undefined, // entityType
          undefined, // entityId
          undefined, // assetClass
          undefined, // offset
          undefined, // limit
          true, // withMetadata
        )
      ).links;
      // For each entity linked to third party, fetch user-entity links
      const allUserEntityLinks: Array<Array<Link>> = await Promise.all(
        allThirdPartyEntityLinks.map((link: Link) => {
          return this.linkService.listAllEntityLinks(
            tenantId,
            link[LinkKeys.ENTITY_ID],
            link[LinkKeys.ENTITY_TYPE],
          );
        }),
      );
      // Merge all user-entity links
      const allUserEntityLinksAsArray: Array<Link> = allUserEntityLinks.reduce(
        (a: Array<Link>, b: Array<Link>) => {
          return [...a, ...b];
        },
        [],
      );

      // Filter investor-entity links
      let allInvestorEntityLinks: Array<Link> =
        allUserEntityLinksAsArray.filter((userEntityLink: Link) => {
          return checkLinkStateValidForUserType(
            userEntityLink[LinkKeys.STATE],
            UserType.INVESTOR,
            userEntityLink[LinkKeys.ENTITY_TYPE],
          );
        });

      // For BROKER, filtering out investors that were not onboarded by the broker.
      if (thirdPartyType === UserType.BROKER) {
        allInvestorEntityLinks = allInvestorEntityLinks.filter(
          (link) => link[LinkKeys.BROKER_ID] === thirdPartyId,
        );
      }

      // Create links map
      //  CAUTION: keep in mind that there can be multiple links for a given investor (he can potentially
      //  be linked to 2 different tokens controller by the same third party), which means some links
      //  are potentially overridden in the mapping process.
      const linksMap: {
        [userId: string]: Link;
      } = allInvestorEntityLinks.reduce(
        (map, investorEntityLink: Link) => ({
          ...map,
          [investorEntityLink[LinkKeys.USER_ID]]: investorEntityLink,
        }),
        {},
      );

      // Fetch investors
      const investorIds: Array<string> = Object.keys(linksMap);

      const orders = await Promise.all(
        investorIds.map(async (investorId) => {
          return [
            ...(await this.workflowService.retrieveWorkflowInstances(
              tenantId,
              WorkflowInstanceEnum.userId,
              undefined, // instanceId
              undefined, // idempotencyKey
              investorId,
              undefined, // tokenId
              undefined, // objectId
              undefined, // entityType
              WorkflowType.ORDER,
              undefined, // otherWorkflowType
              false,
            )),
            ...(await this.workflowService.retrieveWorkflowInstances(
              tenantId,
              WorkflowInstanceEnum.recipientId,
              undefined, // instanceId
              undefined, // idempotencyKey
              investorId,
              undefined, // tokenId
              undefined, // objectId
              undefined, // entityType
              WorkflowType.ORDER,
              undefined, // otherWorkflowType
              false,
            )),
          ];
        }),
      );

      // Filtered all user-entity links
      const allOrders = orders.reduce((a: Array<Link>, b: Array<Link>) => {
        return [...a, ...b];
      }, []);

      // This sorts workflow instances array: [newest workflow instance, ..., oldest workflow instance]
      return allOrders.sort((a: WorkflowInstance, b: WorkflowInstance) => {
        const timestampA: number = new Date(a[LinkKeys.CREATED_AT]).getTime();
        const timestampB: number = new Date(b[LinkKeys.CREATED_AT]).getTime();
        return timestampB - timestampA;
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all orders linked to third party',
        'listAllOrdersLinkedToThirdParty',
        false,
        500,
      );
    }
  }

  /**
   * [Switch action + transaction state as validated]
   *
   * Hook function called once a token transaction is validated.
   */
  async order_hook(
    tenantId: string,
    hookCallbackData: HookCallBack,
    identifierOrTxHash: string,
    txStatus: TxStatus,
  ): Promise<{
    order: Order;
    transactionId: string;
    message: string;
  }> {
    try {
      this.logger.info(
        {},
        `****** TX RECEIPT (order hook) (${txStatus}) ******\n`,
      );

      const response: {
        workflowInstance: WorkflowInstance;
        transactionId: string;
        message: string;
      } = await this.transactionHelperService.workflowInstance_hook(
        tenantId,
        hookCallbackData,
        identifierOrTxHash,
        txStatus,
      );

      return {
        order: response.workflowInstance,
        transactionId: response.transactionId,
        message: response.message,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calling order callback hook function',
        'order_hook',
        false,
        500,
      );
    }
  }
}
