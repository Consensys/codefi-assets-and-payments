import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  UseFilters,
} from '@nestjs/common';

import {
  RetrieveOrderParamInput,
  RetrieveOrderOutput,
  ListAllOrdersOutput,
  ListAllOrdersQueryInput,
  MAX_ORDERS_COUNT,
} from './order.dto';

import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';

import ErrorService from 'src/utils/errorService';

import { WorkflowInstanceEnum } from 'src/old/constants/enum';

import { UserType } from 'src/types/user';
import {
  keys as OrderKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { ApiWorkflowWorkflowInstanceService } from '../v2ApiCall/api.call.service/workflow';
import { setToLowerCase } from 'src/utils/case';
import { OrderService } from './order.service';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';
import { WorkflowName } from 'src/types/workflow/workflowTemplate';
import { Field, SortCriteria } from '../v2ApiCall/api.call.service/query';
import { validateSorting } from 'src/utils/checks/v2Sorts';

@Controller('v2/essentials/digital/asset/order')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly entityService: EntityService,
  ) {}

  @Get()
  @HttpCode(200)
  @Protected(true, [])
  async listAllOrders(
    @UserContext() userContext: IUserContext,
    @Query() orderQuery: ListAllOrdersQueryInput,
  ): Promise<ListAllOrdersOutput> {
    try {
      const offset = Number(orderQuery.offset || 0);
      const limit: number = Math.min(
        Number(orderQuery.limit || MAX_ORDERS_COUNT),
        MAX_ORDERS_COUNT,
      );

      if (orderQuery.workflowName) {
        // TODO: Temporary fix
        // we will need remove this once the postman collection and assets front is updated to support this.
        if (
          ![
            WorkflowName.ASSET_PRIMARY_TRADE,
            WorkflowName.ASSET_SECONDARY_TRADE,
          ].includes(orderQuery.workflowName)
        ) {
          ErrorService.throwError(
            'Invalid input for workflowNames. Shall be one of [assetPrimaryTrade, assetSecondaryTrade]',
          );
        }
      }

      // Extract tokenIds filter from query param
      let tokenIds: Array<string>;
      if (orderQuery.tokenIds) {
        tokenIds = JSON.parse(orderQuery.tokenIds);
        if (!(tokenIds && Array.isArray(tokenIds))) {
          ErrorService.throwError(
            'Invalid input for tokenIds. Shall be a stringified array.',
          );
        }
      }

      // Extract states filter from query param
      let states: Array<string>;
      if (orderQuery.states) {
        states = JSON.parse(orderQuery.states);
        if (!(states && Array.isArray(states))) {
          ErrorService.throwError(
            'Invalid input for states. Shall be a stringified array.',
          );
        }
      }

      // Extract functionNames filter from query param
      let functionNames: Array<string>;
      if (orderQuery.functionNames) {
        functionNames = JSON.parse(orderQuery.functionNames);
        if (!(functionNames && Array.isArray(functionNames))) {
          ErrorService.throwError(
            'Invalid input for functionNames. Shall be a stringified array.',
          );
        }
      }

      // Extract userIds filter from query param
      let userIds: Array<string>;
      if (orderQuery.userIds) {
        userIds = JSON.parse(orderQuery.userIds);
        if (!(userIds && Array.isArray(userIds))) {
          ErrorService.throwError(
            'Invalid input for userIds. Shall be a stringified array.',
          );
        }
      }

      // Extract dates filter from query param
      let stringDates: Array<string>;
      if (orderQuery.dates) {
        stringDates = JSON.parse(orderQuery.dates);
        if (!(stringDates && Array.isArray(stringDates))) {
          ErrorService.throwError(
            'Invalid input for dates. Shall be a stringified array.',
          );
        }
      }
      const dates: Array<Date> = stringDates
        ? stringDates.map((stringDate: string) => new Date(stringDate))
        : undefined;

      let sorts: Array<SortCriteria>;
      if (orderQuery.sorts) {
        sorts = JSON.parse(orderQuery.sorts);
        validateSorting(sorts);
      }

      let price: Field;
      if (orderQuery.price) {
        price = JSON.parse(orderQuery.price);
      }

      let quantity: Field;
      if (orderQuery.quantity) {
        quantity = JSON.parse(orderQuery.quantity);
      }

      const ordersList: Array<Order> = await this.orderService.listAllOrders(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        orderQuery.tokenId,
        orderQuery.workflowName,
        tokenIds,
        states,
        functionNames,
        orderQuery.marketplaceOrders ? undefined : userIds, // force undefined userIds if querying for public orders
        dates,
        sorts,
        orderQuery.orderSide,
        price,
        quantity,
        orderQuery.marketplaceOrders,
      );

      const filteredOrdersList: Array<Order> =
        orderQuery.tokenId && orderQuery.assetClass
          ? ordersList.filter((currentOrder: Order) => {
              return (
                currentOrder[OrderKeys.ASSET_CLASS] ===
                setToLowerCase(orderQuery.assetClass)
              );
            })
          : ordersList;

      const slicedOrdersList: Array<Order> = filteredOrdersList.slice(
        offset,
        Math.min(offset + limit, filteredOrdersList.length),
      );

      const slicedOrdersListWithMetadata: Array<Order> =
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          slicedOrdersList,
          false, // withAssetData
        );

      const response: ListAllOrdersOutput = {
        orders: slicedOrdersListWithMetadata,
        count: slicedOrdersListWithMetadata.length,
        total: filteredOrdersList.length,
        message: `${
          slicedOrdersListWithMetadata.length
        } order(s) listed successfully for user ${
          userContext[UserContextKeys.USER_ID]
        }${
          orderQuery.tokenId
            ? `, filtered for ${
                orderQuery.assetClass
                  ? `asset class ${setToLowerCase(orderQuery.assetClass)} of`
                  : ''
              } token ${orderQuery.tokenId}`
            : ''
        }`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing orders',
        'listAllOrders',
        true,
        500,
      );
    }
  }

  @Get(':orderIndex')
  @HttpCode(200)
  @Protected(true, [])
  async retrieveOrder(
    @UserContext() userContext: IUserContext,
    @Param() orderParam: RetrieveOrderParamInput,
  ): Promise<RetrieveOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const order: Order = await this.workflowService.retrieveWorkflowInstances(
        userContext[UserContextKeys.TENANT_ID],
        WorkflowInstanceEnum.id,
        orderParam.orderIndex,
        undefined, // idempotencyKey
        undefined,
        undefined,
        undefined,
        undefined, // entityType
        WorkflowType.ORDER,
        undefined, // otherWorkflowType
        true,
      );

      const isOrderWithUndefinedCounterparty =
        !order[OrderKeys.USER_ID] || !order[OrderKeys.RECIPIENT_ID];

      if (
        !isOrderWithUndefinedCounterparty &&
        userContext[UserContextKeys.USER_ID] !== order[OrderKeys.USER_ID] &&
        userContext[UserContextKeys.USER_ID] !== order[OrderKeys.RECIPIENT_ID]
      ) {
        // In case the user is fetching order of someone else, we need to make sure,
        // he is allowed to fetch this order
        await this.entityService.retrieveEntityIfAuthorized(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          'retrieve order',
          order[OrderKeys.ENTITY_ID],
          order[OrderKeys.ENTITY_TYPE],
        );
      }

      if (order[OrderKeys.TYPE] !== WorkflowType.ORDER) {
        ErrorService.throwError(
          `workflow instance with ID ${
            order[OrderKeys.ID]
          } was found, but is not an order (${order[OrderKeys.TYPE]} instead)`,
        );
      }

      const fetchedOrderWithMetadata: Order = (
        await this.apiMetadataCallService.addMetadataToWorkflowInstances(
          userContext[UserContextKeys.TENANT_ID],
          [order],
          false, // withAssetData
        )
      )[0];

      const response: RetrieveOrderOutput = {
        order: fetchedOrderWithMetadata,
        message: `Order with index ${orderParam.orderIndex} retrieved successfully`,
      };

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving order',
        'retrieveOrder',
        true,
        500,
      );
    }
  }
}
