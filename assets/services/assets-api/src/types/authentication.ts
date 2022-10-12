import { ProductsEnum } from '@codefi-assets-and-payments/ts-types';
import { IS_DEV_DOMAIN_NAME } from 'src/utils/domain';

export const DEV_DOMAIN_NAME = 'dev';
export const DEMO_DOMAIN_NAME = 'demo';
export interface AccessToken {
  iss: string;
  sub: string;
  aud: Array<string>;
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  gty: string;
}

export interface Auth0User {
  userId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  nickname: string;
  givenName: string;
  familyName: string;
  picture: string;
  appMetadata: {
    registered: boolean;
    // [tenantId: string]: {
    //   entityId: string;
    // };
    products: {
      [ProductsEnum.assets]: boolean;
    };
  };
  lastIp: string;
  lastLogin: string; // Date
  loginsCount: number;
  createdAt: string; // Date
  updatedAt: string; // Date
}

export const Auth0UserExample: Auth0User = {
  userId: 'string',
  email: 'john.doe@codefi.net',
  emailVerified: true,
  name: 'John',
  nickname: 'john.doe',
  givenName: 'John Doe',
  familyName: 'Doe',
  picture: 'htt://...',
  appMetadata: {
    registered: true,
    // [tenantIdExample]: {
    //   entityId: userIdExample,
    // },
    products: {
      [ProductsEnum.assets]: true,
    },
  },
  lastIp: '193.169.64.89',
  lastLogin: '2021-10-18T11:58:48.283Z',
  loginsCount: 1590,
  createdAt: '2020-12-11T08:41:30.485Z',
  updatedAt: '2020-12-11T08:41:30.485Z',
};

export const craftAuth0TenantId = (tenantId: string) => {
  // User's tenantId in Auth0 is 'tenantId' in most cases EXCEPT for dev environment where it is 'tenantId.dev'
  // Since dev and demo environements use the same instance of Auth0, this allows to handle the edge case where
  // the same user in Auth0 has both an account in dev and demo environments.
  if (IS_DEV_DOMAIN_NAME) {
    return `${tenantId}:${DEV_DOMAIN_NAME}`;
  } else {
    return tenantId;
  }
};

export const craftAuth0UserPassword = (password: string) => {
  return password || process.env.DEFAULT_PASSWORD;
};
