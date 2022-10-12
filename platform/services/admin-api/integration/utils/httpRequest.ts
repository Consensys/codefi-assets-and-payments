import Axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import { sleep } from '../../src/utils/sleep'

export interface AxiosResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: AxiosRequestConfig
  request?: any
}

export enum RequestMethod {
  GET,
  POST,
  PUT,
  DELETE
}

export const runRequest = async (
  url: string,
  method: RequestMethod,
  authToken?: string,
  request?: any,
  configData?: any,
): Promise<any> => {
  const instance = Axios.create()
  const headers = { ['Content-Type']: 'application/json' }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const config = { headers } as any

  if (configData) {
    config.data = configData
  }

  return await runRequestWithBetterError(async () => {
    return await runRequestWithRateLimitRetry(async () => {
      return method === RequestMethod.POST
        ? await instance.post(url, request, config)
        : method === RequestMethod.DELETE
        ? await instance.delete(url, config)
        : method === RequestMethod.PUT
        ? await instance.put(url, request, config)
        : await instance.get(url, config)
    })
  })
}

const runRequestWithRateLimitRetry = async (
  request: Function,
  maxRetries: number = 3,
): Promise<any> => {
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const response = await request()

      if (attempts > 0) {
        console.log('Retry successful')
      }

      return response
    } catch (error) {
      const responseString = JSON.stringify(error.response?.data)

      if (responseString && responseString.includes('Rate limit reached')) {
        const url = error.response?.config?.url
        const delay = Math.round(
          parseInt(responseString.match(/try again in (\d+) milliseconds/)[1]) *
            1.1,
        )

        console.log(
          `Rate limit reached after attempt ${attempts +
            1} against ${url}, sleeping for ${delay}ms then retrying...`,
        )

        await sleep(delay)
      } else {
        throw error
      }
    }
  }

  throw Error(`Continued to hit rate limit after ${maxRetries} attempts`)
}

const runRequestWithBetterError = async (request: Function): Promise<any> => {
  try {
    return await request()
  } catch (error) {
    const url = error.config?.url
    const detail =
      error.response?.data?.error_description || error.response?.data?.message

    if (!url && !detail) throw error

    let message = `${error.message}`

    if (detail) {
      message += ` - ${detail}`
    }

    if (url) {
      message += ` - ${url}`
    }

    const newError = new Error(message)
    const newErrorAny = newError as any
    newErrorAny.response = error.response

    throw newError
  }
}
