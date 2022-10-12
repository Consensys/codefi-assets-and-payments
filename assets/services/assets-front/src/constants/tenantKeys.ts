export enum TenantKeys {
  CLIENT_ID = 'clientId',
  CLIENT_SECRET = 'clientSecret',
  NAME = 'name',
  DESCRIPTION = 'description',
  APP_TYPE = 'appType',
  CLIENT_METADATA = 'clientMetadata',
  CLIENT_METADATA_TENANT_ID = 'tenantId',
  CLIENT_METADATA_USE_CLIENT_ID_AS_TENANT_ID = 'useClientIdAsTenantId',
  CLIENT_METADATA_BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL = 'bypassSecondaryTradeIssuerApproval',
  GRANT_TYPES = 'grantTypes',
  JWT_CONFIGURATION = 'jwtConfiguration',
  JWT_CONFIGURATION_LIFETIME = 'lifetime_in_seconds',
  JWT_CONFIGURATION_SECRET_ENCODED = 'secret_encoded',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ALIASES = 'aliases',
  REGION = 'region',
  TENANT_TYPE = 'tenantType',
}

export enum TenantNature {
  PLATFORM = 'Platform',
  API = 'API',
}

export enum TenantMarketplace {
  NO = 'No',
  YES = 'Yes',
}

export enum PlatformType {
  SINGLE_ISSUER = 'Single Issuer',
  MULTI_ISSUER = 'Multi Issuer',
}

export enum TenantType {
  PLATFORM_MULTI_ISSUER = 'platform_multi_issuer',
  PLATFORM_SINGLE_ISSUER = 'platform_single_issuer',
  API = 'api',
}

export const tenantTypeMapping = (): Map<TenantType, string> => {
  const m = new Map();
  m.set(TenantType.PLATFORM_MULTI_ISSUER, 'Platform - Multi Issuer');
  m.set(TenantType.PLATFORM_SINGLE_ISSUER, 'Platform - Single Issuer');
  m.set(TenantType.API, 'API');
  return m;
};

export enum Region {
  EU = 'EU',
  APAC = 'APAC',
  US = 'US',
  KSA = 'KSA',
}

export enum AppUrl {
  LOCAL_EU = 'http://localhost:3000',
}

export const getRegionFromAppUrl = (appUrl: AppUrl): Region => {
  switch (appUrl) {
    case AppUrl.LOCAL_EU:
      return Region.EU;
  }
};
