import { AssetType } from './asset/template';
import { Region, TenantType, Visibility } from './clientApplication';
import { UserType } from './user';

export const TENANT_FLAG = 'tenant';

export enum ConfigType {
  CUSTOM = 'custom',
  DEFAULT = 'default',
}

export enum RegionalFormats {
  GB = 'en-GB',
  US = 'en-US',
  FR = 'fr-FR',
  JA = 'ja-JA',
  DE = 'de-DE',
  SA = 'ar-SA',
}

export enum keys {
  ID = 'id',
  TENANT_ID = 'tenantId',
  USER_ID = 'userId',
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
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
  DATA__ENABLE_MARKETPLACE = 'enableMarketplace',
  DATA__ENABLE_AUTOMATE_PAYMENT = 'enableAutomatePayment',
  DATA__ENABLE_OFFER_CREATION = 'enableOfferCreation',
  DATA__ENABLE_DELEGATION_FOR_AUTOMATED_TRANSACTIONS = 'enableDelegationForAutomatedTransactions', // CAUTION: it is not recommended to set this variable to 'true' as it allows users/machines to act on behalf of other users
  DATA__ENABLE_DELEGATION_FOR_M2M_CLIENTS = 'enableDelegationForM2mClients', // CAUTION: it is not recommended to set this variable to 'true' as it allows users/machines to act on behalf of other users
  DATA__ENABLE_NOTIFY_ALL_VERIFIERS = 'enableNotifyAllVerifiers',
  DATA__ALIASES = 'aliases',
  DATA__TENANT_REGION = 'region',
  DATA__TENANT_TYPE = 'tenantType',
  DATA__CREATED_AT = 'createdAt',
  DATA__FIRST_USER_ID = 'firstUserId',
  DATA__CODEFI_USERS_IDS = 'codefiUsersIds',
  DATA__TENANT_NAME = 'tenantName',
  DATA__TOKEN_VISIBILITY = 'tokenVisibility',
  DATA__USECASE = 'usecase',
  DATA__DEFAULT_CHAIN_ID = 'defaultChainId', // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
  DATA__DEFAULT_NETWORK_KEY = 'defaultNetworkKey',
  DATA__LOGO_WITHOUT_LABEL = 'LOGO_WITHOUT_LABEL',
  DATA__ZENDESK_KEY = 'ZENDESK_KEY',
  DATA__SIDEBAR_BACKGROUND = 'SIDEBAR_BACKGROUND',
  DATA__SIDEBAR_BACKGROUND_HOVER = 'SIDEBAR_BACKGROUND_HOVER',
  DATA__SIDEBAR_TEXT = 'SIDEBAR_TEXT',
  DATA__SIDEBAR_TEXT_HOVER = 'SIDEBAR_TEXT_HOVER',
  DATA__DISPLAY_COMPANY_NAME_SCREEN = 'DISPLAY_COMPANY_NAME_SCREEN',
  DATA__ENABLE_NAV_UPDATE = 'ENABLE_NAV_UPDATE',
  DATA__ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION = 'ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION',
  DATA__BYPASS_PAYMENT = 'BYPASS_PAYMENT',
  DATA__ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES = 'ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES',
  DATA__ENABLE_CLIENT_MANAGEMENT = 'ENABLE_CLIENT_MANAGEMENT',
  DATA__ENABLE_ASSETS = 'ENABLE_ASSETS',
  DATA__ENABLE_PROJECTS = 'ENABLE_PROJECTS',
  DATA__ENABLE_UNDERWRITERS = 'ENABLE_UNDERWRITERS',
  DATA__MAIL = 'mail',
  DATA__MAIL_MESSAGE_FOOTER = 'messageFooter',
  DATA__MAIL_POWERED_BY = 'poweredBy',
  DATA__MAIL_FROM_EMAIL = 'fromEmail',
  DATA__MAIL_FROM_NAME = 'fromName',
  DATA__IS_TOKEN_DISCOVERY_ENABLED = 'isTokenDiscoveryEnabled',
}

