export const LIMIT = 100;

export interface Field {
  name: string;
  comparator: FieldComparator;
  value: string | string[];
}

export enum FieldComparator {
  EQUALS = '=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  NULL = '!',
}

export enum FieldColumnTypes {
  ID = 'id',
  NAME = 'name',
  STATE = 'state',
  ROLE = 'role',
  USER_ID = 'userId',
  RECIPIENT_ID = 'recipientId',
  ENTITY_ID = 'entityId',
  DATA = 'data',
  WORKFLOW_TYPE = 'workflowType',
  WORKFLOW_TEMPLATE_ID = 'workflowTemplateId',
  DATE = 'date',
  ASSET_CLASS = 'assetClassKey',
  QUANTITY = 'quantity',
  PRICE = 'price',
  ENTITY_TYPE = 'entityType',
  WALLET = 'wallet',
  TENANT_ID = 'tenantId',
  OFFER_ID = 'offerId',
  ORDER_SIDE = 'orderSide',
  CREATED_AT = 'createdAt',
  PAYMENT_ID = 'paymentId',
}

export interface SortCriteria {
  [key: string]: 'DESC' | 'ASC';
}

export interface V2QueryOption {
  callerId: string;
  isInvestorQuery?: boolean;
}

export interface FindAllOptions {
  tenantId: string;
  filters?: Field[];
  skip?: number;
  limit?: number;
  order?: SortCriteria[];
  queryOption?: V2QueryOption;
}

export interface Paginate<T> {
  items: T[];
  total: number;
}
