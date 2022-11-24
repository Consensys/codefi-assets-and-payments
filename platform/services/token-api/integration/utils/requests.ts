import {
  Commands,
  IBurnTokenCommand,
  IExecTokenCommand,
  IMintTokenCommand,
  ISetTokenURICommand,
} from '@consensys/messaging-events'
import { IDeployTokenCommand } from '@consensys/messaging-events/dist/messages/commands/DeployTokenCommand'
import { ITransferTokenCommand } from '@consensys/messaging-events/dist/messages/commands/TransferTokenCommand'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import Axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import {
  API_BASE_URL,
  DEV_TEST_WEB_CLIENT_ID,
  DEV_TEST_WEB_CLIENT_SECRET,
  DEV_CODEFI_API_AUDIENCE,
  AUTH0_DEV_BASE_URL,
  DEV_MAIN_CLIENT_ID,
  DEV_MAIN_CLIENT_SECRET,
  getOauthTokenAudience,
} from './configs'
import {
  TokensTransferRequest,
  TokensMintRequest,
  TokensDeployRequest,
  TokensBurnRequest,
  TokensExecRequest,
  TokensRegisterRequest,
  SetTokenURIRequest,
  TokenPaginatedResponse,
  TokenQueryRequest,
  TokenOperationQueryRequest,
  TokenOperationPaginatedResponse,
} from '@consensys/ts-types'
import { UserTokenService } from '@consensys/auth'
import { v4 as uuidv4 } from 'uuid'

export interface AxiosResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
  config: AxiosRequestConfig
  request?: any
}

const getAxiosInstance = (retryIfNotFound?: boolean) => {
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

export const getOperations = async (
  request: TokenOperationQueryRequest,
  authToken?: string,
): Promise<AxiosResponse<TokenOperationPaginatedResponse>> => {
  console.log('Sending request to retrieve operations', { ...request })

  const instance = getAxiosInstance()
  const config: AxiosRequestConfig = {
    headers: { Authorization: `Bearer ${authToken}` },
    params: request,
  }
  const resp = await instance.get(`${API_BASE_URL}/operations`, config)
  return resp
}

export const getTokens = async (
  request: TokenQueryRequest,
  authToken?: string,
): Promise<AxiosResponse<TokenPaginatedResponse>> => {
  console.log('Sending request to retrieve tokens', { ...request })

  const instance = getAxiosInstance()
  const config: AxiosRequestConfig = {
    headers: { Authorization: `Bearer ${authToken}` },
    params: request,
  }
  const resp = await instance.get(`${API_BASE_URL}/tokens`, config)
  return resp
}

export const deployTokenPost = async (
  tokenDeployRequest: TokensDeployRequest,
  authToken?: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to deploy token', { ...tokenDeployRequest })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const idempotencyKey = tokenDeployRequest.idempotencyKey || uuidv4()
  const resp = await instance.post(
    `${API_BASE_URL}/tokens`,
    { ...tokenDeployRequest, idempotencyKey },
    config,
  )
  return resp
}

export const deployTokenTokenCommand = async (
  producer: KafkaProducer,
  command: IDeployTokenCommand,
) => {
  console.log('Sending command to deploy token', { ...command })
  await producer.send(Commands.tokenDeployCommand, command)
}

export const registerTokenPost = async (
  tokenRegisterRequest: TokensRegisterRequest,
  authToken?: string,
): Promise<AxiosResponse<void>> => {
  console.log('Sending request to register token', { ...tokenRegisterRequest })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const resp = await instance.post(
    `${API_BASE_URL}/tokens/register`,
    tokenRegisterRequest,
    config,
  )
  return resp
}

export const transferTokenPut = async (
  tokenTransferRequest: TokensTransferRequest,
  tokenEntityId: string,
  authToken?: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to transfer token', {
    tokenEntityId,
    ...tokenTransferRequest,
  })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const idempotencyKey: string = tokenTransferRequest.idempotencyKey || uuidv4()
  const resp = await instance.put(
    `${API_BASE_URL}/tokens/${tokenEntityId}/transfer`,
    {
      ...tokenTransferRequest,
      idempotencyKey,
    },
    config,
  )
  return resp
}

