import codefiScopes from './permissions/codefi.json'
import orchestrateScopes from './permissions/orchestrate.json'
export class ConfigConstants {
  // general
  static AUTH0_MANAGEMENT_API_NAME = 'Auth0 Management API'

  // actions
  static ACTION_NAME_SEGMENT = 'Log To Segment'
  static ACTION_CODE_SEGMENT = 'logToSegment.js'
  static ACTION_DEPENDENCIES_SEGMENT = [
    { name: 'analytics-node', version: '6.0.0' },
  ]
  static ACTION_NAME_TENANT_CUSTOM_CLAIM = 'Tenant ID Custom Claim'
  static ACTION_CODE_TENANT_CUSTOM_CLAIM = 'tenantIdCustomClaim.js'
  static ACTION_DEPENDENCIES_TENANT_CUSTOM_CLAIM = []
  static ACTION_NAME_REQUIRE_MFA = 'Require MFA'
  static ACTION_CODE_REQUIRE_MFA = 'requireMfa.js'
  static ACTION_DEPENDENCIES_REQUIRE_MFA = []
  static ACTION_NAME_M2M_TENANT_CUSTOM_CLAIM = 'M2M Tenant ID Custom Claim'
  static ACTION_CODE_M2M_TENANT_CUSTOM_CLAIM = 'm2mTenantIdCustomClaim.js'
  static ACTION_DEPENDENCIES_M2M_TENANT_CUSTOM_CLAIM = []
  static ACTION_NAME_M2M_RATE_LIMIT = 'M2M Rate Limit'
  static ACTION_CODE_M2M_RATE_LIMIT = 'm2mRateLimit.js'
  static ACTION_DEPENDENCIES_M2M_RATE_LIMIT = [
    { name: 'redis', version: '4.0.4' },
  ]
  static ACTION_NAME_USER_REGISTRATION = 'User Registration'
  static ACTION_CODE_USER_REGISTRATION = 'userRegistration.js'
  static ACTION_DEPENDENCIES_USER_REGISTRATION = [
    { name: 'axios', version: '0.25.0' },
  ]
  static ACTION_NAME_CREATE_TENANT_FOR_INFURA_USER =
    'Create Tenant for Infura User'
  static ACTION_CODE_CREATE_TENANT_FOR_INFURA_USER =
    'createTenantForInfuraUser.js'
  static ACTION_DEPENDENCIES_CREATE_TENANT_FOR_INFURA_USER = [
    { name: 'axios', version: '0.25.0' },
  ]

  // api - resource servers, 1 public one called Codefi API, 1 private one called Admin API
  static CODEFI_API_RESOURCE_SERVER_IDENTIFIER = 'https://api.codefi.network'
  static CODEFI_API_RESOURCE_SERVER_NAME = 'Codefi API'
  static ADMIN_API_RESOURCE_SERVER_IDENTIFIER = 'https://admin.codefi.network'
  static ADMIN_API_RESOURCE_SERVER_NAME = 'Admin API'
  static ADMIN_API_SCOPES = [
    {
      description:
        'A scope used only by auth0 rules to trigger our admin api when an user logs in for the first time',
      value: 'register:hook',
    },
    {
      description: 'Call GET endpoints to read data about Client Applications',
      value: 'read:client',
    },
    {
      description: 'Create, or update Client Applications',
      value: 'write:client',
    },
    {
      description: 'Delete a Client Application',
      value: 'delete:client',
    },
    {
      description:
        'Read data about Client Grants that authorise applications to call APIs',
      value: 'read:grant',
    },
    {
      description: 'Create, or update Client Grants',
      value: 'write:grant',
    },
    {
      description: 'Delete a Client Grant',
      value: 'delete:grant',
    },
    {
      description: 'Read data about APIs (Auth0 resource servers)',
      value: 'read:api',
    },
    {
      description: 'Create, or update APIs',
      value: 'write:api',
    },
    {
      description: 'Delete an API',
      value: 'delete:api',
    },
    {
      description: 'Read data about Users',
      value: 'read:user',
    },
    {
      description: 'Create, or update Users',
      value: 'write:user',
    },
    {
      description: 'Delete a User',
      value: 'delete:user',
    },
    {
      description: 'Create invitation emails to invite-only Clients',
      value: 'write:invite',
    },
    {
      description: 'Read role information',
      value: 'read:role',
    },
    {
      description: 'Create and edit roles',
      value: 'write:role',
    },
    {
      description: 'Delete roles',
      value: 'delete:role',
    },
    {
      description: 'Read data about Tenant',
      value: 'read:tenant',
    },
    {
      description: 'Create, or update Tenant',
      value: 'write:tenant',
    },
    {
      description: 'Delete a Tenant',
      value: 'delete:tenant',
    },
  ]

  static MACHINE_TO_MACHINE_CLIENT_NAME_CODEFI = 'codefi-api-m2m-client'
  static MACHINE_TO_MACHINE_CLIENT_NAME_ADMIN = 'codefi-admin-api-m2m-client'

  // email provider
  static EMAIL_PROVIDER_NAME = 'sendgrid'

  // email invite only configuration
  static EMAIL_INVITE_ONLY_APPLICATION_NAME = 'Codefi-email-invite-application'
  static EMAIL_INVITE_ONLY_CONNECTION_NAME =
    'Codefi-Email-Invite-only-connection'
  static EMAIL_INVITE_ONLY_APPLICATION_GRANT_SCOPES = [
    'read:users',
    'update:users',
    'delete:users',
    'create:users',
    'create:user_tickets',
  ]

  // create users configuration
  static CREATE_USERS_CONNECTION_NAME = 'Username-Password-Authentication'
  static CREATE_USERS_APPLICATION_NAME = 'Workflow-create-users-application'

  // stack admin
  static STACK_ADMIN_NAME = 'Codefi'
  static STACK_ADMIN_ROLE = 'Stack Admin'

  static TRIGGER_POST_LOGIN = {
    id: 'post-login',
    version: 'v2',
  }

  static TRIGGER_CREDENTIALS_EXCHANGE = {
    id: 'credentials-exchange',
    version: 'v2',
  }

  static API_SCOPES = {
    [ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER]:
      ConfigConstants.ADMIN_API_SCOPES.map((scope) => scope.value),
    [ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER]: [
      ...codefiScopes.map((scope) => scope.value),
      ...orchestrateScopes.map((scope) => scope.value),
    ],
  }

  static INFURA_CONNECTION_NAME = 'Infura'
  static INFURA_CONNECTION_AUTH_URL = 'https://oauth.infura.io/oauth2/auth'
  static INFURA_CONNECTION_TOKEN_URL = 'https://oauth.infura.io/oauth2/token'
  static INFURA_CONNECTION_ICON_URL =
    'https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/blkhxycyoyj4zk4trcjo'
  static INFURA_CONNECTION_SCOPE = 'openid user.read projects.read'
  static INFURA_API_HUB_CLIENT_NAME = 'Infura API Hub'
  static CODEFI_WILDCARD_URL = 'https://*.api.codefi.network/'
}
