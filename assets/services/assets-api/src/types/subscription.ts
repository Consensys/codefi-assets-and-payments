export enum keys {
  ID = 'id',
  NAME = 'name',
  TENANT_ID = 'tenantId',
  USER_ID = 'userId',
  TOKEN_ID = 'tokenId',
  ASSET_CLASS = 'assetClass',
  ENTITY_ID = 'entityId',
  ENTITY_TYPE = 'entityType',
  SOURCE_URL = 'sourceUrl',
  SOURCE_RECURRENCE = 'sourceRecurrence',
  SOURCE_PARSER_KEY = 'sourceParserKey',
  CALLBACK_URL = 'callbackUrl',
  CALLBACK_FORMATTER_KEY = 'callbackFormatterKey',
  CALLBACK_RECURRENCE = 'callbackRecurrence',
  DATA = 'data',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export interface Subscription {
  [keys.NAME]: string;
  [keys.TENANT_ID]: string;
  [keys.USER_ID]: string;
  [keys.TOKEN_ID]: string;
  [keys.ASSET_CLASS]: string;
  [keys.ENTITY_ID]: string;
  [keys.ENTITY_TYPE]: string;
  [keys.SOURCE_URL]: string;
  [keys.SOURCE_RECURRENCE]: number;
  [keys.SOURCE_PARSER_KEY]: string;
  [keys.CALLBACK_URL]: string;
  [keys.CALLBACK_FORMATTER_KEY]?: string;
  [keys.CALLBACK_RECURRENCE]: number;
  [keys.DATA]: object;
}
