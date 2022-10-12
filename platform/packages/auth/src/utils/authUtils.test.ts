import { Request } from 'express';
import jwksClient from 'jwks-rsa';
import jwt, { JwtHeader } from 'jsonwebtoken';
import cfg from '../config';

import {
  isHMAC,
  getCertFunc,
  extractTokenFromRequest,
  checkAuthentication,
  decodeTokenFromRequest,
  checkPermissions,
  extractTenantIdFromToken,
  extractTenantIdFromRequest,
  extractTenantIdFromRequestAndHeader,
  tenantIdHeader,
  extractPermissionsFromRequest,
  extractPermissionsFromToken,
} from './authUtils';
import {
  HMAC_ALGORYTMS,
  NON_HMAC_ALGORYTMS,
  CUSTOM_NAMESPACE,
  TENANT_ID_VALUE,
  mockedToken,
  mockedRequestWithEmptyAuth,
  mockedRequestWithWrongAuth,
  mockedRequestWithProperAuth,
  mockedRequestedProperPermissions,
  mockedRequestedWrongPermissions,
  mockedDecodedToken,
  mockedDecodedTokenWithTenant,
  getMockedConfig,
  mockHMACSecret,
  mockedJwtHeaderWithHMACAlg,
  mockedJwtHeaderWithRSAAlg,
  mockedSigningPublicKey,
  mockedSigningKey,
  mockedDecodedTokenWithSuperTenant,
  mockedDecodedTokenWithCustomClaimPermissions,
  permissionsMock,
  decodedTokenWithCustomClaimPermissionsMock,
  decodedTokenWithPermissionsMock,
  decodedTokenWithNoCustomClaimPermissionsMock,
  decodedTokenEmptyMock,
} from '../../test/mock';

jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');
jest.mock('../config');

const jstVerify = jwt.verify;
const jwtDecode = jwt.decode;

