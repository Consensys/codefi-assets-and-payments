import {
  keys as OrderKeys,
  WorkflowType,
  WorkflowInstance,
  OrderType,
} from '.';
import { keys as WalletKeys, WalletExample } from 'src/types/wallet';

export interface Order extends WorkflowInstance {}

export const OrderExample: Order = {
  [OrderKeys.ID]: 1398,
  [OrderKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [OrderKeys.IDEMPOTENCY_KEY]: 'ae5a189f-bcb4-4170-8122-de3a9fe62e94',
  [OrderKeys.TYPE]: WorkflowType.ORDER,
  [OrderKeys.NAME]: 'createPrimaryTradeOrder',
  [OrderKeys.ROLE]: 'INVESTOR',
  [OrderKeys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [OrderKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [OrderKeys.ENTITY_TYPE]: undefined,
  [OrderKeys.ASSET_CLASS]: 'classA',
  [OrderKeys.OBJECT_ID]: '',
  [OrderKeys.RECIPIENT_ID]: '',
  [OrderKeys.WORKFLOW_TEMPLATE_ID]: 11,
  [OrderKeys.QUANTITY]: 10000,
  [OrderKeys.PRICE]: 0,
  [OrderKeys.PAYMENT_ID]: 'IgOauKYc',
  [OrderKeys.DOCUMENT_ID]: '',
  [OrderKeys.WALLET]: WalletExample[WalletKeys.WALLET_ADDRESS],
  [OrderKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [OrderKeys.STATE]: 'subscribed',
  [OrderKeys.DATA]: {
    [OrderKeys.DATA__ORDER_TYPE]: OrderType.QUANTITY,
    [OrderKeys.DATA__PAYMENT_ACCOUNT_ADDRESS]:
      '0xEa486455F2419aC41d42B2cE3454Eede7aBDaEBc',
    [OrderKeys.DATA__WALLET_USED]: WalletExample,
    [OrderKeys.DATA__NEXT_STATUS]: 'settled',
    [OrderKeys.DATA__TRANSACTION]: {
      settled: {
        [OrderKeys.DATA__TRANSACTION__STATUS]: 'validated',
        [OrderKeys.DATA__TRANSACTION__ID]:
          '170b5c21-9bf7-42f6-90f7-33ead9883d34',
      },
    },
    [OrderKeys.DATA__IS_LEDGER_TX]: false,
    [OrderKeys.DATA__AUTOMATE_RETIREMENT]: false,
    [OrderKeys.DATA__AUTOMATE_PAYMENT]: false,
  },
  [OrderKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [OrderKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
