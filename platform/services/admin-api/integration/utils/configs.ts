import cfg from '../../src/config'
import { ConfigConstants } from '../../src/config/ConfigConstants'

require('dotenv').config()

export const API_BASE_URL: string =
  process.env.PIPELINE && process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL}/admin-api`
    : `http://localhost:3000`

export const DEV_MAIN_CLIENT_ID: string = process.env.PIPELINE
  ? process.env.DEV_MAIN_CLIENT_ID
  : process.env.CLIENT_ID

export const DEV_MAIN_CLIENT_SECRET: string = process.env.PIPELINE
  ? process.env.DEV_MAIN_CLIENT_SECRET
  : process.env.CLIENT_SECRET

export const DEV_ADMIN_AUDIENCE = 'https://admin.codefi.network'
export const DEV_API_DEV_AUDIENCE =
  ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER
export const AUTH0_DEV_BASE_URL = `https://${cfg().auth0.tenantDomain}`
export const DEV_API_MNGMT_AUDIENCE = `https://${AUTH0_DEV_BASE_URL}/api/v2/`
