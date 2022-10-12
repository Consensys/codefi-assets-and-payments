/**
 * [Extract authToken from request headers if existing]
 */
export const extractAuthTokenFromRequest = (req) => {
  const authorizationHeaders = req?.headers?.authorization;
  if (authorizationHeaders) {
    const splitAuthorizationHeaders = authorizationHeaders.split(' ');
    if (splitAuthorizationHeaders && splitAuthorizationHeaders.length > 0) {
      return splitAuthorizationHeaders[1];
    }
  }
  return undefined;
};
