import { Recurrence } from '../recurrence';
import { PrimaryTradeType } from '../workflow/workflowInstances';

export const DAY_IN_MILLISECONDS = 24 * 3600 * 1000;

export enum CycleStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_ENDED = 'SUBSCRIPTION_ENDED',
}

export enum CycleDate {
  START = 'START',
  CUTOFF = 'CUTOFF',
  VALUATION = 'VALUATION',
  SETTLEMENT = 'SETTLEMENT',
  UNPAIDFLAG = 'UNPAIDFLAG',
}

export enum OffsetType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export enum PaymentOption {
  AT_ORDER_CREATION = 'AT_ORDER_CREATION',
  BETWEEN_CUTOFF_AND_SETTLEMENT = 'BETWEEN_CUTOFF_AND_SETTLEMENT',
}

export enum keys {
  CYCLE_ID = 'id',
  TENANT_ID = 'tenantId',
  ASSET_INSTANCE_ID = 'assetInstanceId',
  ASSET_INSTANCE_CLASS_KEY = 'assetInstanceClassKey',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  VALUATION_DATE = 'valuationDate',
  SETTLEMENT_DATE = 'settlementDate',
  UNPAID_FLAG_DATE = 'unpaidFlagDate',
  NAV = 'nav',
  STATUS = 'status',
  DATA = 'data',
  TYPE = 'type',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TEMPLATE_FIRST_START_DATE = 'firstStartDate',
  TEMPLATE_FIRST_CUT_OFF_DATE = 'firstCutOffDate',
  TEMPLATE_FIRST_VALUATION_DATE = 'firstValuationDate',
  TEMPLATE_FIRST_SETTLEMENT_DATE = 'firstSettlementDate',
  TEMPLATE_FIRST_UNPAID_FLAG_DATE = 'firstUnpaidFlagDate',
  TEMPLATE_OFFSET_CUTOFF = 'offsetCutOff',
  TEMPLATE_OFFSET_VALUATION = 'offsetValuation',
  TEMPLATE_OFFSET_SETTLEMENT = 'offsetSettlement',
  TEMPLATE_OFFSET_UNPAID_FLAG = 'offsetUnpaidFlag',
  TEMPLATE_RECURRENCE = 'cycleRecurrence',
  TEMPLATE_PAYMENT_OPTION = 'paymentOption',
  OFFSET_DAYS = 'days',
  OFFSET_TYPE = 'type',
  OFFSET_ORIGIN = 'origin',
  OFFSET_HOUR = 'hour',
}

export interface AssetCycleOffset {
  [keys.OFFSET_DAYS]: number;
  [keys.OFFSET_TYPE]: OffsetType;
  [keys.OFFSET_ORIGIN]: CycleDate;
  [keys.OFFSET_HOUR]: number;
}

export const AssetCycleOffsetExample: AssetCycleOffset = {
  [keys.OFFSET_DAYS]: 2,
  [keys.OFFSET_TYPE]: OffsetType.AFTER,
  [keys.OFFSET_ORIGIN]: CycleDate.START,
  [keys.OFFSET_HOUR]: 14,
};

export interface AssetCycleTemplate {
  [keys.TEMPLATE_FIRST_START_DATE]: Date;
  [keys.TEMPLATE_FIRST_CUT_OFF_DATE]?: Date;
  [keys.TEMPLATE_FIRST_VALUATION_DATE]?: Date;
  [keys.TEMPLATE_FIRST_SETTLEMENT_DATE]?: Date;
  [keys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]?: Date;
  [keys.TEMPLATE_OFFSET_CUTOFF]?: AssetCycleOffset;
  [keys.TEMPLATE_OFFSET_VALUATION]?: AssetCycleOffset;
  [keys.TEMPLATE_OFFSET_SETTLEMENT]?: AssetCycleOffset;
  [keys.TEMPLATE_OFFSET_UNPAID_FLAG]?: AssetCycleOffset;
  [keys.TEMPLATE_RECURRENCE]: Recurrence;
  [keys.TEMPLATE_PAYMENT_OPTION]: PaymentOption;
}
export const AssetCycleTemplateExample: AssetCycleTemplate = {
  [keys.TEMPLATE_FIRST_START_DATE]: new Date('December 19, 1990 10:24:00'),
  [keys.TEMPLATE_FIRST_CUT_OFF_DATE]: new Date('December 21, 1990 10:24:00'),
  [keys.TEMPLATE_FIRST_VALUATION_DATE]: new Date('December 22, 1990 10:24:00'),
  [keys.TEMPLATE_FIRST_SETTLEMENT_DATE]: new Date('December 23, 1990 10:24:00'),
  [keys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]: new Date(
    'December 24, 1990 10:24:00',
  ),
  [keys.TEMPLATE_OFFSET_CUTOFF]: AssetCycleOffsetExample,
  [keys.TEMPLATE_OFFSET_VALUATION]: AssetCycleOffsetExample,
  [keys.TEMPLATE_OFFSET_SETTLEMENT]: AssetCycleOffsetExample,
  [keys.TEMPLATE_OFFSET_UNPAID_FLAG]: AssetCycleOffsetExample,
  [keys.TEMPLATE_RECURRENCE]: Recurrence.WEEKLY,
  [keys.TEMPLATE_PAYMENT_OPTION]: PaymentOption.AT_ORDER_CREATION,
};

export interface AssetCycleInstance {
  [keys.CYCLE_ID]: string;
  [keys.TENANT_ID]: string;
  [keys.ASSET_INSTANCE_ID]: string;
  [keys.ASSET_INSTANCE_CLASS_KEY]: string;
  [keys.START_DATE]: Date;
  [keys.END_DATE]: Date;
  [keys.VALUATION_DATE]: Date;
  [keys.SETTLEMENT_DATE]: Date;
  [keys.UNPAID_FLAG_DATE]: Date;
  [keys.NAV]: number;
  [keys.STATUS]: CycleStatus;
  [keys.TYPE]: PrimaryTradeType;
  [keys.DATA]: any;
  [keys.CREATED_AT]: Date;
  [keys.UPDATED_AT]: Date;
}

export const AssetCycleInstanceExample: AssetCycleInstance = {
  [keys.CYCLE_ID]: '4861ab62-94a9-4782-890f-221a64518b21',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.ASSET_INSTANCE_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [keys.ASSET_INSTANCE_CLASS_KEY]: 'classA',
  [keys.START_DATE]: new Date('April 7, 2020 03:24:00'),
  [keys.END_DATE]: new Date('April 21, 2020 03:24:00'),
  [keys.VALUATION_DATE]: new Date('April 19, 2020 03:24:00'),
  [keys.SETTLEMENT_DATE]: new Date('April 21, 2020 03:24:00'),
  [keys.UNPAID_FLAG_DATE]: new Date('May 21, 2020 03:24:00'),
  [keys.NAV]: 12557,
  [keys.STATUS]: CycleStatus.SUBSCRIPTION_STARTED,
  [keys.TYPE]: PrimaryTradeType.SUBSCRIPTION,
  [keys.DATA]: {},
  [keys.CREATED_AT]: new Date('April 7, 2020 08:43:00'),
  [keys.UPDATED_AT]: new Date('April 21, 2020 03:24:00'),
};
