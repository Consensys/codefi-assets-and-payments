import { CreateClientRequest } from '../src/requests/CreateClientRequest'
import { Client, ClientGrant, ResourceServer, Role } from 'auth0'
import { ClientResponse } from '../src/responses/ClientResponse'
import { ClientGrantRequest } from '../src/requests/ClientGrantRequest'
import { ClientGrantResponse } from '../src/responses/ClientGrantResponse'
import { CreateApiRequest } from '../src/requests/ResourceServerApiRequest'
import { CreateApiResponse } from '../src/responses/ResourceServerApiResponse'
import { InviteUserByEmailRequest } from '../src/requests/InviteUserByEmailRequest'
import {
  IClientCreateCommand,
  IUserCreateCommand,
  IUserCreatedEvent,
  IUserUpdatedEvent,
} from '@codefi-assets-and-payments/messaging-events'
import {
  DEV_MAIN_CLIENT_ID,
  DEV_ADMIN_AUDIENCE,
} from '../integration/utils/configs'
import { generateRandomText } from '../integration/utils/randomGenerator'
import { CreateRoleRequest } from '../src/requests/CreateRoleRequest'
import { RolePermissionRequest } from '../src/requests/RolePermissionRequest'
import { UserCreatedResponse } from '../src/responses/UserCreatedResponse'
import { DECODED_TOKEN_HEADER } from '../src/utils/jwtUtils'
import cfg from '../src/config'
import { Request } from 'express'
import { CreateUserRequest } from '../src/requests/CreateUserRequest'
import { ProductsEnum } from '@codefi-assets-and-payments/ts-types'
import { UpdateUserRequest } from '../src/requests/UpdateUserRequest'
import codefiScopes from '../src/config/permissions/codefi.json'
import orchestrateScopes from '../src/config/permissions/orchestrate.json'
import assetsScopes from '../src/config/permissions/assets.json'
import paymentsScopes from '../src/config/permissions/payments.json'
import codefiRoles from '../src/config/roles/codefi.json'
import assetsRoles from '../src/config/roles/assets.json'
import paymentsRoles from '../src/config/roles/payments.json'
import { joinNestedLists } from '../src/utils/utils'
import { ConfiguredPermission } from '../src/config/types/ConfiguredRole'

export const tenantIdMock = 'tenantId1'

export const entityIdMock = 'entityId1'

export const productMock = ProductsEnum.assets

export const connectionMock = 'connectionMocked'

export const passwordMock = 'passwordMocked'

export const rolesMock = ['roleMocked']

export const validCreateClientRequest: CreateClientRequest = {
  name: 'integration_test_app',
  description: 'test_some_description',
  appType: 'non_interactive',
  clientMetadata: { mock_metadata: 'mocked' },
  callbacks: ['http://localhost'],
  allowedLogoutUrls: ['http://localhost/logout'],
  webOrigins: ['http://localhost'],
  isEmailOnly: false,
  grantTypes: ['password', 'authorization_code', 'client_credentials'],
  sso: false,
}

export const invalidCreateClientRequest = {
  description: 'test_some_description',
  app_type: 'non_interactive',
}

export const validExampleParam = 'someparam'
export const mockJwtAccessToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik4wSXdNRE13'
export const mockAddress = '0x5d2FD0EFb594179D3B772640f8dA975871e460d2'
export const mockContractAddress = '0x32A9daeD647a8CC42FfBAd1498BC32074b0ae0A8'
export const mockAmount = 100
export const mockTotalSupply = 100
export const mockDecimals = 1
export const mockTokenName = 'TestToken'
export const mockTokenSymbol = 'LOL'
export const mockTokenId = 99
export const mockErrorMessage = 'BOOM'
export const mockUuid = '09a55c2c-b501-403a-8a9f-7e2a00071ca5'
export const mockHash =
  '0xe92cf3a32c4fad2ff266367298aa4f3d0c618d346cb97b4abac37f3c6b4c9715'
export const mockNetworkId = 6969
export const subjectMock = 'RYTOqc1V1Ncpl7666UDr9NsTTJtpzr8a@clients'

export const mockUserId = 'auth0|5e8378a5e2204c0c0a8f1928'
export const mockUserEmail = 'mock@mock.com'

