import { UserType } from '../User';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface IAPIRoute {
  method: RequestMethod;
  path: (
    param1?: string,
    param2?: string,
    param3?: string,
    param4?: string,
  ) => string;
}

const userTypeToKycScope = (userType: UserType): string => {
  switch (userType) {
    case UserType.ADMIN:
      return 'platform';
    default:
      return 'issuer';
  }
};

const userTypeToRole = (userType: UserType): string => {
  return [UserType.UNDERWRITER, UserType.VERIFIER].indexOf(userType) > -1
    ? `${userType.toLowerCase()}`
    : 'reviewer';
};

export const API_FETCH_CLIENT_KYC_DATA_BY_ROLE: IAPIRoute = {
  method: 'GET',
  path: (userType) => {
    let role;
    if (userType === UserType.ISSUER || userType === UserType.SUPERADMIN) {
      role = 'reviewer';
    } else if (
      userType === UserType.UNDERWRITER ||
      userType === UserType.VERIFIER
    ) {
      role = userType.toLowerCase();
    } else {
      role = 'submitter';
    }
    const kycScope = userTypeToKycScope(userType as UserType);
    return `/api/assets/v2/essentials/kyc/data/${kycScope}-related/${role}`;
  },
};

export const API_UNVALIDATE_CLIENT_KYC: IAPIRoute = {
  method: 'PUT',
  path: (role) => {
    const append =
      role === UserType.VERIFIER || role === UserType.UNDERWRITER
        ? role.toLowerCase()
        : 'reviewer';
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/unvalidate/${append}`;
  },
};

export const API_REJECT_CLIENT_KYC: IAPIRoute = {
  method: 'PUT',
  path: (role) => {
    const append = role ? `${role}` : 'reviewer';
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/reject/${append}`;
  },
};

export const API_ALLOWLIST_CLIENT_KYC: IAPIRoute = {
  method: 'POST',
  path: (role) => {
    const append = userTypeToRole(role as UserType);
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/allowlist/${append}`;
  },
};

export const API_REMOVE_CLIENT_KYC: IAPIRoute = {
  method: 'DELETE',
  path: (role) => {
    const append = userTypeToRole(role as UserType);
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/remove/${append}`;
  },
};

export const API_FETCH_USERS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/user',
};

export const API_FETCH_TENANTS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/utils/tenant',
};

export const API_FETCH_TENANT: IAPIRoute = {
  method: 'GET',
  path: (id) => `/api/assets/v2/utils/tenant/${id}`,
};

export const API_CREATE_TENANT: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/utils/tenant',
};

export const API_DELETE_TENANT: IAPIRoute = {
  method: 'DELETE',
  path: (id) => `/api/assets/v2/utils/tenant/${id}`,
};

export const API_FETCH_POSTMAN_CREDENTIALS: IAPIRoute = {
  method: 'GET',
  path: (id) => `/api/assets/v2/utils/tenant/${id}/postman-credentials`,
};

export const API_FETCH_LINKS: IAPIRoute = {
  method: 'GET',
  path: (userId) => `/api/assets/v2/essentials/link/${userId}`,
};

export const API_FETCH_USER_BY_ROLE: IAPIRoute = {
  method: 'GET',
  path: (id, role) => {
    const append =
      role === UserType.VERIFIER || role === UserType.UNDERWRITER
        ? role.toLowerCase()
        : '';
    return `/api/assets/v2/essentials/user/${id}/${append}`;
  },
};

export const API_UPDATE_USER: IAPIRoute = {
  method: 'PUT',
  path: (id) => `/api/assets/v2/essentials/user/${id}`,
};

export const API_REMOVE_USER: IAPIRoute = {
  method: 'DELETE',
  path: (id) => `/api/assets/v2/essentials/user/${id}`,
};

export const API_GET_USER_IDENTITY: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/utils/identity',
};

