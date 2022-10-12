// Mock Redis client
jest.mock('ioredis');

process.env.AUTH0_URL = 'https://codefi.eu.auth0.com/';

// Access token verification
// Those variables need to be defined to pass integration
// tests in Token-API, in order to run 'createUserToken'
// function in testing module.
process.env.AUTH_BYPASS_AUTHENTICATION_CHECK = 'false';
process.env.AUTH_BYPASS_PERMISSION_CHECK = 'false';
process.env.AUTH_ACCEPTED_AUDIENCE = 'https://api.codefi.network';
process.env.AUTH_CUSTOM_NAMESPACE = 'https://api.codefi.network';

// Access token creation
process.env.M2M_TOKEN_REDIS_ENABLE = 'true';
process.env.M2M_TOKEN_REDIS_HOST = 'mock';
process.env.M2M_TOKEN_REDIS_PASS = 'mock';
process.env.M2M_TOKEN_CLIENT_ID = 'mock';
process.env.M2M_TOKEN_CLIENT_SECRET = 'mock';
process.env.M2M_TOKEN_AUDIENCE = 'mock';