export const transactionMock = {
  hash: mockHash,
  from: mockAddress,
  to: mockContractAddress,
  gas: 1,
  gasPrice: 10,
  value: 0,
  chainId: 9,
}

export const transactionReceiptMock = {
  transactionHash: mockHash,
  transactionIndex: 1,
  contractAddress: mockContractAddress,
  status: true,
  blockHash: mockHash,
  blockNumber: 1,
  gasUsed: 100,
}

export const orchestrateTransactionMock = {
  id: mockUuid,
}

export const authRegisterRequestMock = {
  context: {},
  secretToken: '',
  user: {
    user_id: 'user_id',
    email: 'email@mail.com',
    name: 'name',
  },
}

export const clientSecretMock = '8je27e3h9'

export const transactionEnvelopeMock = {
  envelope: {
    chain: {
      id: 'chainId',
    },
    from: {
      raw: 'fromRaw',
    },
    tx: {
      hash: {
        raw: 'txHashRaw',
      },
      tx_data: {
        gas: '1',
        gas_price: {
          raw: '1',
        },
      },
    },
  },
  status_info: {
    storedAt: 1,
  },
}

export const clientMock: Client = {
  client_id: 'client_id_mock',
  client_secret: 'client_secret_mock',
  name: 'app_name',
  description: 'some_description',
  app_type: 'app_type',
  client_metadata: { mock_metadata: 'mocked' },
  logo_uri: 'test',
  callbacks: [],
  allowed_logout_urls: [],
  grant_types: [],
  jwt_configuration: {},
  sso: true,
  initiate_login_uri: '',
}

export const hookSecretsMock = {
  key: 'value',
}

export const getAllClientsMock: Client[] = [
  clientMock,
  { ...clientMock, name: 'second_client' },
]

export const createHookResponseMock = {
  id: mockUuid,
  name: 'name',
}

export const clientIdMock = 'client_id_mock'

export const createClientResponseMock: ClientResponse = {
  clientId: clientIdMock,
  clientSecret: 'client_secret_mock',
  name: 'app_name',
  description: 'some_description',
  appType: 'app_type',
  clientMetadata: { mock_metadata: 'mocked' },
  logoUri: 'test',
  callbacks: [],
  allowedLogoutUrls: [],
  grantTypes: [],
  jwtConfiguration: {},
  sso: true,
  initiateLoginUri: '',
}

export const getClientResponseMock = createClientResponseMock

export const getAllClientsResponseMock: ClientResponse[] = [
  createClientResponseMock,
  { ...createClientResponseMock, name: 'second_client' },
]

export const validConfig = {} as any
validConfig.headers = { Authorization: `Bearer ${mockJwtAccessToken}` }

export const validClientId = 'RYTOqc1V1Ncpl7666U'

export const validClientGrantRequest = async (
  scopes: string[] = ['read:api', 'write:api'],
  clientId: string = DEV_MAIN_CLIENT_ID,
  audience = undefined,
): Promise<ClientGrantRequest> => {
  return {
    client_id: clientId,
    audience: audience || DEV_ADMIN_AUDIENCE,
    scope: scopes,
  }
}

export const validClientGrantsMock = [
  {
    client_id: 'client1',
    audience: 'audience1',
    scopes: ['scope1'],
  },
  {
    client_id: 'client1',
    audience: 'audience2',
    scopes: ['scope2'],
  },
  {
    client_id: 'client2',
    audience: 'audience2',
    scopes: ['scope2'],
  },
  {
    client_id: 'client3',
    audience: 'audience3',
    scopes: ['scope3'],
  },
]

export const validCreateRoleRequest: CreateRoleRequest = {
  name: 'SomeRoleName',
  description: 'Some role description',
}

export const validRolePermissionRequest: RolePermissionRequest[] = [
  {
    permissionName: 'permissionName',
    resourceServerIdentifier: 'http://serverid',
  },
]

export const validClientGrantResponse: ClientGrantResponse = {
  id: 'AaiyAPdpYj8HJqRn4T5titww',
  client_id: DEV_MAIN_CLIENT_ID,
  audience: DEV_ADMIN_AUDIENCE,
  scope: ['read:api', 'write:api'],
}

