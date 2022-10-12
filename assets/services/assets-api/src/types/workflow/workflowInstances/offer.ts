import {
  keys as OfferKeys,
  WorkflowType,
  WorkflowInstance,
  OfferStatus,
} from '.';

import { keys as WalletKeys, WalletExample } from 'src/types/wallet';
import { FunctionName } from 'src/types/smartContract';

export interface Offer extends WorkflowInstance {}

export const OfferExample: Offer = {
  [OfferKeys.ID]: 1398,
  [OfferKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [OfferKeys.IDEMPOTENCY_KEY]: 'ae5a189f-bcb4-4170-8122-de3a9fe62e94',
  [OfferKeys.TYPE]: WorkflowType.OFFER,
  [OfferKeys.NAME]: FunctionName.CREATE_OFFER,
  [OfferKeys.ROLE]: 'INVESTOR',
  [OfferKeys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [OfferKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [OfferKeys.ENTITY_TYPE]: undefined,
  [OfferKeys.ASSET_CLASS]: 'default',
  [OfferKeys.OBJECT_ID]: '',
  [OfferKeys.RECIPIENT_ID]: '',
  [OfferKeys.WORKFLOW_TEMPLATE_ID]: 11,
  [OfferKeys.QUANTITY]: 10000,
  [OfferKeys.PRICE]: 0,
  [OfferKeys.PAYMENT_ID]: 'IgOauKYc',
  [OfferKeys.DOCUMENT_ID]: '',
  [OfferKeys.WALLET]: WalletExample[WalletKeys.WALLET_ADDRESS],
  [OfferKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [OfferKeys.STATE]: 'subscribed',
  [OfferKeys.DATA]: {
    [OfferKeys.DATA__OFFER_STATUS]: OfferStatus.OPEN,
    [OfferKeys.DATA__OFFER_ENABLE_AT_PRICE_ORDER]: true,
    [OfferKeys.DATA__OFFER_ENABLE_BID_PRICE_ORDER]: true,
    [OfferKeys.DATA__OFFER_ENABLE_NEGOTIATION]: true,
    [OfferKeys.DATA__AUTOMATE_RETIREMENT]: false,
  },
  [OfferKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [OfferKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
