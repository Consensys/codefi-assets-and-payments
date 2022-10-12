export const DEV_ADMIN_AUDIENCE = 'https://api.codefi.network'
export const DEV_CODEFI_API_AUDIENCE = 'https://api.codefi.network'
export const DEV_API_DEV_AUDIENCE = 'https://api-dev.codefi.tech/'
export const DEV_API_MNGMT_AUDIENCE = process.env.AUTH0_URL + 'api/v2/'
export const AUTH0_DEV_BASE_URL = process.env.AUTH0_URL
export const INTEGRATION_TEST = process.env.INTEGRATION_TEST === 'true'
export const PIPELINE = process.env.PIPELINE === 'true'

export const API_BASE_URL: string =
  PIPELINE && process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL}/token`
    : `http://localhost:3000`

export const DEV_MAIN_CLIENT_ID = PIPELINE
  ? process.env.DEV_MAIN_CLIENT_ID
  : process.env.CLIENT_ID

// This should be set as a Gitlab CI/CD masked variable
export const DEV_MAIN_CLIENT_SECRET = PIPELINE
  ? process.env.DEV_MAIN_CLIENT_SECRET
  : process.env.CLIENT_SECRET

export const DEV_TEST_WEB_CLIENT_ID: string = PIPELINE
  ? process.env.DEV_TEST_WEB_CLIENT_ID
  : process.env.WEB_CLIENT_ID

export const DEV_TEST_WEB_CLIENT_SECRET: string = PIPELINE
  ? process.env.DEV_TEST_WEB_CLIENT_SECRET
  : process.env.WEB_CLIENT_SECRET

export const INTEGRATION_TEST_USER_PASSWORD: string =
  process.env.INTEGRATION_TEST_USER_PASSWORD

export const getOauthTokenAudience = (withScopes, apiManagementAudience) => {
  if (apiManagementAudience) {
    return DEV_API_MNGMT_AUDIENCE
  }

  return withScopes ? DEV_ADMIN_AUDIENCE : DEV_API_DEV_AUDIENCE
}
