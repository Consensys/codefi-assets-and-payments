import { Request } from 'express';
import jwt, { VerifyOptions, JwtHeader } from 'jsonwebtoken';
import jwksClient, { SigningKey } from 'jwks-rsa';
import cfg from '../config';
import {
  UnauthorizedException,
  ConfigurationException,
} from '@consensys/error-handler';

export const tenantIdHeader = 'x-tenant-id';
export const entityIdHeader = 'x-entity-id';
export const superTenantId = '*';
export const superEntityId = '*';

// Check if algorythm is HMAC type algorythm
export const isHMAC = (alg: string): boolean => alg.indexOf('HS') === 0;

let cachedClient: jwksClient.JwksClient;
const getJwksClient = () => {
  if (!cachedClient) {
    cachedClient = jwksClient({
      strictSsl: true,
      jwksUri: `${cfg().issuer}.well-known/jwks.json`,
      timeout: 30000,
    });
  }

  return cachedClient;
};


// Get key/cert function for jwt verify process
export const getCertFunc = (header: JwtHeader, callback: (error: Error, key: string) => void): void => {
  // In case of HMAC just return secret from config
  if (isHMAC(header.alg)) {
    callback(undefined, cfg().hmacSecret);
    return;
  }

  const client = getJwksClient();

  // In case of RSA/ECDSA fetch the key from issuer
  client.getSigningKey(header.kid, function (err, key: SigningKey) {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
};

// Extract awt token from Authorization headers
export const extractTokenFromRequest = (
  request: Request
): string | undefined => {
  const headers = request.headers;

  if (headers.authorization) {
    const bearerToken = headers.authorization;
    const bearerTokenArray = bearerToken.split(' ');

    if (bearerTokenArray.length < 2) {
      return undefined;
    }

    const authToken = bearerTokenArray[1];

    return authToken;
  }

  return undefined;
};

export const checkAuthentication = async (
  request: Request
): Promise<boolean> => {
  // Bypass auth check if configured
  if (cfg().bypassAuthenticationCheck) {
    return true;
  }

  // Extract access token from Authorization headers
  const authToken = extractTokenFromRequest(request);

  if (!authToken) {
    throw new UnauthorizedException(
      'Missing Auth Token',
      `Please provide an auth token to authenticate your request`,
      {
        authToken,
        request,
      }
    );
  }

  if (!cfg().acceptedAudience) {
    throw new UnauthorizedException(
      'No Accepted Audience',
      `Cannot authenticate request as no AUTH_ACCEPTED_AUDIENCE was provided`,
      {
        authToken,
        request,
      }
    );
  }

  if (!cfg().issuer) {
    throw new UnauthorizedException(
      'No Auth0 URL',
      `Cannot authenticate request as no AUTH0_URL was provided`,
      {
        authToken,
        request,
      }
    );
  }

  // Verify JWT payload, no need to verify it here
  return new Promise((resolve, reject) => {
    // Build verify options based on configuration
    const verifyOptions: VerifyOptions = {
      algorithms: cfg().algorithms,
      issuer: cfg().issuer,
      audience: cfg().acceptedAudience,
    };

    // Verify JWT payload, no need to verify it here
    jwt.verify(authToken, getCertFunc, verifyOptions, (err) => {
      if (err) {
        reject(
          new UnauthorizedException(
            'Invalid Auth Token',
            `Error verifying signature of auth token ${authToken} because of: ${err}`,
            {
              err,
              authToken,
              verifyOptions,
            }
          )
        );
      } else {
        // Simply return true if jwt token is verified successfully at the moment
        resolve(true);
      }
    });
  });
};

export const decodeTokenFromRequest = (
  request: Request
): { [key: string]: any } | undefined => {
  const authToken: string = extractTokenFromRequest(request);
  return decodeToken(authToken);
};

export const decodeToken = (
  token: string
): { [key: string]: any } | undefined => {
  if (token) {
    try {
      const decodedToken: { [key: string]: any } = jwt.decode(token) as {
        [key: string]: any;
      };

      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid Auth Token',
        `Error decoding auth token ${token} because of: ${error?.message}`,
        {
          error,
          token,
        }
      );
    }
  }

  return undefined;
};

export const checkPermissions = (
  request: Request,
  endpointPermissions: string[] = []
): boolean => {
  // Bypass permissions check if configured
  if (cfg().bypassPermissionCheck) {
    return true;
  }

  const permissions = extractPermissionsFromRequest(request);

  const missingPermissions = endpointPermissions.filter(
    (permission) => !permissions.includes(permission)
  );

  if (missingPermissions.length) {
    throw new UnauthorizedException(
      'Invalid Auth Token',
      `Permission was not found in auth token: ${missingPermissions.join(
        ', '
      )}`,
      {
        missingPermissions,
        request,
      }
    );
  }

  return true;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const extractTenantIdFromToken = (decodedToken: any): string => {
  if (!cfg()?.customNamespace) {
    throw new ConfigurationException(
      'Service Not Configured',
      `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later"`,
      {
        decodedToken,
        customNamespace: cfg()?.customNamespace,
      }
    );
  }
  if (!decodedToken) {
    throw new UnauthorizedException(
      'Missing Auth Token',
      `Please provide an auth token to authenticate your request`,
      {
        decodedToken,
        customNamespace: cfg()?.customNamespace,
      }
    );
  }

  const codefiCustomClaims = decodedToken[cfg()?.customNamespace];

  if (!codefiCustomClaims) {
    throw new UnauthorizedException(
      'Invalid Auth Token',
      `Auth token contains no custom claims in namespace: ${
        cfg()?.customNamespace
      }`,
      {
        decodedToken,
        customNamespace: cfg()?.customNamespace,
      }
    );
  }

  if (!codefiCustomClaims.tenantId) {
    throw new UnauthorizedException(
      'Invalid Auth Token',
      `Auth token contains no tenantId in custom claim ${
        cfg()?.customNamespace
      }`,
      {
        decodedToken,
        customNamespace: cfg()?.customNamespace,
      }
    );
  }

  const tenantId = codefiCustomClaims.tenantId;

  return tenantId;
};

export const extractTenantIdFromRequestAndHeader = (
  request: Request
): string => {
  const requestTenantId = extractTenantIdFromRequest(request);
  const headersTenantId = extractTenantIdFromHeaders(request);

  if (requestTenantId === superTenantId && headersTenantId) {
    return headersTenantId;
  }

  return requestTenantId;
};

export const extractTenantIdFromHeaders = (request: Request): string => {
  return request?.headers?.[tenantIdHeader] as string;
};

export const extractEntityIdFromHeaders = (request: Request): string => {
  return request?.headers?.[entityIdHeader] as string;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const extractEntityIdFromToken = (decodedToken: any): string => {
  if (cfg()?.customNamespace) {
    const codefiCustomClaims = decodedToken[cfg()?.customNamespace];

    if (codefiCustomClaims) {
      return codefiCustomClaims.entityId;
    }
  }

  return undefined;
};

export const extractTenantIdFromRequest = (
  request: Request
): string | undefined => {
  const decodedToken = decodeTokenFromRequest(request);

  return extractTenantIdFromToken(decodedToken);
};

export const extractEntityIdFromRequest = (
  request: Request
): string | undefined => {
  const decodedToken = decodeTokenFromRequest(request);

  const entityIdFromToken = extractEntityIdFromToken(decodedToken);

  const entityId =
    entityIdFromToken === '*'
      ? extractEntityIdFromHeaders(request)
      : entityIdFromToken;

  return entityId;
};

export const extractPermissionsFromRequest = (request: Request): string[] => {
  const decodedToken = decodeTokenFromRequest(request);
  return extractPermissionsFromToken(decodedToken);
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const extractPermissionsFromToken = (decodedToken: any): string[] => {
  if (!decodedToken) {
    throw new UnauthorizedException(
      'Invalid Auth Token',
      `Error decoding auth token: undefined response`,
      {
        decodedToken,
      }
    );
  }

  const useCustomClaim = cfg().checkPermissionsCustomClaim;
  const customNamespace = cfg().customNamespace;

  if (useCustomClaim && !customNamespace) {
    throw new ConfigurationException(
      'Service Not Configured',
      `Service is not configured (missing 'customNamespace' environment variable). Please ask an admin for help or try again later`,
      {
        decodedToken,
        customNamespace,
      }
    );
  }

  const permissions = useCustomClaim
    ? decodedToken[customNamespace]?.permissions
    : decodedToken.permissions;

  if (!permissions) {
    throw new UnauthorizedException(
      'Invalid Auth Token',
      `Auth token has no permissions`,
      {
        decodedToken,
      }
    );
  }

  return permissions;
};
