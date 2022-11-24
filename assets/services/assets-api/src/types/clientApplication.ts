import { EntityStatus, TenantResponse } from '@consensys/ts-types';

export const DEFAULT_TENANT_ID = 'codefi';
export const DEFAULT_COMPANY_NAME = 'Codefi';

export const tenantNameExample = 'Acme Corp';

export const clientApplicationNamePrefix = 'Codefi Assets -';
export const clientApplicationDescriptionPrefix = 'Tenant for';

export enum ConfigType {
  CUSTOM = 'custom',
  DEFAULT = 'default',
}

export enum TenantType {
  PLATFORM_MULTI_ISSUER = 'platform_multi_issuer',
  PLATFORM_SINGLE_ISSUER = 'platform_single_issuer',
  API = 'api',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
}

export enum keys {
  CLIENT_ID = 'clientId',
  CLIENT_SECRET = 'clientSecret',
  NAME = 'name',
  DESCRIPTION = 'description',
  APP_TYPE = 'appType',
  IS_EMAIL_ONLY = 'isEmailOnly',
  METADATA = 'clientMetadata',
  // METADATA__USE_CLIENT_ID_AS_TENANT_ID = 'useClientIdAsTenantId',
  METADATA__DEFAULT_ALIAS = 'defaultAlias',
  METADATA__ALIASES = 'aliases',
  METADATA__ASSETS = 'assets',
  METADATA__TENANT_ID = 'tenantId',
  METADATA__SUB_TENANT_ID = 'subTenantId',
  METADATA__CUSTOM_DOMAIN_NAME = 'customDomainName',
  METADATA__ENTITY_ID = 'entityId',
  METADATA__TENANT_TYPE = 'tenantType',
  METADATA__CREATED_AT = 'createdAt',
  METADATA__REGION = 'region',
  METADATA__ADMIN_ID = 'adminId',
  METADATA__CODEFI_USERS_IDS = 'codefiUsersIds',
  CALLBACKS = 'callbacks',
  ALLOWED_LOGOUT_URLS = 'allowedLogoutUrls',
  WEB_ORIGINS = 'webOrigins',
  GRANT_TYPES = 'grantTypes',
  JWT_CONFIGURATION = 'jwtConfiguration',
  JWT_CONFIGURATION_LIFETIME = 'lifetime_in_seconds',
  JWT_CONFIGURATION_SECRET_ENCODED = 'secret_encoded',
}

export enum Region {
  EU = 'EU',
  APAC = 'APAC',
  US = 'US',
  KSA = 'KSA',
}
export interface ClientApplication {
  [keys.CLIENT_ID]: string;
  // FIXME LS it should return audience and domain too
  [keys.CLIENT_SECRET]: string;
  [keys.NAME]: string;
  [keys.DESCRIPTION]: string;
  [keys.APP_TYPE]: string;
  [keys.METADATA]: {
    [keys.METADATA__ALIASES]: string;
    [keys.METADATA__ASSETS]: string;
    [keys.METADATA__TENANT_ID]?: string;
    [keys.METADATA__SUB_TENANT_ID]?: string;
    [keys.METADATA__CUSTOM_DOMAIN_NAME]?: string;
    [keys.METADATA__DEFAULT_ALIAS]?: string;
    [keys.METADATA__TENANT_TYPE]?: string;
    [keys.METADATA__CREATED_AT]?: string;
  };
  [keys.GRANT_TYPES]: Array<string>;
  [keys.JWT_CONFIGURATION]: {
    [keys.JWT_CONFIGURATION_LIFETIME]: number;
    [keys.JWT_CONFIGURATION_SECRET_ENCODED]: boolean;
  };
}
export const buildFakeClientApplication = ({
  clientId = 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
  clientSecret = '_ZiI0b8Klvz-5IO0sx5HgeSSZedTcufivpqZehRps-pBtnF_wj9QxeQnSQiddjDt',
  name = tenantNameExample,
  description = `${clientApplicationDescriptionPrefix} ${tenantNameExample}`,
  appType = 'non_interactive',
  clientMetadata = {
    assets: 'true',
    aliases:
      "['customer.assets.codefi.network', 'customer.payments.codefi.network']",
    tenantId: 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
  },
  grantTypes = [
    'password',
    'authorization_code',
    'implicit',
    'refresh_token',
    'client_credentials',
  ],
  jwtConfiguration = {
    lifetime_in_seconds: 36000,
    secret_encoded: false,
  },
}: Partial<ClientApplication> = {}): ClientApplication => {
  return {
    clientId,
    clientSecret,
    name,
    description,
    appType,
    clientMetadata,
    grantTypes,
    jwtConfiguration,
  };
};

