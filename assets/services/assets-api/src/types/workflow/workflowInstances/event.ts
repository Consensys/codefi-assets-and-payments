import {
  keys as EventKeys,
  WorkflowType,
  WorkflowInstance,
  EventType,
} from '.';
import { keys as WalletKeys, WalletExample } from 'src/types/wallet';

export interface Event extends WorkflowInstance {}

export const EventExample: Event = {
  [EventKeys.ID]: 1398,
  [EventKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [EventKeys.IDEMPOTENCY_KEY]: 'ae5a189f-bcb4-4170-8122-de3a9fe62e94',
  [EventKeys.TYPE]: WorkflowType.EVENT,
  [EventKeys.NAME]: 'createEvent',
  [EventKeys.ROLE]: 'ISSUER',
  [EventKeys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [EventKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [EventKeys.ENTITY_TYPE]: undefined,
  [EventKeys.ASSET_CLASS]: 'classA',
  [EventKeys.OBJECT_ID]: '',
  [EventKeys.RECIPIENT_ID]: '',
  [EventKeys.WORKFLOW_TEMPLATE_ID]: 13,
  [EventKeys.QUANTITY]: 0,
  [EventKeys.PRICE]: 0,
  [EventKeys.PAYMENT_ID]: 'IgOauKYc',
  [EventKeys.DOCUMENT_ID]: '',
  [EventKeys.WALLET]: WalletExample[WalletKeys.WALLET_ADDRESS],
  [EventKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [EventKeys.STATE]: 'scheduled',
  [EventKeys.DATA]: {
    [EventKeys.DATA__EVENT_TYPE]: EventType.COUPON,
    [EventKeys.DATA__NEXT_STATUS]: 'settled',
    [EventKeys.DATA__EVENT_AMOUNT]: 10,
    [EventKeys.DATA__EVENT_SETTLEMENT_DATE]: new Date(
      'September 19, 1990 08:24:00',
    ),
  },
  [EventKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [EventKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
