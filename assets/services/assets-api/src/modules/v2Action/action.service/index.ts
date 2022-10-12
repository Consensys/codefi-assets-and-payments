import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';
import {
  keys as WorkflowInstanceKeys,
  keys as ActionKeys,
  keys as NavKeys,
  OrderType,
  WorkflowInstance,
} from 'src/types/workflow/workflowInstances';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { keys as UserKeys, User } from 'src/types/user';

import { WorkflowInstanceService } from 'src/modules/v2WorkflowInstance/workflow.instance.service';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import {
  WorkflowTemplate,
  WorkflowName,
  keys as WorkflowTemplateKeys,
} from 'src/types/workflow/workflowTemplate';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { keys as TokenKeys, Token } from 'src/types/token';
import { AssetType } from 'src/types/asset/template';
import { retrieveTokenCategory, TokenCategory } from 'src/types/smartContract';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { EntityType } from 'src/types/entity';
import { AssetDataKeys } from 'src/types/asset';
import { checkIntegerFormat } from 'src/utils/number';
import { getQueryFilters } from 'src/utils/checks/v2Filters';
import { SortCriteria } from 'src/modules/v2ApiCall/api.call.service/query';

@Injectable()
export class ActionService {
  constructor(
    private readonly workflowInstanceService: WorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly entityService: EntityService,
  ) {}