export const ClientApplicationExample: ClientApplication = {
  [keys.CLIENT_ID]: 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
  [keys.CLIENT_SECRET]:
    '_ZiI0b8Klvz-5IO0sx5HgeSSZedTcufivpqZehRps-pBtnF_wj9QxeQnSQiddjDt',
  [keys.NAME]: tenantNameExample,
  [keys.DESCRIPTION]: `${clientApplicationDescriptionPrefix} ${tenantNameExample}`,
  [keys.APP_TYPE]: 'non_interactive',
  [keys.METADATA]: {
    [keys.METADATA__ALIASES]:
      "['customer.assets-paris-dev.codefi.network', 'customer.payments.codefi.network']",
    [keys.METADATA__TENANT_ID]: 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
    [keys.METADATA__SUB_TENANT_ID]: 'dev',
    [keys.METADATA__ASSETS]: 'true',
  },
  [keys.GRANT_TYPES]: [
    'password',
    'authorization_code',
    'implicit',
    'refresh_token',
    'client_credentials',
  ],
  [keys.JWT_CONFIGURATION]: {
    [keys.JWT_CONFIGURATION_LIFETIME]: 36000,
    [keys.JWT_CONFIGURATION_SECRET_ENCODED]: false,
  },
};

export const maskClientApplication = (clientApplication: ClientApplication) => {
  return {
    [keys.CLIENT_ID]: clientApplication[keys.CLIENT_ID],
    [keys.NAME]: clientApplication[keys.NAME],
    [keys.DESCRIPTION]: clientApplication[keys.DESCRIPTION],
    [keys.APP_TYPE]: clientApplication[keys.APP_TYPE],
    [keys.METADATA]: clientApplication[keys.METADATA],
  };
};

export enum AppUrl {
  DEV_EU = 'https://assets-paris-dev.codefi.network',
  DEMO_EU = 'https://assets-paris-demo.codefi.network',
  PROD_EU = 'https://assets.codefi.network',
  PROD_APAC = 'https://assets-apac.codefi.network',
  PROD_US = 'https://assets-us.codefi.network',
  DEV_KSA = 'https://assets-ksa-dev.codefi.network',
  DEMO_KSA = 'https://assets-ksa-demo.codefi.network',
  PROD_KSA = 'https://assets-ksa.codefi.network',
}

export const getEnvNameFromAppUrl = (appUrl: AppUrl) => {
  switch (appUrl) {
    case AppUrl.DEV_KSA:
      return 'dev-ksa';
    case AppUrl.DEV_EU:
      return 'dev-eu';
    case AppUrl.DEMO_KSA:
      return 'demo-ksa';
    case AppUrl.DEMO_EU:
      return 'demo-eu';
    case AppUrl.PROD_EU:
      return 'prod-eu';
    case AppUrl.PROD_APAC:
      return 'prod-apac';
    case AppUrl.PROD_US:
      return 'prod-us';
    case AppUrl.PROD_KSA:
      return 'prod-ksa';
  }
};

/**
 * [Checks if tenant is an E2E test tenant (if so, we won't send the emails)]
 */
export const isE2eTestTenant = (tenantName: string): boolean => {
  if (tenantName.startsWith('test_tenant_')) {
    return true;
  }
  {
    return false;
  }
};

export const TenantExample: TenantResponse = {
  id: 'eRlC3A2cK7TuIBUJ5b6xjAFQ6VbEjXLf',
  name: tenantNameExample,
  products: {
    assets: true,
  },
  defaultNetworkKey: 'codefi_assets_dev_network_2',
  metadata: {
    [keys.METADATA__SUB_TENANT_ID]: 'dev',
  },
  initialAdmins: [
    {
      email: 'assets-admin@consensys.net',
      name: 'Assets Admin',
      status: EntityStatus.Confirmed,
    },
  ],
  createdBy: 'userName',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const craftClientApplicationName = (name: string): string => {
  return `${clientApplicationNamePrefix} ${name}`;
};

export const craftM2mClientApplicationName = (name: string): string => {
  return `${craftClientApplicationName(name)} - M2M`;
};

// reverts 'craftClientApplicationName' function
export const extractNameFromClientApplicationName = (
  clientApplicationName: string,
): string => {
  return clientApplicationName.replace(`${clientApplicationNamePrefix} `, '');
};

// reverts 'craftM2mClientApplicationName' function
export const extractNameFromM2mClientApplicationName = (
  m2mClientApplicationName: string,
): string => {
  return extractNameFromClientApplicationName(
    m2mClientApplicationName.replace(' - M2M', ''),
  );
};
