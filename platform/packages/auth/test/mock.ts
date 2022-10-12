import { Request } from 'express';
import { JwtHeader } from 'jsonwebtoken';
import { Config } from 'src/config';
import { superTenantId } from '../src/utils/authUtils';
import { Algorithm } from 'jsonwebtoken';

export const HMAC_ALGORYTMS = ['HS256', 'HS384', 'HS512'];
export const NON_HMAC_ALGORYTMS = [
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512',
  'PS256',
  'PS384',
  'PS512',
  'none',
];

export const mockedRequestWithEmptyAuth: Partial<Request> = {
  headers: {},
};

export const mockedRequestWithWrongAuth: Partial<Request> = {
  headers: {
    authorization: 'wrongauth',
  },
};

export const CUSTOM_NAMESPACE = 'custom:namespace';
export const TENANT_ID_VALUE = 'custom:value';
export const mockedToken = 'this-is-mocked-jwt-token';
export const mockedRequestWithProperAuth: Partial<Request> = {
  headers: {
    authorization: `Bearer ${mockedToken}`,
  },
};
export const mockedDecodedToken = {
  permissions: ['create:token'],
};
export const mockedDecodedTokenWithTenant = {
  permissions: ['create:token'],
  [CUSTOM_NAMESPACE]: {
    tenantId: TENANT_ID_VALUE,
  },
};
export const mockedDecodedTokenWithSuperTenant = {
  permissions: ['create:token'],
  [CUSTOM_NAMESPACE]: {
    tenantId: superTenantId,
  },
};
export const mockedDecodedTokenWithCustomClaimPermissions = {
  [CUSTOM_NAMESPACE]: {
    permissions: ['create:token'],
  },
};

export const mockedRequestedProperPermissions = ['create:token'];
export const mockedRequestedWrongPermissions = ['read:token'];
export const permissionsMock = ['create:token', 'read:token'];
export const decodedTokenWithPermissionsMock = { permissions: permissionsMock };
export const decodedTokenWithCustomClaimPermissionsMock = {
  [CUSTOM_NAMESPACE]: { permissions: permissionsMock },
};
export const decodedTokenEmptyMock = {};
export const decodedTokenWithNoCustomClaimPermissionsMock = {
  [CUSTOM_NAMESPACE]: {},
};

export const mockHMACSecret = 'this-is-hmac-secret';
export const getMockedConfig = ({
  auth0Url = auth0UrlMock,
  bypassAuthenticationCheck = false,
  bypassPermissionCheck = false,
  algorithms = ['RS256' as Algorithm],
  hmacSecret = '',
  customNamespace = null,
  acceptedAudience = audienceMock,
  issuer = auth0UrlMock,
  checkPermissionsCustomClaim = false,
} = {}): Config =>
  ({
    auth0Url,
    bypassAuthenticationCheck,
    acceptedAudience,
    bypassPermissionCheck,
    issuer,
    customNamespace,
    algorithms,
    hmacSecret,
    checkPermissionsCustomClaim,
  } as Config);

export const mockedJwtHeaderWithHMACAlg: Partial<JwtHeader> = {
  alg: HMAC_ALGORYTMS[0],
};

export const mockedHeaderKeyId = 'this-is-mocked-key-id';
export const mockedJwtHeaderWithRSAAlg: Partial<JwtHeader> = {
  alg: NON_HMAC_ALGORYTMS[0],
  kid: mockedHeaderKeyId,
};

export const mockedSigningPublicKey = 'this-is-signing-public-key';
export const mockedSigningKey = {
  getPublicKey: () => mockedSigningPublicKey,
};

export const clientIdMock = 'S1Rs8UzpQMhU5zssLAMedjNd7V8c6l8A';
export const clientSecretMock = 'testClientSecret';
export const audienceMock = 'https://test.host.network';
export const m2mTokenMock =
  'pmED4AVDq+hUTmEuQRJLfFOFOySTAsgEqpHnvaUNkAyDafVK9uGDJ9IZmlDbc7HBbaKE756ICF8wd8+qNjQhcUMH1eUoF4FmevK1GThsEHmg4SXVbhN6F0isPbPAEbw38uN2Tw==';
export const auth0UrlMock = 'test.eu.auth0.com';
export const redisHostMock = 'test.redis.com';
export const redisPassMock = 'redisPass123';
export const usernameMock = 'test@example.com';
export const passwordMock = 'testPass1234';
