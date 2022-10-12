import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { JwtToken } from 'src/requests/JwtToken';

/**
 * [Extract authToken from request headers if existing]
 */
export const extractAuthTokenFromRequest = (request): string | undefined => {
  const authorizationHeaders = request?.headers?.authorization;
  if (authorizationHeaders) {
    const splitAuthorizationHeaders = authorizationHeaders.split(' ');
    if (splitAuthorizationHeaders && splitAuthorizationHeaders.length > 0) {
      return splitAuthorizationHeaders[1];
    }
  }
  return undefined;
};

/**
 * [Extract and decode authToken from request headers if existing]
 */
export const decodeToken = (request: Request): JwtToken | undefined => {
  const authToken: string = extractAuthTokenFromRequest(request);

  if (authToken) {
    const decodedToken: JwtToken = jwt.decode(authToken) as JwtToken;
    return decodedToken;
  }
  return undefined;
};
