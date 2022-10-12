require('dotenv').config()
import {
  apiPost,
  createClientPost,
  clientGrantPost,
  apiGetScopes,
} from './utils/requests'
import {
  validCreateApiRequest,
  validCreateClientRequest,
  invalidCreateClientRequest,
  validClientGrantRequest,
} from '../test/mocks'
import {
  createTokenWithoutPermissions,
  createTokenWithPermissions,
  getAccessToken,
} from './utils/jwt'
import {
  deleteApi,
  deleteClient,
  getAuth0ManagementClient,
} from './utils/cleanups'
import { CreateApiRequest } from '../src/requests/ResourceServerApiRequest'
import { ManagementClient } from 'auth0'

const apis: CreateApiRequest[] = []
const clientIds = []

jest.setTimeout(600000)

describe('resourceServerApi', () => {
  let auth0Client: ManagementClient

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()
  })

  it('should register an API - success', async () => {
    const token = await createTokenWithPermissions()
    // 1) create new client
    const response1 = await createClientPost(validCreateClientRequest, token)
    expect(response1.status).toBe(201)
    clientIds.push(response1.data.clientId)
    // 2) create new api
    const apiReq: CreateApiRequest = validCreateApiRequest('res')
    const response2 = await apiPost(apiReq, token)
    apis.push(apiReq)
    expect(response2.status).toBe(201)
    expect(response2.data.name).toEqual(apiReq.name)
    expect(response2.data.identifier).toEqual(apiReq.identifier)
    expect(response2.data.scopes).toEqual(apiReq.scopes)
    expect(response2.data.token_lifetime).toEqual(apiReq.token_lifetime)
    // 3) grant client api access
    const permissions = ['write:client']
    const validClientGrantReq = await validClientGrantRequest(
      permissions,
      response1.data.clientId,
      apiReq.identifier,
    )
    const response = await clientGrantPost(validClientGrantReq, token)
    expect(response.status).toBe(201)
    // 4) call create client endpoint from client with that granted scope, should have access 422 means we reached it
    const tokenNewClient = await getAccessToken({
      clientId: response1.data.clientId,
      clientSecret: response1.data.clientSecret,
      audience: apiReq.identifier,
      useCache: false,
    })
    await expect(
      createClientPost(invalidCreateClientRequest, tokenNewClient),
    ).rejects.toHaveProperty(['response', 'status'], 422)
  })

  it('should throw conflict - 409', async () => {
    const token = await createTokenWithPermissions()
    const validCreateApiReq = validCreateApiRequest('res')
    await apiPost(validCreateApiReq, token)
    apis.push(validCreateApiReq)
    await expect(apiPost(validCreateApiReq, token)).rejects.toHaveProperty(
      ['response', 'status'],
      409,
    )
  })

  it('/api not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await apiPost(validCreateApiRequest('res'), token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('GET /api scopes for a specific api', async () => {
    const token = await createTokenWithPermissions()
    const apiReq: CreateApiRequest = validCreateApiRequest('res')
    const createdApiResponse = await apiPost(apiReq, token)
    apis.push(apiReq)
    const getScopesResponse = await apiGetScopes(
      createdApiResponse.data.id,
      token,
    )
    expect(getScopesResponse.data).toMatchObject(apiReq.scopes)
  })

  it('GET /api scopes no permissions, fails', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await apiGetScopes('id', token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  afterAll(async () => {
    console.log('cleaning up started res')
    if (clientIds.length > 0) await deleteClient(auth0Client, clientIds)
    if (apis.length > 0) await deleteApi(auth0Client, apis)
    console.log('cleaning up started res')
  })
})