export const transferTokenCommand = async (
  producer: KafkaProducer,
  command: ITransferTokenCommand,
) => {
  console.log('Sending command to transfer token', { ...command })
  await producer.send(Commands.transferTokenCommand, command)
}

export const mintTokenPut = async (
  tokenMintRequest: TokensMintRequest,
  tokenEntityId: string,
  authToken?: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to mint token', {
    tokenEntityId,
    ...tokenMintRequest,
  })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const idempotencyKey = tokenMintRequest.idempotencyKey || uuidv4()
  const resp = await instance.put(
    `${API_BASE_URL}/tokens/${tokenEntityId}/mint`,
    { ...tokenMintRequest, idempotencyKey },
    config,
  )
  return resp
}

export const mintTokenCommand = async (
  producer: KafkaProducer,
  command: IMintTokenCommand,
) => {
  console.log('Sending command to mint token', { ...command })
  await producer.send(Commands.tokenMintCommand, command)
}

export const burnTokenPut = async (
  tokenBurnRequest: TokensBurnRequest,
  tokenEntityId: string,
  authToken?: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to burn token', {
    tokenEntityId,
    ...tokenBurnRequest,
  })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const idempotencyKey = tokenBurnRequest.idempotencyKey || uuidv4()
  const resp = await instance.put(
    `${API_BASE_URL}/tokens/${tokenEntityId}/burn`,
    { ...tokenBurnRequest, idempotencyKey },
    config,
  )
  return resp
}

export const burnTokenCommand = async (
  producer: KafkaProducer,
  command: IBurnTokenCommand,
) => {
  console.log('Sending command to burn token', { ...command })
  await producer.send(Commands.burnTokenCommand, command)
}

export const healthCheck = async (
  retry?: boolean,
): Promise<AxiosResponse<any>> => {
  const instance = getAxiosInstance(retry)
  const resp = await instance.get(`${API_BASE_URL}`)
  return resp
}

export const execTokenPost = async (
  tokenExecRequest: TokensExecRequest,
  tokenEntityId: string,
  authToken: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to execute method on token', {
    tokenEntityId,
    ...tokenExecRequest,
  })

  const instance = getAxiosInstance()
  const idempotencyKey: string = tokenExecRequest.idempotencyKey || uuidv4()
  const resp = await instance.put(
    `${API_BASE_URL}/tokens/${tokenEntityId}/exec`,
    {
      ...tokenExecRequest,
      idempotencyKey,
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    },
  )
  return resp
}

export const execTokenCommand = async (
  producer: KafkaProducer,
  command: IExecTokenCommand,
) => {
  console.log('Sending command to execute method on token', { ...command })
  await producer.send(Commands.execTokenCommand, command)
}

export const setTokenURIPut = async (
  setTokenURIRequest: SetTokenURIRequest,
  tokenEntityId: string,
  authToken?: string,
): Promise<AxiosResponse<string>> => {
  console.log('Sending request to set token URI', {
    tokenEntityId,
    ...setTokenURIRequest,
  })

  const instance = getAxiosInstance()
  const config = {} as any
  config.headers = { Authorization: `Bearer ${authToken}` }
  const idempotencyKey: string = setTokenURIRequest.idempotencyKey || uuidv4()

  const resp = await instance.put(
    `${API_BASE_URL}/tokens/${tokenEntityId}/setTokenURI`,
    {
      ...setTokenURIRequest,
      idempotencyKey,
    },
    config,
  )

  return resp
}

export const setTokenURICommand = async (
  producer: KafkaProducer,
  command: ISetTokenURICommand,
) => {
  console.log('Sending command to set token URI', { ...command })
  await producer.send(Commands.setTokenURICommand, command)
}

// TODO BGC Remove this once functionality is transferred to jwtTokens.ts
export const createUserAuthToken = async (
  userAuthTokenService: UserTokenService,
  username: string,
  password: string,
): Promise<string> => {
  const userAuthToken: string = await userAuthTokenService.createUserToken(
    DEV_TEST_WEB_CLIENT_ID, // clientId
    DEV_TEST_WEB_CLIENT_SECRET, // clientSecret
    DEV_CODEFI_API_AUDIENCE, // audience
    username,
    password,
  )
  return userAuthToken
}
