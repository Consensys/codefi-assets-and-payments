export const API_BASE_URL: string =
  process.env.PIPELINE && process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL}/admin`
    : `http://localhost:3000`
export const DEV_MAIN_CLIENT_ID = ''
// This should be set as a Gitlab CI/CD masked variable
export const DEV_MAIN_CLIENT_SECRET = ''
const DEV_ADMIN_AUDIENCE = ''
const DEV_API_DEV_AUDIENCE = ''
export const DEV_API_MNGMT_AUDIENCE = ''
export const AUTH0_DEV_BASE_URL = ''

export const getOauthTokenAudience = (withScopes, apiManagmentAudience) => {
  if (apiManagmentAudience) {
    return DEV_API_MNGMT_AUDIENCE
  }

  return withScopes ? DEV_ADMIN_AUDIENCE : DEV_API_DEV_AUDIENCE
}
