import Axios, { AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import {
  API_BASE_URL,
  getOauthTokenAudience,
  DEV_MAIN_CLIENT_ID,
  DEV_MAIN_CLIENT_SECRET,
  AUTH0_DEV_BASE_URL,
  ORCHESTRATE_URL,
} from './configs'
import { KafkaProducer } from '@consensys/nestjs-messaging'
import { Events, IUserCreatedEvent } from '@consensys/messaging-events'
import { DeleteResult } from 'typeorm'
import {
  TenantResponse,
  TenantPaginatedResponse,
  TenantCreateRequest,
  TenantUpdateRequest,
  EntityResponse,
  EntityPaginatedResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
  WalletResponse,
  WalletPaginatedResponse,
  WalletCreateRequest,
  WalletUpdateRequest,
  TenantQueryRequest,
  EntityQueryRequest,
  WalletQueryRequest,
  EntityClientQueryRequest,
  EntityClientCreateRequest,
} from '@consensys/ts-types'

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

export const fetchTenant = async (tenantId: string, authToken: string) => {
  const instance = getAxiosInstance()
  return instance.get<TenantResponse>(
    `${API_BASE_URL}/tenant/${tenantId}`,
    composeHeaders(authToken),
  )
}

export const fetchTenants = async (
  params: Partial<TenantQueryRequest>,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<TenantPaginatedResponse>(`${API_BASE_URL}/tenant`, {
    ...composeHeaders(authToken),
    params,
  })
}

export const createTenant = async (
  request: TenantCreateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.post<TenantResponse>(
    `${API_BASE_URL}/tenant`,
    request,
    composeHeaders(authToken),
  )
}

export const updateTenant = async (
  tenantId: string,
  request: TenantUpdateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.put<TenantResponse>(
    `${API_BASE_URL}/tenant/${tenantId}`,
    request,
    composeHeaders(authToken),
  )
}

export const deleteTenant = async (tenantId: string, authToken: string) => {
  const instance = getAxiosInstance()
  return instance.delete<DeleteResult>(
    `${API_BASE_URL}/tenant/${tenantId}`,
    composeHeaders(authToken),
  )
}

export const fetchTenantClients = async (
  tenantId: string,
  params: EntityClientQueryRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<TenantPaginatedResponse>(
    `${API_BASE_URL}/tenant/${tenantId}/client`,
    {
      ...composeHeaders(authToken),
      params,
    },
  )
}

export const createTenantClient = async (
  tenantId: string,
  request: EntityClientCreateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.post<TenantResponse>(
    `${API_BASE_URL}/tenant/${tenantId}/client`,
    request,
    composeHeaders(authToken),
  )
}

export const fetchEntity = async (entityId: string, authToken: string) => {
  const instance = getAxiosInstance()
  return instance.get<EntityResponse>(
    `${API_BASE_URL}/entity/${entityId}`,
    composeHeaders(authToken),
  )
}

export const fetchEntities = async (
  params: Partial<EntityQueryRequest>,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<EntityPaginatedResponse>(`${API_BASE_URL}/entity`, {
    ...composeHeaders(authToken),
    params: {
      ...params,
      ...(params.metadata ? { metadata: JSON.stringify(params.metadata) } : {}),
      ...(params.metadataWithOptions
        ? { metadataWithOptions: JSON.stringify(params.metadataWithOptions) }
        : {}),
      ...(params.ids ? { ids: JSON.stringify(params.ids) } : {}),
    },
  })
}

export const createEntity = async (
  request: EntityCreateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.post<EntityResponse>(
    `${API_BASE_URL}/entity`,
    request,
    composeHeaders(authToken),
  )
}

export const updateEntity = async (
  entityId: string,
  request: EntityUpdateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.put<EntityResponse>(
    `${API_BASE_URL}/entity/${entityId}`,
    request,
    composeHeaders(authToken),
  )
}

export const deleteEntity = async (entityId: string, authToken: string) => {
  const instance = getAxiosInstance()
  return instance.delete<DeleteResult>(
    `${API_BASE_URL}/entity/${entityId}`,
    composeHeaders(authToken),
  )
}

export const fetchEntityClients = async (
  entityId: string,
  params: EntityClientQueryRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<TenantPaginatedResponse>(
    `${API_BASE_URL}/entity/${entityId}/client`,
    {
      ...composeHeaders(authToken),
      params,
    },
  )
}

export const createEntityClient = async (
  entityId: string,
  request: EntityClientCreateRequest,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.post<TenantResponse>(
    `${API_BASE_URL}/entity/${entityId}/client`,
    request,
    composeHeaders(authToken),
  )
}

export const fetchWallet = async (
  entityId: string,
  address: string,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<WalletResponse>(
    `${API_BASE_URL}/entity/${entityId}/wallet/${address}`,
    composeHeaders(authToken),
  )
}

export const fetchWallets = async (
  entityId: string,
  params: Partial<WalletQueryRequest>,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<WalletPaginatedResponse>(
    `${API_BASE_URL}/entity/${entityId}/wallet`,
    {
      ...composeHeaders(authToken),
      params,
    },
  )
}

export const createWallet = async (
  entityId: string,
  request: WalletCreateRequest,
  authToken: string,
  setAsDefault = false,
) => {
  const instance = getAxiosInstance()
  return instance.post<WalletResponse>(
    `${API_BASE_URL}/entity/${entityId}/wallet`,
    request,
    {
      ...composeHeaders(authToken),
      params: { setAsDefault },
    },
  )
}

export const updateWallet = async (
  entityId: string,
  address: string,
  request: WalletUpdateRequest,
  authToken: string,
  setAsDefault = false,
) => {
  const instance = getAxiosInstance()
  return instance.put<WalletResponse>(
    `${API_BASE_URL}/entity/${entityId}/wallet/${address}`,
    request,
    {
      ...composeHeaders(authToken),
      params: { setAsDefault },
    },
  )
}

export const deleteWallet = async (
  entityId: string,
  address: string,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.delete<WalletResponse>(
    `${API_BASE_URL}/entity/${entityId}/wallet/${address}`,
    composeHeaders(authToken),
  )
}

export const publishUserCreatedEvent = async (
  producer: KafkaProducer,
  event: IUserCreatedEvent,
) => {
  console.log(`===> USER CREATED (EVENT)  ===> ${JSON.stringify(event)}`)
  return producer.send(Events.userCreatedEvent, event)
}
interface OrchestrateAccount {
  alias?: string
  address: string
  publicKey: string
  compressedPublicKey: string
  tenantID: string
  active: boolean
  attributes?: object
  storeID?: string
  createdAt: Date
  updatedAt: Date
}

export const fetchOrchestrateAccount = async (
  address: string,
  authToken: string,
) => {
  const instance = getAxiosInstance()
  return instance.get<OrchestrateAccount>(
    `${ORCHESTRATE_URL}/accounts/${address}`,
    composeHeaders(authToken),
  )
}

const composeHeaders = (authToken: string) => ({
  headers: { Authorization: `Bearer ${authToken}` },
})