  /**
   * Retrieve list of token actions
   */
  async listAllActions(
    tenantId: string,
    user: User,
    tokenId: string,
    tokenIds: Array<string>, // Optional filter (not taken into account in case tokenId is defined)
    workflowInstancesStates: Array<string>, // Optional filter
    functionNames: Array<string>, // Optional filter
    userIds: Array<string>, // Optional filter
    dates: Array<Date>, // Optional filter
    sorts?: Array<SortCriteria>, // Optional sorting
  ): Promise<Array<Action>> {
    try {
      const filters = getQueryFilters(
        user[UserKeys.USER_ID],
        workflowInstancesStates,
        functionNames,
        userIds,
        dates,
      );

      const allTokenActions: Array<Action> =
        await this.workflowInstanceService.listAllWorkflowInstances(
          tenantId,
          WorkflowType.ACTION,
          WorkflowType.ORDER, // otherWorkflowType
          user,
          tokenId,
          tokenIds,
          workflowInstancesStates,
          functionNames,
          userIds,
          dates,
          filters,
          sorts,
        );
      const actionsListDuplicated: Array<Action> =
        await this.duplicateActionsWithRecipient(tenantId, allTokenActions);

      return actionsListDuplicated;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'listing all actions',
        'listAllActions',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve action
   */
  async retrieveAction(
    tenantId: string,
    user: User,
    actionIndex: number,
  ): Promise<Action> {
    try {
      const workflowInstance: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          actionIndex,
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          WorkflowType.ORDER, // otherWorkflowType
          true,
        );

      if (
        user[UserKeys.USER_ID] !== workflowInstance[ActionKeys.USER_ID] &&
        user[UserKeys.USER_ID] !== workflowInstance[ActionKeys.RECIPIENT_ID]
      ) {
        // In case the user is fetching action of someone else, we need to make sure,
        // he is allowed to fetch this action
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          user[UserKeys.USER_ID],
          'retrieve action',
          workflowInstance[ActionKeys.ENTITY_ID],
          workflowInstance[ActionKeys.ENTITY_TYPE],
        );
      } else if (
        workflowInstance[ActionKeys.TYPE] === WorkflowType.TOKEN &&
        workflowInstance[ActionKeys.ENTITY_TYPE] !== EntityType.TOKEN
      ) {
      }

      if (
        workflowInstance[ActionKeys.TYPE] !== WorkflowType.ACTION &&
        workflowInstance[ActionKeys.TYPE] !== WorkflowType.ORDER &&
        workflowInstance[ActionKeys.TYPE] !== WorkflowType.TOKEN
      ) {
        ErrorService.throwError(
          `workflow instance with ID ${
            workflowInstance[ActionKeys.ID]
          } but is not a token action (${
            workflowInstance[ActionKeys.TYPE]
          } instead)`,
        );
      }

      return workflowInstance;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving action',
        'retrieveAction',
        false,
        500,
      );
    }
  }

  /**
   * Duplicate actions (when recipient is defined)
   */
  async duplicateActionsWithRecipient(
    tenantId: string,
    actions: Array<Action>,
  ): Promise<Array<Action>> {
    try {
      const actionsWithDuplicates: Array<Action> = [];
      const tradeWorkflowTemplate: WorkflowTemplate =
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          WorkflowName.ASSET_SECONDARY_TRADE,
        );

      for (let index = 0; index < actions.length; index++) {
        const action = actions[index];
        actionsWithDuplicates.push(action);

        if (
          action[ActionKeys.RECIPIENT_ID] &&
          action[ActionKeys.WORKFLOW_TEMPLATE_ID] !==
            tradeWorkflowTemplate[WorkflowTemplateKeys.ID]
        ) {
          const actionDuplicate = {
            ...action,
            [ActionKeys.USER_ID]: action[ActionKeys.RECIPIENT_ID],
            [ActionKeys.RECIPIENT_ID]: action[ActionKeys.USER_ID],
            [ActionKeys.QUANTITY]: -action[ActionKeys.QUANTITY],
          };
          actionsWithDuplicates.push(actionDuplicate);
        }
      }
      return actionsWithDuplicates;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'duplicating actions with recipient',
        'duplicateActionsWithRecipient',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve order type]
   */
  retrieveOrderType(workflowInstance): OrderType {
    try {
      if (
        !(
          workflowInstance[WorkflowInstanceKeys.DATA] &&
          workflowInstance[WorkflowInstanceKeys.DATA][
            WorkflowInstanceKeys.DATA__ORDER_TYPE
          ]
        )
      ) {
        ErrorService.throwError(
          `shall never happen: missing order type in ${workflowInstance[
            WorkflowInstanceKeys.TYPE
          ].toLowerCase()} ${workflowInstance[WorkflowInstanceKeys.ID]}}`,
        );
      }
      const orderType: OrderType =
        workflowInstance[WorkflowInstanceKeys.DATA][
          WorkflowInstanceKeys.DATA__ORDER_TYPE
        ];

      return orderType;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving order type',
        'retrieveOrderType',
        false,
        500,
      );
    }
  }

  /**
   * [Craft workflow instance quantity and amount]
   */
  craftWorkflowInstanceQuantityAndAmount(
    workflowInstance: WorkflowInstance,
    token: Token,
    nav: NAV,
    forcePrice: number,
  ): [number, number] {
    try {
      let workflowInstanceType: OrderType = OrderType.QUANTITY;
      if (workflowInstance[WorkflowInstanceKeys.TYPE] === WorkflowType.ORDER) {
        workflowInstanceType = this.retrieveOrderType(workflowInstance);
      }

      if (
        workflowInstance[WorkflowInstanceKeys.ENTITY_ID] !==
        token[TokenKeys.TOKEN_ID]
      ) {
        ErrorService.throwError(
          `shall never happen: entityId(${
            workflowInstance[WorkflowInstanceKeys.ENTITY_ID]
          }) doesn't correspond to tokenId(${token[TokenKeys.TOKEN_ID]})`,
        );
      }

      return this.craftQuantityAndAmount(
        workflowInstanceType,
        workflowInstance[WorkflowInstanceKeys.QUANTITY],
        workflowInstance[WorkflowInstanceKeys.PRICE],
        token,
        nav,
        forcePrice,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting workflow instance quantity and amount',
        'craftWorkflowInstanceQuantityAndAmount',
        false,
        500,
      );
    }
  }

  /**
   * [Craft quantity and amount]
   */
  craftQuantityAndAmount(
    orderType: OrderType = OrderType.QUANTITY,
    quantity: number,
    amount: number,
    token: Token,
    nav: NAV,
    forcePrice: number,
  ): [number, number] {
    try {
      let newQuantity: number;
      let newAmount: number;

      const assetType: AssetType =
        token?.[TokenKeys.ASSET_DATA]?.[AssetDataKeys.TYPE];

      const isAsset: boolean = assetType !== undefined;

      const is1UnitPrice: boolean = assetType === AssetType.SYNDICATED_LOAN;

      const isNonFungible: boolean =
        retrieveTokenCategory(token[TokenKeys.STANDARD]) ===
        TokenCategory.NONFUNGIBLE;

      if (orderType === OrderType.QUANTITY) {
        if (isNonFungible) {
          newQuantity = 1;
        } else if (!Number(quantity)) {
          ErrorService.throwError('shall never happen: undefined quantity');
        } else {
          newQuantity = Number(quantity);
        }

        if (forcePrice !== undefined) {
          newAmount = Number(forcePrice);
        } else if (nav) {
          const unitPrice: number = nav[NavKeys.QUANTITY];
          newAmount = Number(quantity) * unitPrice;
        } else if (!isAsset || is1UnitPrice) {
          const unitPrice = 1;
          newAmount = Number(quantity) * unitPrice;
        } else {
          ErrorService.throwError(
            `Impossible to determine the price, because the NAV (net asset value) is not defined. Please define the NAV for token ${
              token[TokenKeys.TOKEN_ID]
            } (or bypass this error by indicating 'forcePrice' parameter)`,
          );
        }
      } else if (orderType === OrderType.AMOUNT) {
        if (!nav) {
          ErrorService.throwError(
            `Impossible to determine the price, because the NAV (net asset value) is not defined. Please define the NAV for token ${
              token[TokenKeys.TOKEN_ID]
            }}`,
          );
        }

        if (!Number(amount)) {
          ErrorService.throwError('shall never happen: undefined amount');
        }

        const unitPrice: number = nav[NavKeys.QUANTITY];
        newQuantity = Number(amount) / unitPrice;
        newAmount = Number(amount);
      } else {
        ErrorService.throwError(`invalid type ${orderType}`);
      }

      checkIntegerFormat(newQuantity, newAmount);

      return [newQuantity, newAmount];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting quantity and amount',
        'craftQuantityAndAmount',
        false,
        500,
      );
    }
  }
}
