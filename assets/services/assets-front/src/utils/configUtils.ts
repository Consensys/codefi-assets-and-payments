import { TenantKeys, TenantType } from 'constants/tenantKeys';
import store from 'features/app.store';
import {
  setClientMetadata,
  setConfig,
  setTenantType,
} from 'features/user/user.store';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { getTenantMetadataFromConfig } from 'routes/SuperAdmin/utils/utils';
import { ITenant } from 'types/Tenant';

export const getConfig = () => {
  const config = (store?.getState()?.user.config as IConfig) || {};

  return {
    ...config,
    logo: config.logo,
    name: config.name,
    region: config.region,
    language: config.language,
    preferences: config.preferences,
    restrictedAssetTypes: config.restrictedAssetTypes,
    restrictedUserTypes: config.restrictedUserTypes,
    LOGO_WITHOUT_LABEL: config.data?.LOGO_WITHOUT_LABEL,
    mainColor: config.mainColor,
    SIDEBAR_BACKGROUND: config.data?.SIDEBAR_BACKGROUND,
    ENABLE_ASSETS: config.data?.ENABLE_ASSETS,
    ENABLE_CLIENT_MANAGEMENT: config.data?.ENABLE_CLIENT_MANAGEMENT,
    SIDEBAR_BACKGROUND_HOVER: config.data?.SIDEBAR_BACKGROUND_HOVER,
    SIDEBAR_TEXT: config.data?.SIDEBAR_TEXT,
    SIDEBAR_TEXT_HOVER: config.data?.SIDEBAR_TEXT_HOVER,
    locale: config.data?.locale || 'en-US',
    ZENDESK_KEY:
      config.data?.ZENDESK_KEY || 'c7b9f097-b890-4cda-a54e-d20e4d8f31e1',
    DISPLAY_COMPANY_NAME_SCREEN: config.data?.DISPLAY_COMPANY_NAME_SCREEN,
    ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES:
      config.data?.ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES,
    ENABLE_NAV_UPDATE: config.data?.ENABLE_NAV_UPDATE,
    tenantType: config.data?.tenantType,
    usecase: config.data?.usecase,
    enableMarketplace: config.data?.enableMarketplace,
    ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION:
      config.data?.ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION,
    ENABLE_UNDERWRITERS: config.data?.ENABLE_UNDERWRITERS,
    FAVICON: config.data?.FAVICON,
    tenantId: config.tenantId,
  };
};

export const applyConfig = (config: IConfig) => {
  const { dispatch } = store;
  if (!config) {
    return;
  }
  document.title = config.name;
  if (config.data.FAVICON) {
    const faviconElement = document.getElementById(
      'favicon',
    ) as HTMLLinkElement;
    faviconElement.href = config.data.FAVICON;
  }
  dispatch(setConfig(config));
  const { tenantType } = getTenantMetadataFromConfig(config);
  if (tenantType) {
    dispatch(setTenantType(tenantType));
  } else {
    dispatch(setTenantType(TenantType.PLATFORM_MULTI_ISSUER));
  }
};

export const applyTenantClientData = (
  clientMetadata: ITenant[TenantKeys.CLIENT_METADATA],
) => {
  const { dispatch } = store;
  dispatch(setClientMetadata(clientMetadata));
};
