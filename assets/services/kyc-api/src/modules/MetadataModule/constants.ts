// TODO: import this type from our types package
export interface User {
  id: string;
  tenantId: string;
  authId?: string | null;
  superUserId: string | null;
  userNature: string;
  userType: string;
  accessType?: string;
  firstName: string;
  lastName: string;
  docuSignId?: string;
  email: string;
  firstConnectionCode?: string;
  updatedAt?: Date;
  createdAt: Date;
  company?: string;
  bankAccount?: any;
  defaultWallet?: string;
  wallets?: any[];
  data: any;
  language?: string;
  phone?: string;
  picture?: string;
  prefix?: string;
  link?: any;
  address?: string;
  vehicles?: any[];
  tokenRelatedData?: any;
  projectRelatedData?: any;
}

export const TENANT_FLAG = 'tenant';

export enum Region {
  EU = 'EU',
  APAC = 'APAC',
  US = 'US',
}

export enum TenantType {
  PLATFORM_MULTI_ISSUER = 'platform_multi_issuer',
  PLATFORM_SINGLE_ISSUER = 'platform_single_issuer',
  API = 'api',
}

export enum ConfigKeys {
  ID = 'id',
  TENANT_ID = 'tenantId',
  USER_ID = 'userId',
  NAME = 'name',
  LOGO = 'logo',
  MAIL_LOGO = 'mailLogo',
  MAIL_COLOR = 'mailColor',
  MAIN_COLOR = 'mainColor',
  MAIN_COLOR_LIGHT = 'mainColorLight',
  MAIN_COLOR_LIGHTER = 'mainColorLighter',
  MAIN_COLOR_DARK = 'mainColorDark',
  MAIN_COLOR_DARKER = 'mainColorDarker',
  LANGUAGE = 'language',
  REGION = 'region',
  DATA = 'data',
  PREFERENCES = 'preferences',
  RESTRICTED_USER_TYPES = 'restrictedUserTypes',
  RESTRICTED_ASSET_TYPES = 'restrictedAssetTypes',
  DATA__KYC_TEMPLATE_ID = 'kycTemplateId',
  DATA__BYPASS_KYC_CHECKS = 'bypassKycChecks',
  DATA__DEFAULT_ALIAS = 'defaultAlias',
  DATA__ALIASES = 'aliases',
  DATA__TENANT_REGION = 'region',
  DATA__TENANT_TYPE = 'tenantType',
  DATA__CREATED_AT = 'createdAt',
  DATA__FIRST_USER_ID = 'firstUserId',
  DATA__CODEFI_USERS_IDS = 'codefiUsersIds',
  DATA__TENANT_NAME = 'tenantName',
  DATA__ONFIDO_API_TOKEN = 'onfidoApiToken',
}

export interface Config {
  [ConfigKeys.ID]: string;
  [ConfigKeys.TENANT_ID]: string;
  [ConfigKeys.USER_ID]: string;
  [ConfigKeys.NAME]: string;
  [ConfigKeys.LOGO]: string;
  [ConfigKeys.MAIN_COLOR]: string;
  [ConfigKeys.MAIN_COLOR_LIGHT]: string;
  [ConfigKeys.MAIN_COLOR_LIGHTER]: string;
  [ConfigKeys.MAIN_COLOR_DARK]: string;
  [ConfigKeys.MAIN_COLOR_DARKER]: string;
  [ConfigKeys.LANGUAGE]: string;
  [ConfigKeys.REGION]: string;
  [ConfigKeys.DATA]: {
    [ConfigKeys.DATA__KYC_TEMPLATE_ID]: string;
    [ConfigKeys.DATA__BYPASS_KYC_CHECKS]: boolean;
    [ConfigKeys.DATA__DEFAULT_ALIAS]: string;
    [ConfigKeys.DATA__ALIASES]: string;
    [ConfigKeys.DATA__TENANT_REGION]: Region;
    [ConfigKeys.DATA__TENANT_TYPE]: TenantType;
    [ConfigKeys.DATA__CREATED_AT]: Date;
    [ConfigKeys.DATA__FIRST_USER_ID]: string;
    [ConfigKeys.DATA__CODEFI_USERS_IDS]: string;
    [ConfigKeys.DATA__TENANT_NAME]: string;
    [ConfigKeys.DATA__ONFIDO_API_TOKEN]: string;
  };
  [ConfigKeys.PREFERENCES]: object;
}
