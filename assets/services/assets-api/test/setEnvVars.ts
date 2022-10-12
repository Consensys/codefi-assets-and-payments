import dotenv from 'dotenv';
dotenv.config({ path: './test/.test.functional.env' });

process.env.REDIS_PASS = 'does_not_matter';
process.env.REDIS_HOST = process.env.REDIS_HOST_CI || 'localhost';

process.env.DEFAULT_CONFIG = 'codefi';
process.env.DEFAULT_KYC_TEMPLATE_NAME = 'Codefi demo template';
process.env.CERTIFICATE_SIGNER_PRIVATE_KEY =
  '0x1f3a0644470aec2cffec1cfe380b26ec82275642bd9307fec63588255317b5d2';
process.env.HOLD_NOTARY_PRIVATE_KEY =
  '0x1f3a0644470aec2cffec1cfe380b26ec82275642bd9307fec63588255317b5d2';
process.env.HTLC_SECRET_ENCRYPTION_KEY = '0123456789abcdefghijklmnopqrstuv'; // key must be 32 characters long
process.env.FUNDER_ADDRESS = '0xf24339a4451510a461563F5044260B22D6dadeAD';
process.env.ADMIN_API = 'https://convergence-dev.api.codefi.network/admin';
process.env.APP_URL = 'https://assets-paris-dev.codefi.network';
process.env.DEFAULT_DOCUSIGN_ID = '989db668-ad57-4100-ac51-e6d39a9f7568';
process.env.DEFAULT_INITIALIZATION_TENANT_ID = '';
process.env.LOCAL_ORCHESTRATE = 'false';
process.env.SMART_CONTRACT_API =
  'https://assets-paris-dev.codefi.network/api/smart-contract';
process.env.ENTITY_API = 'https://convergence-dev.api.codefi.network/entity';
process.env.METADATA_API =
  'https://assets-paris-dev.codefi.network/api/metadata';
// Authentication
process.env.AUTH0_URL = 'https://codefi.eu.auth0.com/';

process.env.KYC_API = 'https://assets-paris-dev.codefi.network/api/kyc4';
process.env.WORKFLOW_API =
  'https://assets-paris-dev.codefi.network/api/workflow';
process.env.COFI_DOCS_API =
  'https://assets-paris-dev.codefi.network/api/cofidocs/api/cofidocs';
process.env.MAILING_API_HOST =
  'https://convergence-dev.api.codefi.network/mailing';
process.env.LEGAL_API = 'https://assets-paris-dev.codefi.network/api/legal';
process.env.ENABLE_PLATFORM_ACCESS_FOR_NEW_INVESTORS = 'true';
process.env.ENABLE_PLATFORM_ACCESS_FOR_NEW_ISSUERS = 'true';
process.env.EXTERNAL_STORAGE_API =
  'https://convergence-dev.api.codefi.network/external-storage';

// Access token verification
process.env.AUTH_BYPASS_AUTHENTICATION_CHECK = 'true';
process.env.AUTH_BYPASS_PERMISSION_CHECK = 'true';
process.env.AUTH_ACCEPTED_AUDIENCE = 'https://api.codefi.network';
process.env.AUTH_CUSTOM_NAMESPACE = 'https://api.codefi.network';
process.env.AUTH_CUSTOM_ORCHESTRATE_NAMESPACE =
  'https://api.orchestrate.network';

process.env.M2M_TOKEN_ADMIN_CLIENT_ID = 'RYTOqc1V1Ncpl7666UDr9NsTTJtpzr8a';
process.env.M2M_TOKEN_ADMIN_AUDIENCE = 'https://admin.codefi.network';

process.env.ENTITY_API_ENABLED = 'true';
process.env.ENTITY_API = 'https://convergence-dev.api.codefi.network/entity';

// Access token creation
process.env.M2M_TOKEN_REDIS_ENABLE = 'false';
process.env.M2M_TOKEN_REDIS_HOST = 'redis-auth.dev.api.codefi.network';
process.env.M2M_TOKEN_REDIS_PASS = 'xxx';
process.env.M2M_TOKEN_CLIENT_ID = 'wcUQzTEURU7SccK7nal7T1DuJtBZ7XEU';
process.env.M2M_TOKEN_AUDIENCE = 'https://api.codefi.network';

if (process.env.RECORD) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dotenv.config({ path: '.env' });
} else {
  process.env.M2M_TOKEN_ADMIN_CLIENT_SECRET = 'xxx';
  process.env.M2M_TOKEN_CLIENT_SECRET = 'xxx';
  process.env.DEFAULT_PASSWORD = 'xxx-xxx';
}

process.env.ORCHESTRATE_URL = 'mockUrl';
process.env.ORCHESTRATE_KAFKA_URL = 'mockUrl';

process.env.MAIL_TEMPLATE_ID = '11111';
process.env.MAIL_ADMIN_TEMPLATE_ID = '22222';
