import Axios, { AxiosRequestConfig } from 'axios'
import { SendRequest } from '../../src/requests/SendRequest'
import axiosRetry from 'axios-retry'
import {
  API_BASE_URL,
  getOauthTokenAudience,
  DEV_MAIN_CLIENT_ID,
  DEV_MAIN_CLIENT_SECRET,
  AUTH0_DEV_BASE_URL,
} from './configs'

export interface AxiosResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: AxiosRequestConfig
  request?: any
}

const getAxiosInstance = (retryIfNotFound?: boolean): any => {
  const instance = Axios.create()
  if (retryIfNotFound) {
    axiosRetry(instance, {
      retries: 60,
      retryDelay: () => {
        return 1000
      },
      retryCondition: (error) => {
        return error.response.status === 404
      },
    })
  }
  return instance
}

export const get = async (
  url: string,
  retry?: boolean,
): Promise<AxiosResponse<any>> => {
  const instance = getAxiosInstance(retry)
  return instance.get(url)
}

export const hello = async (retry?: boolean) => {
  const instance = getAxiosInstance(retry)
  const resp = await instance.get(`${API_BASE_URL}/`)
  return resp
}

export const examplePost = async (
  request: SendRequest,
  param: string,
  retry?: boolean,
): Promise<AxiosResponse<any>> => {
  const instance = getAxiosInstance(retry)
  const resp = await instance.post(`${API_BASE_URL}/example/${param}`, request)
  return resp
}

export const exampleGet = async (token): Promise<AxiosResponse<any>> => {
  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${token}` }
  const resp = await instance.get(`${API_BASE_URL}/example`, config)
  return resp
}

export const healthCheck = async (
  retry?: boolean,
): Promise<AxiosResponse<any>> => {
  const instance = getAxiosInstance(retry)
  const resp = await instance.get(`${API_BASE_URL}`)
  return resp
}

export const createOauthToken = async (
  withScopes = true,
  apiManagmentAudience = false,
  retry?: boolean,
): Promise<string> => {
  const instance = getAxiosInstance(retry)
  const config = {} as any
  config.headers = { [`Content-Type`]: `application/json` }
  const payload = {
    grant_type: 'client_credentials',
    audience: getOauthTokenAudience(withScopes, apiManagmentAudience),
    client_id: DEV_MAIN_CLIENT_ID,
    client_secret: DEV_MAIN_CLIENT_SECRET,
  }

  const resp = await instance.post(
    `${AUTH0_DEV_BASE_URL}/oauth/token`,
    payload,
    config,
  )
  return resp.data.access_token
}
