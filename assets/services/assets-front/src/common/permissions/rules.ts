import { UserType } from 'User';
import { getConfig } from 'utils/configUtils';
import { getMarketplace } from 'utils/configs';

export enum Permissions {
  ASSETS_LIST = 'assets:list',
  ASSETS_MANAGE = 'assets:manage',
  USERS_MANAGE = 'users:manage',
  ORDERS_MANAGE = 'orders:manage',
  ORDER_CREATE = 'order:create',
  USER_PORTFOLIO = 'user-portfolio:visit',
  ASSETS_INVEST = 'assets:invest',
  KYC_INVITE = 'kyc:invite',
  TENANTS_MANAGE = 'tenants:manage',
  SETTINGS_MANAGE = 'settings:manage',
}
const isInvestorCreator = localStorage.getItem('codefi-app') === 'creator';
const config = getConfig();
const enableMarketplace = getMarketplace(config);

const rules: {
  [key: string]: Array<string>;
} = {
  [UserType.ISSUER]: [
    Permissions.ASSETS_LIST,
    Permissions.KYC_INVITE,
    Permissions.ASSETS_MANAGE,
    Permissions.USERS_MANAGE,
    Permissions.ORDERS_MANAGE,
  ],
  [UserType.VERIFIER]: [Permissions.USERS_MANAGE],
  [UserType.INVESTOR]: isInvestorCreator
    ? [
        Permissions.ASSETS_LIST,
        Permissions.ASSETS_MANAGE,
        Permissions.ORDERS_MANAGE,
        Permissions.USER_PORTFOLIO,
        Permissions.ASSETS_INVEST,
        Permissions.ORDER_CREATE,
      ]
    : [
        Permissions.ORDERS_MANAGE,
        Permissions.USER_PORTFOLIO,
        Permissions.ASSETS_INVEST,
        Permissions.ORDER_CREATE,
      ],
  [UserType.UNDERWRITER]: (enableMarketplace
    ? [Permissions.ASSETS_LIST, Permissions.ASSETS_MANAGE]
    : []
  ).concat([
    Permissions.ORDERS_MANAGE,
    Permissions.USER_PORTFOLIO,
    Permissions.ASSETS_INVEST,
    Permissions.KYC_INVITE,
    Permissions.USERS_MANAGE,
    // Permissions.ASSETS_INVEST,
  ]),
  [UserType.SUPERADMIN]: [
    Permissions.ASSETS_LIST,
    Permissions.ASSETS_MANAGE,
    Permissions.USERS_MANAGE,
    Permissions.ORDERS_MANAGE,
    Permissions.ORDER_CREATE,
    Permissions.USER_PORTFOLIO,
    Permissions.ASSETS_INVEST,
    Permissions.KYC_INVITE,
    Permissions.TENANTS_MANAGE,
    Permissions.SETTINGS_MANAGE,
  ],
  [UserType.ADMIN]: [
    Permissions.KYC_INVITE,
    Permissions.USERS_MANAGE,
    Permissions.ORDERS_MANAGE,
    Permissions.SETTINGS_MANAGE,
  ],
};

export default rules;
