import { keys as ActionKeys, WorkflowType, WorkflowInstance } from '.';
import { keys as WalletKeys, WalletExample } from 'src/types/wallet';

export interface Action extends WorkflowInstance {}

export const ActionExample: Action = {
  [ActionKeys.ID]: 1398,
  [ActionKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [ActionKeys.IDEMPOTENCY_KEY]: 'ae5a189f-bcb4-4170-8122-de3a9fe62e94',
  [ActionKeys.TYPE]: WorkflowType.ACTION,
  [ActionKeys.NAME]: 'mint',
  [ActionKeys.ROLE]: 'ISSUER',
  [ActionKeys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [ActionKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [ActionKeys.ENTITY_TYPE]: undefined,
  [ActionKeys.ASSET_CLASS]: 'classA',
  [ActionKeys.OBJECT_ID]: '',
  [ActionKeys.RECIPIENT_ID]: '',
  [ActionKeys.WORKFLOW_TEMPLATE_ID]: 8,
  [ActionKeys.QUANTITY]: 10000,
  [ActionKeys.PRICE]: 10,
  [ActionKeys.PAYMENT_ID]: 'IgOauKYc',
  [ActionKeys.DOCUMENT_ID]: '',
  [ActionKeys.WALLET]: WalletExample[WalletKeys.WALLET_ADDRESS],
  [ActionKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [ActionKeys.STATE]: 'executed',
  [ActionKeys.DATA]: {
    [ActionKeys.DATA__WALLET_USED]: WalletExample,
    [ActionKeys.DATA__NEXT_STATUS]: 'executed',
    [ActionKeys.DATA__TRANSACTION]: {
      executed: {
        [ActionKeys.DATA__TRANSACTION__STATUS]: 'validated',
        [ActionKeys.DATA__TRANSACTION__ID]:
          '170b5c21-9bf7-42f6-90f7-33ead9883d34',
      },
    },
    [ActionKeys.DATA__IS_LEDGER_TX]: false,
  },
  [ActionKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [ActionKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
