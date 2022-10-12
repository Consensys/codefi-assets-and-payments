// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { envBool, envString, envInt } from './utils/config-utils';
import ErrorService from 'src/utils/errorService';
import { setToLowerCaseExceptFirstLetter } from './utils/case';

const appUrl = envString('APP_URL');
const domainName = appUrl.split('//')[1];

let configObject;

const smartContractApiUrl = envString(
  'SMART_CONTRACT_API',
  'http://localhost:3000',
);
const entityApiUrl = envString('ENTITY_API', 'http://localhost:3000');
const defaultInitializationTenantId = envString(
  'DEFAULT_INITIALIZATION_TENANT_ID',
);
let defaultInitializationTenantShortName = 'Default';
let defaultInitializationTenantShortAlias;

const localOrchestrate = envBool('LOCAL_ORCHESTRATE', false);
if (localOrchestrate) {
  if (!smartContractApiUrl?.includes('localhost')) {
    ErrorService.throwError(
      "Invalid value for 'SMART_CONTRACT_API' env variable: when 'LOCAL_ORCHESTRATE' is set to true, Smart-Contract-Api shall be launched locally.",
    );
  }

  if (!entityApiUrl?.includes('localhost')) {
    ErrorService.throwError(
      "Invalid value for 'ENTITY_API' env variable: when 'LOCAL_ORCHESTRATE' is set to true, Entity-Api shall be launched locally.",
    );
  }

  if (!defaultInitializationTenantId?.includes('local')) {
    ErrorService.throwError(
      "Invalid value for 'DEFAULT_INITIALIZATION_TENANT_ID' env variable: when 'LOCAL_ORCHESTRATE' is set to true, the default intialization tenantId shall include the word 'local'. This makes sure we easier detect client application created for local development in Auth0. A good pratice is to set DEFAULT_INITIALIZATION_TENANT_ID=local-your_first_name",
    );
  }

  const extractedName = defaultInitializationTenantId
    .replace('-', '')
    .replace('local', '');
  if (!(extractedName && extractedName.length > 0)) {
    ErrorService.throwError(
      "Invalid value for 'DEFAULT_INITIALIZATION_TENANT_ID' env variable: A good pratice is to set DEFAULT_INITIALIZATION_TENANT_ID=local-your_first_name",
    );
  }

  defaultInitializationTenantShortName = `Local - ${setToLowerCaseExceptFirstLetter(
    extractedName,
  )} - ${defaultInitializationTenantShortName}`;

  defaultInitializationTenantShortAlias = defaultInitializationTenantId;
} else {
  if (smartContractApiUrl?.includes('localhost')) {
    ErrorService.throwError(
      "Invalid value for 'LOCAL_ORCHESTRATE' env variable: 'LOCAL_ORCHESTRATE' shall be set to true when Smart-Contract-Api is launched locally.",
    );
  }
  if (entityApiUrl?.includes('localhost')) {
    ErrorService.throwError(
      "Invalid value for 'LOCAL_ORCHESTRATE' env variable: 'LOCAL_ORCHESTRATE' shall be set to true when Entity-Api is launched locally.",
    );
  }
}

function loadConfig() {
  return {
    appUrl,
    domainName,
    acceptedAudience: envString('AUTH_ACCEPTED_AUDIENCE'),
    auth0Url: envString('AUTH0_URL'),
    m2mToken: {
      redis: {
        enable: envBool('M2M_TOKEN_REDIS_ENABLE', true),
        host: envString('M2M_TOKEN_REDIS_HOST'),
        pass: envString('M2M_TOKEN_REDIS_PASS'),
      },
      client: {
        id: envString('M2M_TOKEN_CLIENT_ID'),
        secret: envString('M2M_TOKEN_CLIENT_SECRET'),
      },
      audience: envString('M2M_TOKEN_AUDIENCE'),
      adminClient: {
        id: envString('M2M_TOKEN_ADMIN_CLIENT_ID'),
        secret: envString('M2M_TOKEN_ADMIN_CLIENT_SECRET'),
      },
      adminAudience: envString('M2M_TOKEN_ADMIN_AUDIENCE'),
    },
    maintenanceMode: {
      enabled: envBool('MAINTENANCE_MODE', false),
    },
    networkApi: {
      url: envString('NETWORK_API', 'http://localhost:3003'),
    },
    smartContractApi: {
      url: smartContractApiUrl,
    },
    entityApi: {
      url: entityApiUrl,
    },
    exportDocs: envBool('EXPORT_DOCS', false),
    apmEnv: envString('APM_ENV', undefined, true),
    defaultInitializationTenantId: envBool('PIPELINE', false)
      ? envString('E2E_TENANT_ID', '')
      : defaultInitializationTenantId,
    defaultInitializationTenantShortName: envBool('PIPELINE', false)
      ? `Ephemeral - ${envString('E2E_TENANT_ID', '')}`
      : defaultInitializationTenantShortName,
    defaultInitializationTenantShortAlias: envBool('PIPELINE', false)
      ? `ephemeral-${envString('E2E_TENANT_ID', '')}`
      : defaultInitializationTenantShortAlias,
    defaultInitializationTenantAlias: localOrchestrate
      ? `${defaultInitializationTenantShortAlias}.${domainName}`
      : domainName,
    superAdminEmail: envString('SUPERADMIN_EMAIL', undefined, true),
    customSubDomainName: envString('CUSTOM_SUB_DOMAIN_NAME', undefined, true),
    mailing: {
      adminMailTemplateId: envInt('MAIL_ADMIN_TEMPLATE_ID'),
      mailTemplateId: envString('MAIL_TEMPLATE_ID'),
    },
  };
}

export type ConfigType = ReturnType<typeof loadConfig>;

export default function config(): ConfigType {
  if (!configObject) {
    configObject = loadConfig();
  }

  return configObject;
}