export const API_SEND_INVITATION_EMAIL: IAPIRoute = {
  method: 'POST',
  path: () => {
    return `/api/assets/v2/email/invite`;
  },
};

//This function does not receive role
export const API_GET_ISSUER_RELATED_KYC_STATUS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/workflows/kyc/issuer-related',
};

export const API_SAVE_KYC_ELEMENT_INSTANCE: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/essentials/kyc/data',
};

export const API_SAVE_KYC_REVIEW: IAPIRoute = {
  method: 'PUT',
  path: () => '/api/assets/v2/essentials/kyc/data',
};

//This function does not receive role
export const API_SUBMIT_ISSUER_RELATED_KYC: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/kyc/issuer-related/form/submit/submitter',
};

export const API_UPLOAD_DOCUMENT: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/document',
};

export const API_GET_DOCUMENT: IAPIRoute = {
  method: 'GET',
  path: (gdsDocId, role) => {
    const append = role ? `${role}` : '';
    return `/api/assets/v2/document/${gdsDocId}/${append}`;
  },
};

export const API_VALIDATE_CLIENT_KYC: IAPIRoute = {
  method: 'POST',
  path: (role) => {
    const append =
      role === UserType.VERIFIER || role === UserType.UNDERWRITER
        ? `${role.toLowerCase()}`
        : 'reviewer';
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/form/review/${append}`;
  },
};

export const API_CREATE_CLIENT: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/essentials/user',
};

export const API_INVITE_CLIENT_FOR_KYC: IAPIRoute = {
  method: 'POST',
  path: (role) => {
    const append = userTypeToRole(role as UserType);
    const kycScope = userTypeToKycScope(role as UserType);
    return `/api/assets/v2/workflows/kyc/${kycScope}-related/form/invite/${append}`;
  },
};

// Get list of issued assets (+associated data) for a specific user
export const API_ASSET_ALL_GET: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/token',
};

export const API_ASSET_INVESTORS_ALL_GET: IAPIRoute = {
  method: 'GET',
  path: (assetId) => `/api/assets/v2/essentials/token/${assetId}/investor`,
};

export const API_RETRIEVE_ASSET_BY_ID: IAPIRoute = {
  method: 'GET',
  path: (assetId) => `/api/assets/v2/essentials/token/hybrid/${assetId}`,
};

export const API_RETRIEVE_ASSET_AUMS_BY_ID: IAPIRoute = {
  method: 'GET',
  path: (assetId) => `/api/assets/v2/essentials/token/${assetId}/aum`,
};

export const API_RETRIEVE_ASSET_PRICE: IAPIRoute = {
  method: 'GET',
  path: (assetId) => `/api/assets/v2/essentials/token/${assetId}/total/price`,
};

export const API_UPDATE_ASSET_BY_ID: IAPIRoute = {
  method: 'PUT',
  path: (assetId) => `/api/assets/v2/essentials/token/hybrid/${assetId}`,
};

export const API_INITIALIZE_ASSET_DATA: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/instance/init',
};

export const API_SUBMIT_ASSET_DATA: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/instance/submit',
};

export const API_REJECT_ASSET_DATA: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/instance/reject',
};

export const API_UPDATE_ASSET_DATA: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/instance/update',
};

export const API_FETCH_ASSET_TEMPLATES: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/asset/template',
};

export const API_FETCH_ASSET_DATA: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/asset/data',
};

export const API_SAVE_ASSET_DATA: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/essentials/asset/data',
};

export const API_DEPLOY_ASSET: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/instance/deploy',
};

export const API_DELETE_ASSET: IAPIRoute = {
  method: 'DELETE',
  path: (id) => `/api/assets/v2/essentials/token/hybrid/${id}`,
};

export const API_ALLOWLIST_TOKEN_RELATED_KYC: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/kyc/token-related/allowlist/reviewer',
};

export const API_REMOVE_TOKEN_RELATED_KYC: IAPIRoute = {
  method: 'DELETE',
  path: (role) => {
    const append = role ? `${role}` : 'reviewer';
    return `/api/assets/v2/workflows/kyc/token-related/remove/${append}`;
  },
};

export const API_FORCE_TRANSFER: IAPIRoute = {
  method: 'POST',
  path: (tokenId) =>
    `/api/assets/v2/essentials/token/hybrid/${tokenId}/transaction/force/transfer`,
};

export const API_FETCH_HOLD_DATA: IAPIRoute = {
  method: 'GET',
  path: () => `/api/assets/v2/utils/hold/data`,
};

export const API_HOLD_TOKENS: IAPIRoute = {
  method: 'POST',
  path: (tokenId) =>
    `/api/assets/v2/essentials/token/hybrid/${tokenId}/transaction/hold`,
};

export const API_MINT: IAPIRoute = {
  method: 'POST',
  path: (tokenId) =>
    `/api/assets/v2/essentials/token/hybrid/${tokenId}/transaction/mint`,
};

export const API_FORCE_BURN: IAPIRoute = {
  method: 'POST',
  path: (tokenId) =>
    `/api/assets/v2/essentials/token/hybrid/${tokenId}/transaction/force/burn`,
};

export const API_FETCH_TRANSACTIONS: IAPIRoute = {
  method: 'GET',
  path: () => `/api/assets/v2/essentials/transaction/`,
};

export const API_FETCH_TRANSACTION: IAPIRoute = {
  method: 'GET',
  path: (transactionId) =>
    `/api/assets/v2/essentials/transaction/${transactionId}`,
};

export const API_LIST_ALL_ACTIONS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/action',
};

export const API_LIST_ALL_EVENTS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/digital/asset/event',
};

export const API_FETCH_AUM: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/digital/asset/aum',
};

export const API_CREATE_NAV: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/essentials/digital/asset/nav',
};

export const API_RETRIEVE_FEE: IAPIRoute = {
  method: 'GET',
  path: (tokenId) => `/api/assets/v2/essentials/digital/asset/${tokenId}/fees`,
};

export const API_CREATE_OR_UPDATE_FEE: IAPIRoute = {
  method: 'POST',
  path: (tokenId) => `/api/assets/v2/essentials/digital/asset/${tokenId}/fees`,
};

export const API_CREATE_OR_UPDATE_CONFIG: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/utils/config',
};
export const API_RETRIEVE_CONFIG: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/utils/config',
};

export const API_CREATE_WALLET: IAPIRoute = {
  method: 'POST',
  path: (issuerId) => `/api/assets/v2/essentials/user/${issuerId}/wallet`,
};

export const API_LIST_ALL_NETWORKS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/network',
};

export const API_LIST_ALL_NETWORKS_V2: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/network/all',
};

export const API_LIST_ORDERS: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/digital/asset/order',
};

export const API_RETRIEVE_ORDER: IAPIRoute = {
  method: 'GET',
  path: (orderId) => `/api/assets/v2/essentials/digital/asset/order/${orderId}`,
};

export const API_RETRIEVE_EVENT: IAPIRoute = {
  method: 'GET',
  path: (eventIndex) =>
    `/api/assets/v2/essentials/digital/asset/event/${eventIndex}`,
};
export const API_CREATE_EVENT: IAPIRoute = {
  method: 'POST',
  path: () => '/api/assets/v2/workflows/digital/asset/events/create/event',
};
export const API_SETTLE_EVENT: IAPIRoute = {
  method: 'POST',
  path: () => `/api/assets/v2/workflows/digital/asset/events/settle/event`,
};

export const API_CANCEL_EVENT: IAPIRoute = {
  method: 'POST',
  path: () => `/api/assets/v2/workflows/digital/asset/events/cancel/event`,
};
export const API_CREATE_PRIMARY_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/create/order',
};

export const API_EXECUTE_PRIMARY_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/validate/payment',
};

export const API_SETTLE_PRIMARY_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/settle/order',
};

export const API_BATCH_SETTLE_PRIMARY_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/settle/order/batch',
};

export const API_CANCEL_PRIMARY_TRADE_ORDER: IAPIRoute = {
  method: 'DELETE',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/cancel/order',
};

export const API_REJECT_PRIMARY_TRADE_ORDER: IAPIRoute = {
  method: 'DELETE',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/primary/trade/reject/order',
};

export const API_LIST_KYC_TEMPLATES: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/essentials/kyc/template',
};

export const API_CREATE_SECONDARY_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/create/order',
};

export const API_CREATE_SECONDARY_FORCE_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/force/create/accepted/order',
};

export const API_APPROVE_SECONDARY_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/approve/order',
};

export const API_ACCEPT_SECONDARY_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/accept/order',
};

export const API_CREATE_SECONDARY_TRADE_DELIVERY_TOKEN_HOLD: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/hold/order/delivery',
};

export const API_CREATE_SECONDARY_FORCE_PAID_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/force/create/paid/order',
};

export const API_SECONDARY_TRADE_PROVIDE_PAYMENT_HOLD_ID: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/hold/order/payment',
};

export const API_SETTLE_SECONDARY_ATOMIC_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/atomic/settle/order',
};

export const API_SETTLE_SECONDARY_NON_ATOMIC_TRADE_ORDER: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/non/atomic/settle/order',
};

export const API_REJECT_SECONDARY_TRADE_ORDER: IAPIRoute = {
  method: 'DELETE',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/reject/order',
};

export const API_SECONDARY_TRADE_SEND_PAYMENT: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/send/payment',
};

export const API_SECONDARY_TRADE_RECEIVE_PAYMENT: IAPIRoute = {
  method: 'POST',
  path: () =>
    '/api/assets/v2/workflows/digital/asset/secondary/trade/receive/payment',
};

export const API_CBDC_DIGITAL_CURRENCIES: IAPIRoute = {
  method: 'GET',
  path: () =>
    `${process.env.REACT_APP_CBDC_BASE_URL}api/digital-currency/digital-currencies`,
};

export const API_CBDC_DIGITAL_CURRENCY_LEGAL_ENTITIES: IAPIRoute = {
  method: 'GET',
  path: () =>
    `${process.env.REACT_APP_CBDC_BASE_URL}api/digital-currency/registry/entities`,
};

export const API_ADD_NAV_MANAGER: IAPIRoute = {
  method: 'PUT',
  path: (userId) => `/api/assets/v2/essentials/user/${userId}/add/nav/manager`,
};

export const API_ADD_KYC_VERIFIER: IAPIRoute = {
  method: 'PUT',
  path: (userId) => `/api/assets/v2/essentials/user/${userId}/add/kyc/verifier`,
};

export const API_FETCH_MAIL_TEMPLATES: IAPIRoute = {
  method: 'GET',
  path: () => `/api/assets/v2/email/templates`,
};

export const API_UPSERT_MAIL_TEMPLATES: IAPIRoute = {
  method: 'POST',
  path: () => `/api/assets/v2/email/templates`,
};

export const API_LIST_USECASES: IAPIRoute = {
  method: 'GET',
  path: () => '/api/assets/v2/usecases',
};

export const API_GET_USECASE: IAPIRoute = {
  method: 'GET',
  path: (usecase) => `/api/assets/v2/usecases/${usecase}`,
};

export const API_CREATE_USECASE: IAPIRoute = {
  method: 'POST',
  path: () => `/api/assets/v2/usecases`,
};

export const API_UPDATE_USECASE: IAPIRoute = {
  method: 'PUT',
  path: (usecase) => `/api/assets/v2/usecases/${usecase}`,
};

export const API_DELETE_USECASE: IAPIRoute = {
  method: 'DELETE',
  path: (usecase) => `/api/assets/v2/usecases/${usecase}`,
};
