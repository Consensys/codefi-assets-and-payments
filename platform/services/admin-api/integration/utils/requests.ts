import { CreateClientRequest } from '../../src/requests/CreateClientRequest'
import {
  CreateApiRequest,
  Scope,
} from '../../src/requests/ResourceServerApiRequest'
import { AuthHookRegisterRequest } from '../../src/requests/AuthHookRegisterRequest'
import { ClientGrantRequest } from '../../src/requests/ClientGrantRequest'
import { API_BASE_URL } from './configs'
import { ClientResponse } from '../../src/responses/ClientResponse'
import { ClientGrantResponse } from '../../src/responses/ClientGrantResponse'
import { CreateApiResponse } from '../../src/responses/ResourceServerApiResponse'
import { User, ManagementClient } from 'auth0'
import { CreateRoleRequest } from '../../src/requests/CreateRoleRequest'
import { RolePermissionRequest } from '../../src/requests/RolePermissionRequest'
import { RolePermissionResponse } from '../../src/responses/RolePermissionResponse'
import { GetClientGrantResponse } from '../../src/responses/GetClientGrantResponse'
import { InviteUserByEmailRequest } from '../../src/requests/InviteUserByEmailRequest'
import { UserCreatedResponse } from '../../src/responses/UserCreatedResponse'
import { ClientGetAllResponse } from '../../src/responses/ClientGetAllResponse'
import { CreateUserRequest } from '../../src/requests/CreateUserRequest'
import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  Commands,
  IClientCreateCommand,
  IUserCreateCommand,
} from '@codefi-assets-and-payments/messaging-events'
import { UpdateUserRequest } from '../../src/requests/UpdateUserRequest'
import { UserUpdatedResponse } from '../../src/responses/UserUpdatedResponse'
import { AxiosResponse, RequestMethod, runRequest } from './httpRequest'
import { PaginatedUserResponse } from '../../src/responses/PaginatedUserResponse'