describe('authUtils', () => {
  describe('isHMAC function', () => {
    it('return true for HMAC-based algorythm', async () => {
      const isHmacAlgs = HMAC_ALGORYTMS.every((alg) => isHMAC(alg));

      expect(isHmacAlgs).toEqual(true);
    });

    it('return false for not HMAC-based algorythm', async () => {
      const nonHmacAlgs = NON_HMAC_ALGORYTMS.every((alg) => !isHMAC(alg));

      expect(nonHmacAlgs).toEqual(true);
    });
  });

  describe('getCertFunc function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwksClient as unknown as jest.Mock).mockReset();
    });

    it('return HMAC secret for HMAC alg', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          bypassPermissionCheck: true,
          algorithms: [],
          hmacSecret: mockHMACSecret,
        })
      );
      const mockedCallback = jest.fn();
      getCertFunc(
        mockedJwtHeaderWithHMACAlg as JwtHeader,
        mockedCallback
      );

      expect(mockedCallback.mock.calls.length).toEqual(1);
      expect(mockedCallback.mock.calls).toContainEqual([
        undefined,
        mockHMACSecret,
      ]);
    });

    it('return signing key for non HMAC alg', async () => {
      const mockedCallback = jest.fn();
      const mockedGetSigningKey = jest.fn((kid, cb) =>
        cb(undefined, mockedSigningKey)
      );
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          bypassPermissionCheck: true,
          algorithms: [],
          hmacSecret: mockHMACSecret,
        })
      );
      (jwksClient as unknown as jest.Mock).mockImplementation(() => ({
        getSigningKey: mockedGetSigningKey,
      }));
      getCertFunc(
        mockedJwtHeaderWithRSAAlg as JwtHeader,
        mockedCallback
      );

      expect((jwksClient as unknown as jest.Mock).mock.calls.length).toEqual(1);
      expect(mockedGetSigningKey.mock.calls.length).toEqual(1);
      expect(mockedCallback.mock.calls.length).toEqual(1);
      expect(mockedCallback.mock.calls).toContainEqual([
        undefined,
        mockedSigningPublicKey,
      ]);
    });
  });

  describe('extractTokenFromRequest function', () => {
    it('return undefined for empty auth header', async () => {
      const token = extractTokenFromRequest(
        mockedRequestWithEmptyAuth as Request
      );

      expect(token).toEqual(undefined);
    });

    it('return undefined for wrong auth header', async () => {
      const token = extractTokenFromRequest(
        mockedRequestWithWrongAuth as Request
      );

      expect(token).toEqual(undefined);
    });

    it('return proper token for auth header', async () => {
      const token = extractTokenFromRequest(
        mockedRequestWithProperAuth as Request
      );

      expect(token).toEqual(mockedToken);
    });
  });

  describe('decodeTokenFromRequest function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('return undefined in case of wrong token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      const result = decodeTokenFromRequest(
        mockedRequestWithWrongAuth as Request
      );

      expect(result).toEqual(undefined);
    });

    it('return decoded token for proper token in auth', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockImplementation(() => mockedDecodedToken);
      const result = decodeTokenFromRequest(
        mockedRequestWithProperAuth as Request
      );

      expect(result).toEqual(mockedDecodedToken);
    });
  });

  describe('checkPermissions function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('return true if check bypass configures', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ bypassPermissionCheck: true })
      );
      const result = checkPermissions(mockedRequestWithProperAuth as Request);

      expect(result).toEqual(true);
    });

    it('return false in case of wrong token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());

      expect(() => {
        checkPermissions(mockedRequestWithWrongAuth as Request);
      }).toThrowError(`Error decoding auth token: undefined response`);
    });

    it('return true for proper permissions', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockImplementation(() => mockedDecodedToken);
      const result = checkPermissions(
        mockedRequestWithProperAuth as Request,
        mockedRequestedProperPermissions
      );

      expect(result).toEqual(true);
    });

    it('return false if permission is missing', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockImplementation(() => mockedDecodedToken);

      expect(() => {
        checkPermissions(
          mockedRequestWithProperAuth as Request,
          mockedRequestedWrongPermissions
        );
      }).toThrowError(
        new Error('Permission was not found in auth token: read:token')
      );
    });

    it('return false if multiple permissions missing', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockImplementation(() => mockedDecodedToken);

      expect(() => {
        checkPermissions(mockedRequestWithProperAuth as Request, [
          ...mockedRequestedWrongPermissions,
          'missing:permission',
        ]);
      }).toThrowError(
        new Error(
          'Permission was not found in auth token: read:token, missing:permission'
        )
      );
    });

    it('return true if correct permissions in custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithCustomClaimPermissions
      );

      const result = checkPermissions(
        mockedRequestWithProperAuth as Request,
        mockedRequestedProperPermissions
      );

      expect(result).toEqual(true);
    });

    it('return false if permission is missing in custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithCustomClaimPermissions
      );

      expect(() => {
        checkPermissions(
          mockedRequestWithProperAuth as Request,
          mockedRequestedWrongPermissions
        );
      }).toThrowError(
        new Error('Permission was not found in auth token: read:token')
      );
    });

    it('return false if multiple permissions missing in custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithCustomClaimPermissions
      );

      expect(() => {
        checkPermissions(mockedRequestWithProperAuth as Request, [
          ...mockedRequestedWrongPermissions,
          'missing:permission',
        ]);
      }).toThrowError(
        new Error(
          'Permission was not found in auth token: read:token, missing:permission'
        )
      );
    });
  });

  describe('checkAuthentication function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jstVerify as jest.Mock).mockReset();
    });

    it('return true if check bypass configures', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ bypassAuthenticationCheck: true })
      );
      const result = await checkAuthentication(
        mockedRequestWithProperAuth as Request
      );

      expect(result).toEqual(true);
    });

    it('throw exception in case of wrong token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      await checkAuthentication(mockedRequestWithWrongAuth as Request).catch(
        (err) => {
          expect(err?.message).toEqual(
            'Please provide an auth token to authenticate your request'
          );
        }
      );
    });

    it('resolved for verified token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jstVerify as jest.Mock).mockImplementation(
        (authToken, getCertFunc, verifyOptions, cb) => cb()
      );
      const result = await checkAuthentication(
        mockedRequestWithProperAuth as Request
      );

      expect(result).toEqual(true);
    });

    it('throw exception for non verified token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jstVerify as jest.Mock).mockImplementation(
        (authToken, getCertFunc, verifyOptions, cb) => cb('boom')
      );
      await checkAuthentication(mockedRequestWithProperAuth as Request).catch(
        (err) => {
          expect(err?.message).toEqual(
            'Error verifying signature of auth token this-is-mocked-jwt-token because of: boom'
          );
        }
      );
    });

    it('throws if no accepted audience env', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ acceptedAudience: null })
      );

      (jstVerify as jest.Mock).mockImplementation(
        (authToken, getCertFunc, verifyOptions, cb) => cb()
      );

      await expect(
        checkAuthentication(mockedRequestWithProperAuth as Request)
      ).rejects.toThrowError(
        'Cannot authenticate request as no AUTH_ACCEPTED_AUDIENCE was provided'
      );
    });

    it('throws if no auth0 url env', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ issuer: null })
      );

      (jstVerify as jest.Mock).mockImplementation(
        (authToken, getCertFunc, verifyOptions, cb) => cb()
      );

      await expect(
        checkAuthentication(mockedRequestWithProperAuth as Request)
      ).rejects.toThrowError(
        'Cannot authenticate request as no AUTH0_URL was provided'
      );
    });
  });

  describe('extractTenantIdFromToken function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('throws an error if namespace is not configured', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());

      expect(() => {
        extractTenantIdFromToken(mockedDecodedToken);
      }).toThrowError(
        `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later`
      );
    });

    it('throws an error if token namespace is empty', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );

      expect(() => {
        extractTenantIdFromToken(mockedDecodedToken);
      }).toThrowError(
        'Auth token contains no custom claims in namespace: custom:namespace'
      );
    });

    it('return tenantId', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      const result = extractTenantIdFromToken(mockedDecodedTokenWithTenant);

      expect(result).toEqual(TENANT_ID_VALUE);
    });
  });

  describe('extractTenantIdFromRequest function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('return undefined in case of wrong token', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );

      expect(() => {
        extractTenantIdFromRequest(mockedRequestWithWrongAuth as Request);
      }).toThrowError(
        `Please provide an auth token to authenticate your request`
      );
    });

    it('throws an error if namespace is not configured', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());

      expect(() => {
        extractTenantIdFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(
        `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later`
      );
    });

    it('throws an error if token namespace is empty', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      (jwtDecode as jest.Mock).mockImplementation(() => mockedDecodedToken);

      expect(() => {
        extractTenantIdFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(
        `Auth token contains no custom claims in namespace: custom:namespace`
      );
    });

    it('return tenantId for proper token in auth', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithTenant
      );
      const result = extractTenantIdFromRequest(
        mockedRequestWithProperAuth as Request
      );

      expect(result).toEqual(TENANT_ID_VALUE);
    });
  });

  describe('extractTenantIdFromRequestAndHeader function', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('return token tenantId for non-superuser token in auth with no header', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithTenant
      );
      const result = extractTenantIdFromRequestAndHeader(
        mockedRequestWithProperAuth as Request
      );

      expect(result).toEqual(TENANT_ID_VALUE);
    });

    it('return token tenantId for non-superuser token in auth with header', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithTenant
      );
      const result = extractTenantIdFromRequestAndHeader({
        headers: {
          ...mockedRequestWithProperAuth.headers,
          [tenantIdHeader]: 'impersonated-tenant',
        } as any,
      } as Request);

      expect(result).toEqual(TENANT_ID_VALUE);
    });

    it('return header tenantId for superuser token in auth with header', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ customNamespace: CUSTOM_NAMESPACE })
      );
      (jwtDecode as jest.Mock).mockImplementation(
        () => mockedDecodedTokenWithSuperTenant
      );

      const result = extractTenantIdFromRequestAndHeader({
        headers: {
          ...mockedRequestWithProperAuth.headers,
          [tenantIdHeader]: TENANT_ID_VALUE,
        } as any,
      } as Request);

      expect(result).toEqual(TENANT_ID_VALUE);
    });
  });

  describe('extractPermissionsFromRequest', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('success using standard claim', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockReturnValue(decodedTokenWithPermissionsMock);
      expect(
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request)
      ).toEqual(permissionsMock);
    });

    it('success using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockReturnValue(
        decodedTokenWithCustomClaimPermissionsMock
      );
      expect(
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request)
      ).toEqual(permissionsMock);
    });

    it('throws if no token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      expect(() => {
        extractPermissionsFromRequest(mockedRequestWithWrongAuth as Request);
      }).toThrowError(`Error decoding auth token: undefined response`);
    });

    it('throws if using custom claim and no custom namespace', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ checkPermissionsCustomClaim: true })
      );
      (jwtDecode as jest.Mock).mockReturnValue(
        decodedTokenWithCustomClaimPermissionsMock
      );
      expect(() => {
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(
        `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later`
      );
    });

    it('throws if no permissions defined using standard claim', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      (jwtDecode as jest.Mock).mockReturnValue(decodedTokenEmptyMock);
      expect(() => {
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(`Auth token has no permissions`);
    });

    it('throws if no permissions define using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockReturnValue(
        decodedTokenWithNoCustomClaimPermissionsMock
      );
      expect(() => {
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(`Auth token has no permissions`);
    });

    it('throws if no custom namespace data using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      (jwtDecode as jest.Mock).mockReturnValue(decodedTokenEmptyMock);
      expect(() => {
        extractPermissionsFromRequest(mockedRequestWithProperAuth as Request);
      }).toThrowError(`Auth token has no permissions`);
    });
  });

  describe('extractPermissionsFromToken', () => {
    beforeEach(() => {
      (cfg as jest.Mock).mockReset();
      (jwtDecode as jest.Mock).mockReset();
    });

    it('success using standard claim', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      expect(
        extractPermissionsFromToken(decodedTokenWithPermissionsMock)
      ).toEqual(permissionsMock);
    });

    it('success using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      expect(
        extractPermissionsFromToken(decodedTokenWithCustomClaimPermissionsMock)
      ).toEqual(permissionsMock);
    });

    it('throws if no token', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      expect(() => {
        extractPermissionsFromToken(undefined);
      }).toThrowError(`Error decoding auth token: undefined response`);
    });

    it('throws if using custom claim and no custom namespace', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({ checkPermissionsCustomClaim: true })
      );
      expect(() => {
        extractPermissionsFromToken(decodedTokenWithCustomClaimPermissionsMock);
      }).toThrowError(
        `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later`
      );
    });

    it('throws if no permissions defined using standard claim', async () => {
      (cfg as jest.Mock).mockImplementation(() => getMockedConfig());
      expect(() => {
        extractPermissionsFromToken(decodedTokenEmptyMock);
      }).toThrowError(`Auth token has no permissions`);
    });

    it('throws if no permissions define using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      expect(() => {
        extractPermissionsFromToken(
          decodedTokenWithNoCustomClaimPermissionsMock
        );
      }).toThrowError(`Auth token has no permissions`);
    });

    it('throws if no custom namespace data using custom claim', async () => {
      (cfg as jest.Mock).mockImplementation(() =>
        getMockedConfig({
          customNamespace: CUSTOM_NAMESPACE,
          checkPermissionsCustomClaim: true,
        })
      );
      expect(() => {
        extractPermissionsFromToken(decodedTokenEmptyMock);
      }).toThrowError(`Auth token has no permissions`);
    });
  });
});
