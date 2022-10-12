/**
 * Global routes
 */
import { UserType } from './User';

export const CLIENT_ROUTE_LOGIN = '/login';
export const CLIENT_ROUTE_STYLES_GUIDE = '/styles-guide';
export const CLIENT_ROUTE_PROFILE = '/profile';
export const CLIENT_ROUTE_ACCOUNT_SETTINGS = '/account-settings';

/**
 * Super Admin routes
 */
export const CLIENT_ROUTE_SUPERADMIN_HOME = '/tenants';
export const CLIENT_ROUTE_SUPERADMIN_TENANT_CREATION = '/tenant/create';
export const CLIENT_ROUTE_SUPERADMIN_TENANT_PROFILE = {
  path: '/tenant/:tenantId',
  pathBuilder: ({ tenantId }: { tenantId: string }): string =>
    `/tenant/${tenantId}`,
};

export const CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/use-case-management`;
export const CLIENT_ROUTE_SUPERADMIN_CREATE_USE_CASE = `${CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT}/create`;
export const CLIENT_ROUTE_SUPERADMIN_UPDATE_USE_CASE = {
  path: `${CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT}/:useCase`,
  pathBuilder: ({ useCase }: { useCase: string }): string =>
    `${CLIENT_ROUTE_SUPERADMIN_USE_CASE_MANAGEMENT}/${useCase}`,
};
/**
 * Issuer routes
 */
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/company-information`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_INTERFACE_CONFIGURATION = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/interface-configuration`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_ENTITY_MANAGEMENT = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/entity-management`;

export const CLIENT_ROUTE_ACCOUNT_SETTINGS_ONBOARDING_CONFIGURATION = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/onboarding-configuration`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/notifications`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS_CONTENT = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/notifications/content`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/blockchain-networks`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_API_CREDENTIALS = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/api-credentials`;

export const CLIENT_ROUTE_ACCOUNT_SETTINGS_ASSET_MANAGEMENT = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/asset-management`;

export const CLIENT_ROUTE_ACCOUNT_SETTINGS_BILLING = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/billing`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_API_KEYS = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/api-keys`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_ENVIRONMENTS = `${CLIENT_ROUTE_ACCOUNT_SETTINGS}/environments`;

export const CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT = `/client-management`;
export const CLIENT_ROUTE_ACCOUNT_SETTINGS_CREATE_CLIENT = `/create/client`;

export const CLIENT_ROUTE_ACTIVATE_ACCOUNT = '/activate';
export const CLIENT_ROUTE_WORKSPACE = '/workspace';