export const validClientGrantMock: ClientGrant = {
  id: 'AaiyAPdpYj8HJqRn4T5titww',
}

export const validCreateApiRequest = (postfix = ''): CreateApiRequest => {
  const apiName = generateRandomText(7, 'test_api_', postfix)
  return {
    name: apiName,
    identifier: `https://${apiName}.codefi.tech/`,
    scopes: [
      {
        description: 'write',
        value: 'client',
      },
    ],
    token_lifetime: 60000,
    rbac: true,
  }
}

export const validResourceServerMock: ResourceServer = {
  id: mockUuid,
  name: 'mock Resource Server',
  identifier: 'https://api-sandbox.codefi.tech/',
  scopes: [
    {
      description: 'Read tokens',
      value: 'read:tokens',
    },
    {
      description: 'Create tokens',
      value: 'create:tokens',
    },
  ],
  token_lifetime: 3000,
  token_dialect: 'access_token_authz',
  skip_consent_for_verifiable_first_party_clients: false,
  enforce_policies: false,
}

export const validResourceServerApiMock: CreateApiResponse = {
  id: mockUuid,
  name: 'mock Resource Server',
  identifier: 'https://api-sandbox.codefi.tech/',
  scopes: [
    {
      description: 'Read tokens',
      value: 'read:tokens',
    },
    {
      description: 'Create tokens',
      value: 'create:tokens',
    },
  ],
  token_lifetime: 3000,
  token_dialect: 'access_token_authz',
  skip_consent_for_verifiable_first_party_clients: false,
  enforce_policies: false,
}

export const inviteUserRequestMock: InviteUserByEmailRequest = {
  email: 'email@mail.com',
  name: 'name',
  familyName: 'family',
}

export const createUserRequestMock: CreateUserRequest = {
  email: 'email@mail.com',
  name: 'name',
  familyName: 'family',
  password: 'test',
}

export const updateUserRequestMock: UpdateUserRequest = {
  appMetadata: {
    xxx: 'yyy',
  },
}

export const createdUserMock = {
  email: 'email@mail.com',
  name: 'UserName',
  user_id: 'ididididid',
  picture: 'http://picture.com/path.png',
  email_verified: true,
  app_metadata: {
    registered: true,
  },
  user_metadata: {},
}

export const retrievedUserMock = {
  ...createdUserMock,
  id: mockUserId,
}

export const updatedUserMock = {
  ...createdUserMock,
  app_metadata: {
    registered: true,
    xxx: 'yyy',
    [tenantIdMock]: {
      entityId: entityIdMock,
    },
    products: {
      [productMock]: true,
    },
  },
  user_metadata: {},
}

export const createdUserWithoutMetadataMock = {
  email: 'email@mail.com',
  name: 'UserName',
  user_id: 'ididididid',
  picture: 'http://picture.com/path.png',
  email_verified: true,
}

export const userCreatedEventMock: IUserCreatedEvent = {
  userMetadata: '{}',
  appMetadata: '{}',
  userId: 'userId',
  email: 'mail@mail.com',
  emailVerified: true,
  name: 'username',
  picture: 'http://picture.com/path.png',
}

export const userUpdatedEventMock: IUserUpdatedEvent = {
  userMetadata: '{}',
  appMetadata: '{}',
  userId: 'userId',
  email: 'mail@mail.com',
  emailVerified: true,
  name: 'username',
  picture: 'http://picture.com/path.png',
}

export const userCreatedResponseMock: UserCreatedResponse = {
  email: 'mail@mail.com',
  emailVerified: true,
  username: 'my name',
  phoneNumber: '01234',
  phoneVerified: false,
  userId: 'abc',
  createdAt: 'some date',
  appMetadata: {},
  userMetadata: {},
  picture: '',
  name: 'my name',
  nickname: 'mymy',
  givenName: 'my',
  familyName: 'name',
}

export const mockEmail = 'mock@codefi.net'

export const mockClientGrantId = 'cgr_4PpizWsdsfRxbg7F'

export const clientCreatedEventMock = {
  clientId: validClientId,
  clientSecret: clientSecretMock,
  name: 'mock-client-event',
  appType: 'non_interactive',
}