export const createClientPost = async (
  request: CreateClientRequest | {},
  jwtToken?: string,
): Promise<AxiosResponse<ClientResponse>> => {
  return runRequest(
    `${API_BASE_URL}/client`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const getClientById = async (
  id: string,
  jwtToken?: string,
): Promise<AxiosResponse<ClientResponse>> => {
  return runRequest(`${API_BASE_URL}/client/${id}`, RequestMethod.GET, jwtToken)
}

export const getAllClients = async (
  skip: number,
  limit: number,
  jwtToken?: string,
  connectionName?: string,
): Promise<AxiosResponse<ClientGetAllResponse>> => {
  let url = `${API_BASE_URL}/client`
  let args = []

  if (skip) args.push(`skip=${skip}`)
  if (limit) args.push(`limit=${limit}`)
  if (connectionName) args.push(`connection=${connectionName}`)

  if (args.length) {
    url += `?${args.join('&')}`
  }

  return runRequest(url, RequestMethod.GET, jwtToken)
}

export const getAllInfuraClients = async (
  skip: number,
  limit: number,
  jwtToken?: string,
): Promise<AxiosResponse<ClientGetAllResponse>> => {
  let url = `${API_BASE_URL}/infura`
  let args = []

  if (skip) args.push(`skip=${skip}`)
  if (limit) args.push(`limit=${limit}`)

  if (args.length) {
    url += `?${args.join('&')}`
  }

  return runRequest(url, RequestMethod.GET, jwtToken)
}

export const deleteClientRequest = async (id: string, jwtToken?: string) => {
  return runRequest(
    `${API_BASE_URL}/client/${id}`,
    RequestMethod.DELETE,
    jwtToken,
  )
}

export const updateClient = async (
  request: CreateClientRequest | {},
  clientId: string,
  jwtToken?: string,
): Promise<AxiosResponse<ClientResponse>> => {
  return runRequest(
    `${API_BASE_URL}/client/${clientId}`,
    RequestMethod.PUT,
    jwtToken,
    request,
  )
}

export const authRegistrationHookPost = async (
  request: AuthHookRegisterRequest,
  jwtToken?: string,
) => {
  return runRequest(
    `${API_BASE_URL}/auth/hook/register`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const clientGrantPost = async (
  request: ClientGrantRequest,
  jwtToken: string,
): Promise<AxiosResponse<ClientGrantResponse>> => {
  return runRequest(
    `${API_BASE_URL}/client-grant`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const clientGrantGet = async (
  query: string,
  jwtToken: string,
): Promise<AxiosResponse<GetClientGrantResponse>> => {
  return runRequest(
    `${API_BASE_URL}/client-grant?${query}`,
    RequestMethod.GET,
    jwtToken,
  )
}

export const apiPost = async (
  request: CreateApiRequest,
  jwtToken?: string,
): Promise<AxiosResponse<CreateApiResponse>> => {
  return runRequest(
    `${API_BASE_URL}/api`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const apiGetScopes = async (
  apiId?: string,
  jwtToken?: string,
): Promise<AxiosResponse<Scope[]>> => {
  let url = `${API_BASE_URL}/api`
  if (apiId) {
    url += `/${apiId}`
  }
  url += '/scopes'

  return runRequest(url, RequestMethod.GET, jwtToken)
}

export const userInvite = async (
  request: InviteUserByEmailRequest,
  jwtToken: string,
): Promise<AxiosResponse<UserCreatedResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user/invite`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const userCreate = async (
  request: CreateUserRequest,
  jwtToken: string,
): Promise<AxiosResponse<UserCreatedResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const getUser = async (
  userId: string,
  jwtToken: string,
): Promise<AxiosResponse<UserCreatedResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
    RequestMethod.GET,
    jwtToken,
  )
}

export const getUsersByEntity = async (
  tenantId: string,
  entityId: string,
  jwtToken: string,
): Promise<AxiosResponse<PaginatedUserResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user/tenant/${encodeURIComponent(
      tenantId,
    )}/entity/${encodeURIComponent(entityId)}`,
    RequestMethod.GET,
    jwtToken,
  )
}

export const updateUser = async (
  request: UpdateUserRequest,
  userId: string,
  jwtToken: string,
): Promise<AxiosResponse<UserUpdatedResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
    RequestMethod.PUT,
    jwtToken,
    request,
  )
}

export const deleteUser = async (
  userId: string,
  jwtToken: string,
): Promise<AxiosResponse<UserCreatedResponse>> => {
  return runRequest(
    `${API_BASE_URL}/user/${encodeURIComponent(userId)}`,
    RequestMethod.DELETE,
    jwtToken,
  )
}

export const clientGrantDelete = async (
  clientGrantId: string,
  jwtToken: string,
) => {
  return runRequest(
    `${API_BASE_URL}/client-grant/${clientGrantId}`,
    RequestMethod.DELETE,
    jwtToken,
  )
}

export const postRole = async (
  request: CreateRoleRequest,
  jwtToken: string,
) => {
  return runRequest(
    `${API_BASE_URL}/role`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const postAssignPermissionsToRole = async (
  roleId: string,
  request: RolePermissionRequest[],
  jwtToken: string,
) => {
  return runRequest(
    `${API_BASE_URL}/role/${roleId}/permissions`,
    RequestMethod.POST,
    jwtToken,
    request,
  )
}

export const deletePermissionsToRole = async (
  roleId: string,
  request: RolePermissionRequest[],
  jwtToken: string,
) => {
  return runRequest(
    `${API_BASE_URL}/role/${roleId}/permissions`,
    RequestMethod.DELETE,
    jwtToken,
    undefined,
    request,
  )
}

export const getAssignedPermissionsToRole = async (
  roleId: string,
  jwtToken: string,
): Promise<AxiosResponse<RolePermissionResponse[]>> => {
  return runRequest(
    `${API_BASE_URL}/role/${roleId}/permissions`,
    RequestMethod.GET,
    jwtToken,
  )
}

export const getRole = async (roleId: string, jwtToken: string) => {
  return runRequest(
    `${API_BASE_URL}/role/${roleId}`,
    RequestMethod.GET,
    jwtToken,
  )
}

export const healthCheck = async () => {
  return runRequest(`${API_BASE_URL}`, RequestMethod.GET)
}

export const createUser = async (
  client: ManagementClient,
  email: string,
  password: string,
): Promise<User<any, any>> => {
  const response = await client.createUser({
    connection: 'Username-Password-Authentication',
    email,
    password,
    user_metadata: {},
    email_verified: true,
    app_metadata: {},
  })
  return response
}

export const getUserAuth0 = async (
  client: ManagementClient,
  userId: string,
): Promise<User<any, any>> => {
  const result = await client.getUser({
    id: userId,
  })
  return result
}

export const deleteUserAuth0 = async (
  client: ManagementClient,
  userId: string,
) => {
  await client.deleteUser({
    id: userId,
  })
}

export const userCreateCommand = async (
  producer: KafkaProducer,
  command: IUserCreateCommand,
) => {
  console.log(
    `===> USER CREATE (COMMAND) ===> ${JSON.stringify(command || {})}`,
  )
  await producer.send(Commands.userCreateCommand, command)
}

export const clientCreateCommand = async (
  producer: KafkaProducer,
  command: IClientCreateCommand,
) => {
  console.log(
    `===> CLIENT CREATE (COMMAND) ===> ${JSON.stringify(command || {})}`,
  )
  await producer.send(Commands.clientCreateCommand, command)
}