export interface Config {
  [keys.ID]: string;
  [keys.TENANT_ID]: string;
  [keys.USER_ID]: string;
  [keys.NAME]: string;
  [keys.LOGO]: string;
  [keys.MAIN_COLOR]: string;
  [keys.MAIL_LOGO]: string;
  [keys.MAIL_COLOR]: string;
  [keys.MAIN_COLOR_LIGHT]: string;
  [keys.MAIN_COLOR_LIGHTER]: string;
  [keys.MAIN_COLOR_DARK]: string;
  [keys.MAIN_COLOR_DARKER]: string;
  [keys.LANGUAGE]: string;
  [keys.REGION]: string;
  [keys.RESTRICTED_USER_TYPES]: UserType[];
  [keys.RESTRICTED_ASSET_TYPES]: AssetType[];
  [keys.DATA]: {
    [keys.DATA__KYC_TEMPLATE_ID]: string;
    [keys.DATA__BYPASS_KYC_CHECKS]?: boolean;
    [keys.DATA__ENABLE_MARKETPLACE]: boolean;
    [keys.DATA__ENABLE_AUTOMATE_PAYMENT]?: boolean;
    [keys.DATA__ENABLE_OFFER_CREATION]?: boolean;
    [keys.DATA__ENABLE_DELEGATION_FOR_M2M_CLIENTS]?: boolean;
    [keys.DATA__ENABLE_DELEGATION_FOR_AUTOMATED_TRANSACTIONS]?: boolean;
    [keys.DATA__DEFAULT_ALIAS]?: string;
    [keys.DATA__ALIASES]: string;
    [keys.DATA__TENANT_REGION]: Region;
    [keys.DATA__TENANT_TYPE]: TenantType;
    [keys.DATA__FIRST_USER_ID]?: string;
    [keys.DATA__CODEFI_USERS_IDS]?: string;
    [keys.DATA__TENANT_NAME]: string;
    [keys.DATA__TOKEN_VISIBILITY]?: Visibility;
    [keys.DATA__USECASE]?: string;
    [keys.DATA__DEFAULT_CHAIN_ID]?: string;
    [keys.DATA__DEFAULT_NETWORK_KEY]?: string;
    [keys.DATA__LOGO_WITHOUT_LABEL]?: string;
    [keys.DATA__ZENDESK_KEY]?: string;
    [keys.DATA__SIDEBAR_BACKGROUND]?: string;
    [keys.DATA__SIDEBAR_BACKGROUND_HOVER]?: string;
    [keys.DATA__SIDEBAR_TEXT]?: string;
    [keys.DATA__SIDEBAR_TEXT_HOVER]?: string;
    [keys.DATA__DISPLAY_COMPANY_NAME_SCREEN]?: boolean;
    [keys.DATA__ENABLE_NAV_UPDATE]?: boolean;
    [keys.DATA__ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION]?: boolean;
    [keys.DATA__BYPASS_PAYMENT]?: boolean;
    [keys.DATA__ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES]?: boolean;
    [keys.DATA__ENABLE_CLIENT_MANAGEMENT]?: boolean;
    [keys.DATA__ENABLE_ASSETS]?: boolean;
    [keys.DATA__ENABLE_PROJECTS]?: boolean;
    [keys.DATA__ENABLE_UNDERWRITERS]?: boolean;
    [keys.DATA__IS_TOKEN_DISCOVERY_ENABLED]?: boolean;
    [keys.DATA__MAIL]?: {
      [keys.DATA__MAIL_MESSAGE_FOOTER]: boolean;
      [keys.DATA__MAIL_POWERED_BY]: boolean;
      [keys.DATA__MAIL_FROM_EMAIL]: string;
      [keys.DATA__MAIL_FROM_NAME]: string;
    };
  };
  [keys.PREFERENCES]: object;
  [keys.CREATED_AT]: Date;
  [keys.UPDATED_AT]: Date;
}

export const ConfigExample: Config = {
  [keys.ID]: '0b776e4c-1af7-40de-b70e-96023a74ae42',
  [keys.TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.USER_ID]: TENANT_FLAG,
  [keys.NAME]: 'Codefi',
  [keys.LOGO]:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAA8CAYAAADPLpCHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4RpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8',
  [keys.MAIL_LOGO]: 'logo',
  [keys.MAIL_COLOR]: '#2c56dd',
  [keys.MAIN_COLOR]: '#2c56dd',
  [keys.MAIN_COLOR_LIGHT]: '#2c56dd',
  [keys.MAIN_COLOR_LIGHTER]: '#2c56dd',
  [keys.MAIN_COLOR_DARK]: '#2c56dd',
  [keys.MAIN_COLOR_DARKER]: '#2c56dd',
  [keys.LANGUAGE]: 'en',
  [keys.REGION]: 'fr-FR',
  [keys.RESTRICTED_USER_TYPES]: [...Object.values(UserType)],
  [keys.RESTRICTED_ASSET_TYPES]: [...Object.values(AssetType)],
  [keys.DATA]: {
    [keys.DATA__KYC_TEMPLATE_ID]: '53e059ee-45f0-4335-8c5a-ac2df21b9df3',
    [keys.DATA__BYPASS_KYC_CHECKS]: true,
    [keys.DATA__DEFAULT_ALIAS]: 'my-alias.assets-paris-dev.codefi.network',
    [keys.DATA__ALIASES]: '[]',
    [keys.DATA__ENABLE_MARKETPLACE]: false,
    [keys.DATA__ENABLE_AUTOMATE_PAYMENT]: false,
    [keys.DATA__ENABLE_OFFER_CREATION]: false,
    [keys.DATA__TENANT_REGION]: Region.EU,
    [keys.DATA__TENANT_TYPE]: TenantType.API,
    [keys.DATA__TENANT_NAME]: 'Test Tenant',
    [keys.DATA__USECASE]: 'Bonds',
  },
  [keys.PREFERENCES]: {
    someKey: 'some value',
  },
  [keys.CREATED_AT]: new Date(),
  [keys.UPDATED_AT]: new Date(),
};