export const CLIENT_ROUTE_ASSETS = '/assets';
export const CLIENT_ROUTE_ASSET_OVERVIEW = {
  path: `${CLIENT_ROUTE_ASSETS}/:assetId`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSETS}/${assetId}`,
};
export const CLIENT_ROUTE_ASSET_OVERVIEW_INFOS = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/infos`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({ assetId })}/infos`,
};
export const CLIENT_ROUTE_ASSET_INVESTORS = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/investors`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({ assetId })}/investors`,
};
export const CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/lifecycle-events`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({ assetId })}/lifecycle-events`,
};

export const CLIENT_ROUTE_ASSET_CORPORATE_ACTION_DETAILS = {
  path: `${CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS.path}/:eventId`,
  pathBuilder: ({
    assetId,
    eventId,
  }: {
    assetId: string;
    eventId: number;
  }): string =>
    `${CLIENT_ROUTE_ASSET_CORPORATE_ACTIONS.pathBuilder({
      assetId,
    })}/${eventId}`,
};
export const CLIENT_ROUTE_ASSET_MANAGE_INVESTORS = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/investors/manage-investors`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
      assetId,
    })}/investors/manage-investors`,
};
export const CLIENT_ROUTE_ASSET_PRIMARY_MARKET = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/primary-market`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({ assetId })}/primary-market`,
};
export const CLIENT_ROUTE_ASSET_SECONDARY_MARKET = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/secondary-market`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({ assetId })}/secondary-market`,
};
export const CLIENT_ROUTE_ASSET_SHARECLASSES = {
  path: `${CLIENT_ROUTE_ASSET_OVERVIEW.path}/shareclasses`,
  pathBuilder: ({ assetId }: { assetId: string }): string =>
    `${CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
      assetId,
    })}/shareclasses`,
};
export const CLIENT_ROUTE_ASSET_SHARECLASS = {
  path: `${CLIENT_ROUTE_ASSET_SHARECLASSES}/:shareClassId`,
  pathBuilder: ({
    assetId,
    shareClassId,
  }: {
    assetId: string;
    shareClassId: string;
  }): string =>
    `${CLIENT_ROUTE_ASSET_SHARECLASSES.pathBuilder({
      assetId,
    })}/${shareClassId}`,
};
export const CLIENT_ROUTE_ASSET_SHARECLASS_INFOS = {
  path: `${CLIENT_ROUTE_ASSET_SHARECLASS.path}/infos`,
  pathBuilder: ({
    assetId,
    shareClassId,
  }: {
    assetId: string;
    shareClassId: string;
  }): string =>
    `${CLIENT_ROUTE_ASSET_SHARECLASS.pathBuilder({
      assetId,
      shareClassId,
    })}/infos`,
};

export const CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE = '/asset/create';
export const CLIENT_ROUTE_ISSUER_ASSET_CREATION = {
  path: `${CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE}/:assetId`,
  pathBuilder: (assetId: string): string =>
    `${CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE}/${assetId}`,
};

export const CLIENT_ROUTE_INVESTOR_PROFILE = {
  path: '/user/:investorId',
  pathBuilder: ({ investorId }: { investorId: string }): string => {
    return `/user/${investorId}`;
  },
};

export const CLIENT_ROUTE_INVESTOR_ASSETS = {
  path: `${CLIENT_ROUTE_INVESTOR_PROFILE.path}/assets`,
  pathBuilder: ({ investorId }: { investorId: string }): string =>
    `${CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
      investorId,
    })}/assets`,
};

export const CLIENT_ROUTE_ASSET_INVESTOR_ASSETS_FEES = {
  path: `${CLIENT_ROUTE_INVESTOR_ASSETS.path}/fees`,
  pathBuilder: ({ investorId }: { investorId: string }): string =>
    `${CLIENT_ROUTE_INVESTOR_ASSETS.pathBuilder({ investorId })}/fees`,
};

export const CLIENT_ROUTE_INVESTOR_ADDRESS = {
  path: `${CLIENT_ROUTE_INVESTOR_PROFILE.path}/address`,
  pathBuilder: ({ investorId }: { investorId: string }): string =>
    `${CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
      investorId,
    })}/address`,
};

export const CLIENT_ROUTE_TRADES = `${CLIENT_ROUTE_ASSETS}/trades`;
export const CLIENT_ROUTE_TRADES_CREATE = `${CLIENT_ROUTE_TRADES}/create`;
export const CLIENT_ROUTE_TRADES_DETAILS = {
  path: `${CLIENT_ROUTE_TRADES}/:tradeId`,
  pathBuilder: ({ tradeId }: { tradeId: string }) =>
    `${CLIENT_ROUTE_TRADES}/${tradeId}`,
};
export const CLIENT_ROUTE_TRADES_ACCEPT = `${CLIENT_ROUTE_TRADES}/accept`;
export const CLIENT_ROUTE_TRADES_SETTLE = {
  path: `${CLIENT_ROUTE_TRADES}/:orderId/settle`,
  pathBuilder: ({ orderId }: { orderId: string }) =>
    `${CLIENT_ROUTE_TRADES}/${orderId}/settle`,
};

/**
 * Investor routes
 */
export const CLIENT_ROUTE_SPACE_SELECTION = '';

export const CLIENT_ROUTE_INVESTOR_DIRECT_SUBSCRIPTION_ORDER =
  '/subscription-order';

export const CLIENT_ROUTE_INVESTOR_SUBSCRIPTION_ORDER = {
  path: '/subscription-order/:assetId/:classKey',
  pathBuilder: ({ assetId, classKey }: { assetId: string; classKey: string }) =>
    `/subscription-order/${assetId}/${classKey}`,
};
export const CLIENT_ROUTE_INVESTOR_PORTFOLIO = '/portfolio';

/**
 * kyc review routes
 */

export const CLIENT_ROUTE_CLIENT_MANAGEMENT = '/client-management';

export const CLIENT_ROUTE_KYC_REVIEW = {
  path: '/kyc/issuer-related/:investorId/review/:step',
  pathBuilder: ({
    investorId,
    step,
  }: {
    investorId: string;
    step?: string;
  }): string => {
    return `/kyc/issuer-related/${investorId}/review/${step}`;
  },
};

/**
 * kyc submit routes
 */

export const CLIENT_ROUTE_KYC_REJECTED = '/kyc/rejected';

export const CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE = {
  path: '/kyc/issuer-related/:issuerId/submit',
  pathBuilder: ({ issuerId }: { issuerId: string }): string =>
    `/kyc/issuer-related/${issuerId}/submit`,
};
export const CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE = {
  path: `${CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.path}/:step`,
  pathBuilder: ({
    issuerId,
    step,
  }: {
    issuerId: string;
    step: string;
  }): string =>
    `${CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.pathBuilder({
      issuerId,
    })}/${step}`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCTS = `/investment-products`;

export const CLIENT_ROUTE_INVESTMENT_PRODUCT = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCTS}/:assetId`,
  pathBuilder: ({ assetId }: { assetId: string }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCTS}/${assetId}`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST = `/sell`;

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST_PAYMENT = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT.path}/:classKey/order/:orderId/payment`,
  pathBuilder: ({
    assetId,
    classKey,
    orderId,
  }: {
    assetId: string;
    classKey: string;
    orderId: string;
  }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
      assetId,
    })}/${classKey}/order/${orderId}/payment`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST = `/redeem`;
export const CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST_PAYMENT = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST}/:orderId/payment`,
  pathBuilder: ({ orderId }: { orderId: string }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST}/${orderId}/payment`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_DRAWDOWN = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT.path}/drawdown/:facilityKey`,
  pathBuilder: ({
    assetId,
    facilityKey,
  }: {
    assetId: string;
    facilityKey: string;
  }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
      assetId,
    })}/drawdown/${facilityKey}`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_NOVATION = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT.path}/novation/:facilityKey`,
  pathBuilder: ({
    assetId,
    facilityKey,
  }: {
    assetId: string;
    facilityKey: string;
  }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
      assetId,
    })}/novation/${facilityKey}`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_REPAYMENT = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT.path}/repayment/:facilityKey/:recipientId`,
  pathBuilder: ({
    assetId,
    facilityKey,
    recipientId,
  }: {
    assetId: string;
    facilityKey: string;
    recipientId: string;
  }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
      assetId,
    })}/repayment/${facilityKey}/${recipientId}`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT = {
  path: `/order/:orderId/payment/cbdc`,
  pathBuilder: ({ orderId }: { orderId: string }) =>
    `/order/${orderId}/payment/cbdc`,
};

export const CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT_CONFIRMATTION = {
  path: `${CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT.path}/:paymentId`,
  pathBuilder: ({
    orderId,
    paymentId,
  }: {
    orderId: string;
    paymentId: string;
  }) =>
    `${CLIENT_ROUTE_INVESTMENT_PRODUCT_CBDC_PAYMENT.pathBuilder({
      orderId,
    })}/${paymentId}`,
};

/**
 * Common routes
 */

export const CLIENT_ROUTE_ACTIVATE_URL_BY_ROLE = {
  path: (userType: UserType) => `/${userType.toLowerCase()}/auth`,
};

export const CLIENT_ROUTE_ORDER_MANAGEMENT = '/order';

export const CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID = {
  path: `${CLIENT_ROUTE_ORDER_MANAGEMENT}/:orderId`,
  pathBuilder: ({ orderId }: { orderId: string }): string =>
    `${CLIENT_ROUTE_ORDER_MANAGEMENT}/${orderId}`,
};
