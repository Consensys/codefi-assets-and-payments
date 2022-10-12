require('dotenv').config();

import { Algorithm } from 'jsonwebtoken';
import { envBool, envInt, envString } from './utils/config-utils';

const loadConfig = () => ({
  auth0Url: envString('AUTH0_URL'),
  bypassAuthenticationCheck: envBool('AUTH_BYPASS_AUTHENTICATION_CHECK', false),
  bypassPermissionCheck: envBool('AUTH_BYPASS_PERMISSION_CHECK', false),
  acceptedAudience: envString('AUTH_ACCEPTED_AUDIENCE'),
  issuer: envString('AUTH0_URL'),
  customNamespace: envString('AUTH_CUSTOM_NAMESPACE'),
  // Used when Orchestrate multi-tenancy is enabled, to extract tenantId from authToken
  orchestrateNamespace: envString('AUTH_CUSTOM_ORCHESTRATE_NAMESPACE'),
  algorithms: [envString('AUTH_ALGORYTHM', 'RS256') as Algorithm],
  hmacSecret: envString('AUTH_HMAC_SECRET', ''),
  checkPermissionsCustomClaim: envBool(
    'AUTH_CHECK_PERMISSIONS_CUSTOM_CLAIM',
    false
  ),
  m2mToken: {
    redis: {
      enable: envBool('M2M_TOKEN_REDIS_ENABLE', true),
      host: envString('M2M_TOKEN_REDIS_HOST'),
      pass: envString('M2M_TOKEN_REDIS_PASS'),
    },
    expireThreshold: envInt('M2M_TOKEN_EXPIRE_THRESHOLD', 100),
  },
});

export type Config = ReturnType<typeof loadConfig>;

let config: Config;

export default function cfg(): Config {
  if (!config) {
    config = loadConfig();
  }

  return config;
}