export const tenantCreatedEventMock = {
  tenantId: tenantIdMock,
  tenantName: 'tenant-name',
  createdBy: mockUuid,
  createdAt: 'mock-date',
}

export const tenantDeletedMock = {
  raw: undefined,
  affected: 1,
  generatedMaps: undefined,
}

export const decodedJwtTokenWithTenantId = (tenantId) => {
  const decodedToken = {}
  decodedToken[cfg().actions.jwtCustomNamespace] = {
    tenantId,
  }
  return decodedToken
}

export const requestHeadersWithToken = (decodedToken): Request => {
  const requestHeadersWithTenantId = {
    headers: {},
  }
  requestHeadersWithTenantId.headers[DECODED_TOKEN_HEADER] = decodedToken
  return requestHeadersWithTenantId as any
}

export const requestWithTenantId = requestHeadersWithToken({
  ...decodedJwtTokenWithTenantId(tenantIdMock),
  sub: subjectMock,
})

export const userCreateCommandMock: IUserCreateCommand = {
  name: 'user mocked',
  email: 'mock@mock.com',
  appMetadata: JSON.stringify({}),
  applicationClientId: null,
  emailVerified: false,
  connection: null,
  roles: null,
  password: null,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  product: ProductsEnum.payments,
}

export const clientCreateCommandMock: IClientCreateCommand = {
  name: 'TestClientName',
  description: 'TestDescription',
  appType: 'spa',
  isEmailOnly: false,
  clientMetadata: null,
  logoUri: null,
  callbacks: [],
  allowedLogoutUrls: [],
  webOrigins: [],
  allowedOrigins: [],
  grantTypes: ['password'],
  jwtConfiguration: null,
  sso: false,
  initiateLoginUri: null,
  tenantId: tenantIdMock,
  entityId: entityIdMock,
  product: ProductsEnum.assets,
}

export const userCreatedWithEntityAndTenantMock = {
  ...createdUserMock,
  user_id: mockUserId,
  app_metadata: {
    registered: true,
    tenantId: tenantIdMock,
    entityId: entityIdMock,
  },
}

let ind = 0
export const initialCodefiApiRoles: Role[] = [
  ...codefiRoles,
  ...assetsRoles,
  ...paymentsRoles,
].map((roleWithoutId) => {
  ind = ind + 1
  return {
    id: ind.toString(),
    ...roleWithoutId,
  }
})

export const formatPermission = (permission) => {
  return {
    permission_name: permission.value,
    description: permission.description,
  }
}

export const extractPermissionsFromRoles = (rolesArray) => {
  return rolesArray.reduce((acc, currentRole) => {
    if (currentRole?.permissions && currentRole?.permissions.length > 0) {
      currentRole?.permissions.map((currentPermission) => {
        acc.push(currentPermission)
      })
    }
    return acc
  }, [])
}

export const findPermissionsForRoles = (input) => {
  if (input?.id) {
    const targetedRole = (initialCodefiApiRoles as any[]).find(
      (role) => role.id === input?.id,
    )
    if (targetedRole?.permissions && targetedRole?.permissions.length > 0) {
      return targetedRole.permissions.map(formatPermission)
    } else {
      return []
    }
  } else {
    return []
  }
}

export const initialCodefiApiScopes: ConfiguredPermission[] = joinNestedLists(
  [codefiScopes, orchestrateScopes, assetsScopes, paymentsScopes],
  (permission) => permission.value,
)

export const resortScopes = (scopes) => {
  const scopeMap = new Map()
  scopes.map((scope) => {
    scopeMap.set(scope.value, scope)
  })
  const resortedScopes = []
  for (const scope of scopeMap.values()) {
    resortedScopes.push(scope)
  }
  return resortedScopes
}

export const permissionMock = (index: number) => ({
  value: `mock:permission${index}`,
  description: `Mock permission description ${index}`,
})

export const roleMock = (index: number, permissions: any[]) => ({
  name: `MockRole${index}`,
  description: `Mock role description ${index}`,
  permissions,
})

export const tenantRolesMock = ['testRole1', 'testRole2', 'testRole3']
export const domainMock = 'testdomain.com'
export const audienceMock = 'http://testdomain.com/api/'
export const limitMock = 47
export const skipMock = 12
export const countMock = 1234
