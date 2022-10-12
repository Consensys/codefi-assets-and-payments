import { EntityType } from 'src/types/entity';
import { keys as LinkKeys, WorkflowType, WorkflowInstance } from '.';
import { keys as WalletKeys, WalletExample } from '../../wallet';
import { FeesExample } from '../../fees';

export interface Link extends WorkflowInstance {}

export enum LinkState {
  NONE = 'none',
  ISSUER = 'issuer',
  NOTARY = 'notary',
  VERIFIER = 'verifier',
  NAV_MANAGER = 'navManager',
  INVITED = 'invited',
  KYCSUBMITTED = 'kycSubmitted',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  KYCINREVIEW = 'KycInReview',
}

export const RESPONSE_LINK_OBJECT = 'link';
export const RESPONSE_LINK_NEW = 'newLink';

export interface CreateLinkOutput {
  [RESPONSE_LINK_OBJECT]: Link;
  [RESPONSE_LINK_NEW]: boolean;
}

export const LinkExample: Link = {
  [LinkKeys.ID]: 1398,
  [LinkKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [LinkKeys.IDEMPOTENCY_KEY]: undefined,
  [LinkKeys.TYPE]: WorkflowType.LINK,
  [LinkKeys.NAME]: 'submitKyc',
  [LinkKeys.ROLE]: 'INVESTOR',
  [LinkKeys.USER_ID]: '3611ab62-94a9-4782-890f-221a64518c83',
  [LinkKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [LinkKeys.ENTITY_TYPE]: EntityType.TOKEN,
  [LinkKeys.ASSET_CLASS]: 'classA',
  [LinkKeys.OBJECT_ID]: '',
  [LinkKeys.RECIPIENT_ID]: '',
  [LinkKeys.WORKFLOW_TEMPLATE_ID]: 8,
  [LinkKeys.QUANTITY]: 0,
  [LinkKeys.PRICE]: 0,
  [LinkKeys.PAYMENT_ID]: '',
  [LinkKeys.DOCUMENT_ID]: '',
  [LinkKeys.WALLET]: WalletExample[WalletKeys.WALLET_ADDRESS],
  [LinkKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [LinkKeys.STATE]: 'kycSubmitted',
  [LinkKeys.DATA]: {
    [LinkKeys.DATA__FEES]: FeesExample,
  },
  [LinkKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [LinkKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
