export const API_BASE_URL: string =
  process.env.PIPELINE && process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL}/entity`
    : `http://localhost:3000`
export const ORCHESTRATE_URL: string = process.env.ORCHESTRATE_URL
export const DEV_MAIN_CLIENT_ID = process.env.PIPELINE
  ? process.env.DEV_MAIN_CLIENT_ID
  : process.env.CLIENT_ID
// This should be set as a Gitlab CI/CD masked variable
export const DEV_MAIN_CLIENT_SECRET = process.env.PIPELINE
  ? process.env.DEV_MAIN_CLIENT_SECRET
  : process.env.CLIENT_SECRET
export const DEV_ADMIN_AUDIENCE = 'https://api.codefi.network'

export const DEV_CODEFI_API_AUDIENCE = 'https://api.codefi.network'
export const DEV_API_DEV_AUDIENCE = 'https://api-dev.codefi.tech/'
export const DEV_API_MNGMT_AUDIENCE = process.env.AUTH0_URL + 'api/v2/'
export const AUTH0_DEV_BASE_URL = process.env.AUTH0_URL
export const DEV_TEST_WEB_CLIENT_ID: string = process.env.PIPELINE
  ? process.env.DEV_TEST_WEB_CLIENT_ID
  : process.env.WEB_CLIENT_ID
export const DEV_TEST_WEB_CLIENT_SECRET: string = process.env.PIPELINE
  ? process.env.DEV_TEST_WEB_CLIENT_SECRET
  : process.env.WEB_CLIENT_SECRET
export const INTEGRATION_TEST_USER_PASSWORD = process.env
  .INTEGRATION_TEST_USER_PASSWORD as string

export const getOauthTokenAudience = (withScopes, apiManagmentAudience) => {
  if (apiManagmentAudience) {
    return DEV_API_MNGMT_AUDIENCE
  }

  return withScopes ? DEV_ADMIN_AUDIENCE : DEV_API_DEV_AUDIENCE
}
