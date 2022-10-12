/**
 * ORDER HELPER FUNCTIONS
 */
import { WorkflowInstanceEnum } from 'src/old/constants/enum';

import ErrorService from 'src/utils/errorService';

import { Injectable } from '@nestjs/common';

import {
  keys as OrderKeys,
  WorkflowType,
  OrderType,
} from 'src/types/workflow/workflowInstances';
import { ClassDataKeys, SubscriptionRules } from 'src/types/asset';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';

import { MAX_SUPPORTED_INTEGER } from 'src/utils/number';
import { Order } from 'src/types/workflow/workflowInstances/order';

@Injectable()
export class OrderHelperService {
  constructor(
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
  ) {}

  /**
   * [Check if order is valid]
   */
  async checkOrderIsValid(
    tenantId: string,
    assetClassKey: string,
    rules: SubscriptionRules,
    cycleId: string,
    orderType: OrderType,
    orderQuantity?: number,
    orderAmount?: number,
  ): Promise<boolean> {
    try {
      const [globalSubscriptionQuantity, globalSubscriptionAmount]: [
        number,
        number,
      ] = await this.retrieveGlobalSubscriptionQuantityAndAmount(
        tenantId,
        cycleId,
      );
      if (orderType === OrderType.QUANTITY) {
        this.checkOrderQuantityIsValid(
          orderQuantity,
          rules,
          globalSubscriptionQuantity,
        );
      } else if (orderType === OrderType.AMOUNT) {
        this.checkOrderAmountIsValid(
          orderAmount,
          rules,
          globalSubscriptionAmount,
        );
      } else {
        ErrorService.throwError(
          `invalid order type: shall be chosen amongst ${OrderType.QUANTITY} and ${OrderType.AMOUNT}`,
        );
      }

      if (
        rules?.[ClassDataKeys.RULES__SUBSCRIPTION_TYPE] &&
        rules[ClassDataKeys.RULES__SUBSCRIPTION_TYPE] !== orderType
      ) {
        ErrorService.throwError(
          `invalid order type: only orders of type ${
            rules[ClassDataKeys.RULES__SUBSCRIPTION_TYPE]
          } are accepted for asset class ${assetClassKey}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if order is valid',
        'checkOrderIsValid',
        false,
        500,
      );
    }
  }

  /**
   * [Check if order quantity is valid]
   */
  checkOrderQuantityIsValid(
    orderQuantity: number,
    rules: SubscriptionRules,
    globalSubscriptionQuantity: number,
  ): boolean {
    try {
      const minSubsQuantity: number = rules?.[
        ClassDataKeys.RULES__MIN_SUBSCRIPTION_QUANTITY
      ]
        ? rules[ClassDataKeys.RULES__MIN_SUBSCRIPTION_QUANTITY]
        : 0;
      const maxSubsQuantity: number = rules?.[
        ClassDataKeys.RULES__MAX_SUBSCRIPTION_QUANTITY
      ]
        ? rules[ClassDataKeys.RULES__MAX_SUBSCRIPTION_QUANTITY]
        : MAX_SUPPORTED_INTEGER;

      const maxGlobalSubsQuantity: number = rules?.[
        ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY
      ]
        ? rules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY]
        : MAX_SUPPORTED_INTEGER;
      if (orderQuantity === 0) {
        ErrorService.throwError('invalid order quantity: can not be nil');
      } else if (orderQuantity < minSubsQuantity) {
        ErrorService.throwError(
          `invalid order quantity: ${orderQuantity} lower than minimum subscription quantity (${minSubsQuantity})`,
        );
      } else if (orderQuantity > maxSubsQuantity) {
        ErrorService.throwError(
          `invalid order quantity: ${orderQuantity} larger than maximum subscription quantity (${maxSubsQuantity})`,
        );
      } else if (
        globalSubscriptionQuantity + orderQuantity >
        maxGlobalSubsQuantity
      ) {
        ErrorService.throwError(
          `invalid order quantity: overall maximum quantity (${maxGlobalSubsQuantity}) can not be exceeded. Order quantity shall be less than ${
            maxGlobalSubsQuantity - globalSubscriptionQuantity
          }`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if order quantity is valid',
        'checkOrderQuantityIsValid',
        false,
        500,
      );
    }
  }

  /**
   * [Check if order amount is valid]
   */
  checkOrderAmountIsValid(
    orderAmount: number,
    rules: SubscriptionRules,
    globalSubscriptionAmount: number,
  ): boolean {
    try {
      const minSubsAmount: number = rules?.[
        ClassDataKeys.RULES__MIN_SUBSCRIPTION_AMOUNT
      ]
        ? rules[ClassDataKeys.RULES__MIN_SUBSCRIPTION_AMOUNT]
        : 0;
      const maxSubsAmount: number = rules?.[
        ClassDataKeys.RULES__MAX_SUBSCRIPTION_AMOUNT
      ]
        ? rules[ClassDataKeys.RULES__MAX_SUBSCRIPTION_AMOUNT]
        : MAX_SUPPORTED_INTEGER;
      const maxGlobalSubsAmount: number = rules?.[
        ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT
      ]
        ? rules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY]
        : MAX_SUPPORTED_INTEGER;
      if (orderAmount === 0) {
        ErrorService.throwError('invalid order amount: can not be nil');
      } else if (orderAmount < minSubsAmount) {
        ErrorService.throwError(
          `invalid order amount: ${orderAmount} lower than minimum subscription quantity (${minSubsAmount})`,
        );
      } else if (orderAmount > maxSubsAmount) {
        ErrorService.throwError(
          `invalid order amount: ${orderAmount} larger than maximum subscription quantity (${maxSubsAmount})`,
        );
      } else if (globalSubscriptionAmount + orderAmount > maxGlobalSubsAmount) {
        ErrorService.throwError(
          `invalid order quantity: overall maximum amount (${maxGlobalSubsAmount}) can not be exceeded. Order amount shall be less than ${
            maxGlobalSubsAmount - globalSubscriptionAmount
          }`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if order amount is valid',
        'checkOrderAmountIsValid',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve global subscription quantity and amount]
   */
  async retrieveGlobalSubscriptionQuantityAndAmount(
    tenantId: string,
    cycleId: string,
  ): Promise<[number, number]> {
    try {
      const workflowInstances: Array<Order> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.objectId,
          undefined,
          undefined, // idempotencyKey
          undefined,
          undefined,
          cycleId, // objectId
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          false,
        );

      const globalSubscriptionQuantity: number = workflowInstances.reduce(
        (a: number, workflowInstance) =>
          a + workflowInstance[OrderKeys.QUANTITY],
        0,
      );

      const globalSubscriptionAmount: number = workflowInstances.reduce(
        (a: number, workflowInstance) => a + workflowInstance[OrderKeys.PRICE],
        0,
      );

      return [globalSubscriptionQuantity, globalSubscriptionAmount];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving global subscription quantity and amount',
        'retrieveGlobalSubscriptionQuantityAndAmount',
        false,
        500,
      );
    }
  }
}
