import { AssetType } from 'src/types/asset/template';
import { Region, TenantType } from 'src/types/clientApplication';
import { Config } from 'src/types/config';
import { UserType } from 'src/types/user';

export const generateTenantConfig = (
  overrideConfig?: Partial<Config>,
): Config => {
  return {
    id: '8be63374-b28b-494f-bf50-7ee50513a496',
    tenantId: 'fakeTenantId',
    createdAt: new Date('2021-02-18T03:05:38.311Z'),
    updatedAt: new Date('2022-02-23T16:41:18.975Z'),
    userId: 'tenant',
    name: 'Codefi Assets - Test',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iM',
    mailLogo: 'https://fakemail.png',
    mailColor: '#415170',
    mainColor: '#1a5afe',
    mainColorLight: '#2c56dd',
    mainColorLighter: '#2c56dd',
    mainColorDark: '#2c56dd',
    mainColorDarker: '#2c56dd',
    language: 'en',
    region: 'en-UK',
    restrictedUserTypes: [UserType.INVESTOR, UserType.ISSUER],
    restrictedAssetTypes: [AssetType.FIXED_RATE_BOND],
    data: {
      LOGO_WITHOUT_LABEL: 'data:image/svg+xml;base64,PHN2ZyB2aWV4=',
      ZENDESK_KEY: 'fakeZendeskKey',
      SIDEBAR_BACKGROUND: '#1a2233',
      SIDEBAR_BACKGROUND_HOVER: '#000a28',
      SIDEBAR_TEXT: '#ffffff',
      SIDEBAR_TEXT_HOVER: '#3be3db',
      DISPLAY_COMPANY_NAME_SCREEN: true,
      ENABLE_NAV_UPDATE: true,
      ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION: true,
      BYPASS_PAYMENT: false,
      ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES: false,
      ENABLE_CLIENT_MANAGEMENT: true,
      enableMarketplace: false,
      ENABLE_ASSETS: true,
      ENABLE_PROJECTS: true,
      ENABLE_UNDERWRITERS: true,
      mail: {
        messageFooter: true,
        poweredBy: true,
        fromEmail: 'codefiassetsdev@example.test',
        fromName: 'Codefi Assets Test',
      },
      aliases: '["localhost:3000"]',
      tenantName: 'Codefi Assets - Test',
      region: Region.EU,
      tenantType: TenantType.PLATFORM_MULTI_ISSUER,
      kycTemplateId: 'fakeKycTemplateId',
      defaultChainId: '118174032', // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
      defaultNetworkKey: 'codefi_assets_dev_network_2',
    },
    preferences: {},
    ...(overrideConfig || {}),
  };
};
