import * as Routes from 'routesList';
import { ISettingsMenuItem } from './types';
import { TenantType } from 'constants/tenantKeys';
import { UserType } from 'User';
import { IntlShape } from 'react-intl';
import { accountSettingsMenu } from 'texts/routes/issuer/accountSettings';
import { superAdminAccountSettings } from 'texts/routes/superAdmin/superAdminAccountSettings';

/* we can replace menuItems later to read from a remote data source if required */
const menuItems = (intl: IntlShape): ISettingsMenuItem[] => [
  // {
  //   title: intl.formatMessage(accountSettingsMenu.organisationInformationTitle),
  //   description: intl.formatMessage(
  //     accountSettingsMenu.organisationInformationDescription,
  //   ),
  //   linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION}`,
  //   permissions: {
  //     [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
  //     [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
  //     [TenantType.API]: [],
  //   },
  // },
  {
    title: intl.formatMessage(accountSettingsMenu.entityManagementTitle),
    description: intl.formatMessage(
      accountSettingsMenu.entityManagementDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_ENTITY_MANAGEMENT}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
      [TenantType.API]: [],
    },
  },
  {
    title: intl.formatMessage(accountSettingsMenu.assetManagementTitle),
    description: intl.formatMessage(
      accountSettingsMenu.assetManagementDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_ASSET_MANAGEMENT}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
      [TenantType.API]: [],
    },
  },
  {
    title: intl.formatMessage(accountSettingsMenu.interfaceConfigurationTitle),
    description: intl.formatMessage(
      accountSettingsMenu.interfaceConfigurationDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_INTERFACE_CONFIGURATION}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
      [TenantType.API]: [],
    },
  },
  // {
  //   title: intl.formatMessage(accountSettingsMenu.onboardingConfigurationTitle),
  //   description: intl.formatMessage(
  //     accountSettingsMenu.onboardingConfigurationDescription,
  //   ),
  //   linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_ONBOARDING_CONFIGURATION}`,
  //   permissions: {
  //     [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN, UserType.ISSUER],
  //     [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
  //     [TenantType.API]: [],
  //   },
  // },
  {
    title: intl.formatMessage(accountSettingsMenu.notificationsTitle),
    description: intl.formatMessage(
      accountSettingsMenu.notificationsDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
      [TenantType.API]: [],
    },
  },
  {
    title: intl.formatMessage(accountSettingsMenu.blockchainNetworkTitle),
    description: intl.formatMessage(
      accountSettingsMenu.blockchainNetworkDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN, UserType.SUPERADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
      [TenantType.API]: [],
    },
  },
  {
    title: intl.formatMessage(accountSettingsMenu.apiCredentialsTitle),
    description: intl.formatMessage(
      accountSettingsMenu.apiCredentialsDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_API_CREDENTIALS}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [],
      [TenantType.API]: [],
    },
  },
  {
    title: intl.formatMessage(superAdminAccountSettings.useCaseManagementTitle),
    description: intl.formatMessage(
      superAdminAccountSettings.useCaseManagementDescription,
    ),
    linkTo: `${Routes.CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT}`,
    permissions: {
      [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.SUPERADMIN],
      [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.SUPERADMIN],
      [TenantType.API]: [],
    },
  },
  // {
  //   title: intl.formatMessage(accountSettingsMenu.billingTitle),
  //   description: intl.formatMessage(accountSettingsMenu.billingDescription),
  //   linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_BILLING}`,
  //   permissions: {
  //     [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
  //     [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
  //     [TenantType.API]: [],
  //   },
  // },
  // {
  //   title: intl.formatMessage(accountSettingsMenu.apiKeysTitle),
  //   description: intl.formatMessage(accountSettingsMenu.apiKeysDescription),
  //   linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_API_KEYS}`,
  //   permissions: {
  //     [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
  //     [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
  //     [TenantType.API]: [],
  //   },
  // },
  // {
  //   title: intl.formatMessage(accountSettingsMenu.environmentsTitle),
  //   description: intl.formatMessage(
  //     accountSettingsMenu.environmentsDescription,
  //   ),
  //   linkTo: `${Routes.CLIENT_ROUTE_ACCOUNT_SETTINGS_ENVIRONMENTS}`,
  //   permissions: {
  //     [TenantType.PLATFORM_MULTI_ISSUER]: [UserType.ADMIN],
  //     [TenantType.PLATFORM_SINGLE_ISSUER]: [UserType.ISSUER, UserType.ADMIN],
  //     [TenantType.API]: [],
  //   },
  // },
];

export default menuItems;
