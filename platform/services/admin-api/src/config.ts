import {
  ConfiguredPermission,
  ConfiguredRole,
} from './config/types/ConfiguredRole'
import {
  envString,
  envBool,
  envInt,
  envRegex,
  envJson,
} from './utils/config-utils'
import 'dotenv/config'

const auth0TenantDomain = envString(
  'AUTH0_TENANT_DOMAIN',
  envRegex('AUTH0_URL', /https:\/\/(.+)\//),
)

const configObject = {
  core: {
    appName: envString('APP_NAME', 'Admin API'),
    serverPort: envInt('PORT', 3000),
    logLevel: envString('LOG_LEVEL', 'debug'),
    logPretty: envBool('LOG_PRETTY_PRINT', false),
  },
  auth: {
    disableScopesAndPermissions: envBool(
      'DISABLE_SCOPES_AND_PERMISSIONS',
      false,
    ),
  },
  auth0: {
    tenantDomain: auth0TenantDomain,
    clientId: envString('CLIENT_ID', undefined, true),
    clientSecret: envString('CLIENT_SECRET', undefined, true),
    audience: envString('API_AUDIENCE', `https://${auth0TenantDomain}/api/v2/`),
  },
  kafka: {
    enabled: envBool('KAFKA_ENABLE', false),
    groupId: envString('KAFKA_GROUP_ID', undefined, true),
    commitSha: envString('CI_COMMIT_SHORT_SHA', ''),
  },
  initialConfig: {
    enabled: envBool('PERFORM_INITIAL_CONFIGURATION', false),
    emailProviderApiKey: envString('EMAIL_PROVIDER_API_KEY', undefined, true),
    emailInviteApplication: envString(
      'EMAIL_INVITE_APPLICATION',
      undefined,
      true,
    ),
    codefiApiScopes: envJson<ConfiguredPermission[]>('CODEFI_API_SCOPES', []),
    initialRoles: envJson<ConfiguredRole[]>('INITIAL_ROLES', []),
    initialAdminRoles: envJson<ConfiguredRole[]>('INITIAL_ADMIN_ROLES', []),
    stackAdminUserEmail: envString('STACK_ADMIN_USER_EMAIL', undefined, true),
    stackAdminUserPassword: envString(
      'STACK_ADMIN_USER_PASSWORD',
      undefined,
      true,
    ),
    stackAdminTenantId: envString('STACK_ADMIN_TENANT_ID', 'codefi'),
    stackAdminEntityId: envString('STACK_ADMIN_ENTITY_ID', 'sassAdmin'),
  },
  actions: {
    tokenEndpoint: envString(
      'TOKEN_ENDPOINT',
      `https://${auth0TenantDomain}/oauth/token`,
    ),
    urlEnvironment: envString('URL_ENVIRONMENT', 'http://localhost:3000'),
    urlVersion: envString('URL_VERSION', ''),
    segmentKey: envString('SEGMENT_KEY', 'to be defined'),
    jwtCustomNamespace: envString(
      'JWT_CUSTOM_NAMESPACE',
      'https://api.codefi.network',
    ),
    jwtCustomOrchestrateNamespace: envString(
      'JWT_CUSTOM_ORCHESTRATE_NAMESPACE',
      'https://api.orchestrate.network',
    ),
    isMaster:
      envString('CI_MERGE_REQUEST_TARGET_BRANCH_NAME', undefined, true) !==
      'master',
    adminAppsEligibleToRules: envString(
      'ADMIN_APPS_ELIGIBLE_RULE',
      [
        'Admin API Documentation',
        'Codefi Admin Applications',
        'CoDeFi API,CoDeFi API Management Application',
        'CoDeFi API Management Application Development',
        'codefi-admin-m2m-client',
        'Codefi-email-invite-application',
        'E2E Test - Admin Api',
        'E2E Tests',
        'E2E-Admin-api-dev',
        'LU-localhost,KongJWT',
      ].join(','),
    ),
    m2mRateLimitMaxAttempts: envString('M2M_RATE_LIMIT_MAX_ATTEMPTS', '5'),
    m2mRateLimitAttemptPeriodInSeconds: envString(
      'M2M_RATE_LIMIT_ATTEMPT_PERIOD_IN_SECONDS',
      '600',
    ),
    m2mRateLimitRedisHost: envString(
      'M2M_RATE_LIMIT_REDIS_HOST',
      undefined,
      true,
    ),
    m2mRateLimitRedisPass: envString(
      'M2M_RATE_LIMIT_REDIS_PASS',
      undefined,
      true,
    ),
    disableRateLimitTenants: envString(
      'DISABLE_RATE_LIMIT_TENANTS',
      undefined,
      true,
    ),
    entityApiUrl: envString('ENTITY_API_URL', 'http://localhost:3002'),
  },
  docs: {
    exportDocs: envBool('EXPORT_DOCS', false),
    enableSwagger: envBool('ENABLE_SWAGGER', false),
  },
  defaults: {
    limit: 100,
    skip: 0,
  },
  infura: {
    clientId: envString('INFURA_CONNECTION_CLIENT_ID', undefined, true),
    clientSecret: envString('INFURA_CONNECTION_CLIENT_SECRET', undefined, true),
    userApiUrl: envString('INFURA_USER_API_URL', undefined, true),
  },
  cors: {
    enabled: envBool('CORS_ENABLED', false),
    origin: envString('CORS_ORIGIN', undefined, true),
  },
}

export type ConfigType = typeof configObject

export default function cfg(): ConfigType {
  return configObject
}
