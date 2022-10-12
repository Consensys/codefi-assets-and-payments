import { keys as NavKeys, WorkflowType, WorkflowInstance } from '.';

export enum NavStatus {
  NAV_SUBMITTED = 'navSubmitted',
  NAV_VALIDATED = 'navValidated',
  NAV_REJECTED = 'navRejected',
}

export interface NAV extends WorkflowInstance {}

export const NavExample: NAV = {
  [NavKeys.ID]: 1398,
  [NavKeys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [NavKeys.IDEMPOTENCY_KEY]: 'ae5a189f-bcb4-4170-8122-de3a9fe62e94',
  [NavKeys.TYPE]: WorkflowType.NAV,
  [NavKeys.NAME]: 'SUBMIT_NAV',
  [NavKeys.ROLE]: 'NAV_MANAGER',
  [NavKeys.USER_ID]: '',
  [NavKeys.ENTITY_ID]: 'e621d692-3b45-43a6-8ad9-9fc13f203802',
  [NavKeys.ENTITY_TYPE]: undefined,
  [NavKeys.ASSET_CLASS]: 'classA',
  [NavKeys.OBJECT_ID]: '',
  [NavKeys.RECIPIENT_ID]: '',
  [NavKeys.WORKFLOW_TEMPLATE_ID]: 9,
  [NavKeys.QUANTITY]: 10000,
  [NavKeys.PRICE]: 0,
  [NavKeys.PAYMENT_ID]: '',
  [NavKeys.DOCUMENT_ID]: '',
  [NavKeys.WALLET]: '',
  [NavKeys.DATE]: new Date('September 19, 1990 08:24:00'),
  [NavKeys.STATE]: 'validated',
  [NavKeys.DATA]: {},
  [NavKeys.CREATED_AT]: new Date('December 17, 1995 03:24:00'),
  [NavKeys.UPDATED_AT]: new Date('December 17, 1995 03:24:00'),
};
