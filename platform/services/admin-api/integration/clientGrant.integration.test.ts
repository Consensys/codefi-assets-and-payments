import { clientGrantPost, createClientPost, clientGrantDelete, clientGrantGet } from './utils/requests'
import { validClientGrantRequest, validCreateClientRequest } from '../test/mocks'
import { createTokenWithoutPermissions, createTokenWithPermissions, getAccessToken } from './utils/jwt'
import { decodeFullToken } from '../src/utils/jwtUtils'
import { deleteClient, getAuth0ManagementClient } from './utils/cleanups'
import { Auth0Exception } from '../src/errors/Auth0Exception'
import { ManagementClient } from 'auth0';

require('dotenv').config()

jest.setTimeout(600000)

const clientIds = []

describe('client-grant', () => {
  let auth0Client: ManagementClient

  beforeAll(async () => {
    auth0Client = await getAuth0ManagementClient()
  })

  it('should grant scopes - success', async () => {
    // arrange
    const token = await createTokenWithPermissions()
    const permissions = ['read:api', 'write:api']
    const newClient = await createClientPost(validCreateClientRequest, token)
    clientIds.push(newClient.data.clientId)

    // act
    const validClientGrantReq = await validClientGrantRequest(permissions, newClient.data.clientId)
    const response = await clientGrantPost(validClientGrantReq, token)

    //assert
    expect(response.status).toBe(201)
    expect(response.data.id).toBeDefined()
    expect(response.data.client_id).toEqual(validClientGrantReq.client_id)
    expect(response.data.audience).toEqual(validClientGrantReq.audience)
    expect(response.data.scope).toEqual(validClientGrantReq.scope)

    //assert jwt has right scopes in it
    const tokenNewClient = await getAccessToken({
      clientId: newClient.data.clientId,
      clientSecret: newClient.data.clientSecret,
      useCache: false
    })
    const decodedToken = decodeFullToken(tokenNewClient)
    expect(decodedToken.permissions).toEqual(expect.arrayContaining(permissions))
    expect(decodedToken.sub).toContain(newClient.data.clientId)
  })

  it('create /clientGrant not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      const validClientGrantReq = await validClientGrantRequest()
      await clientGrantPost(validClientGrantReq, token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('should throw conflict - 409 when client already existing', async () => {
    const token = await createTokenWithPermissions()
    const error = new Auth0Exception('Request failed with status code 409')
    const validClientGrantReq = await validClientGrantRequest()
    await expect(clientGrantPost(validClientGrantReq, token)).rejects.toHaveProperty(['response', 'status'], 409)
  })

  it('should delete grant scopes - success', async () => {
    // arrange
    const token = await createTokenWithPermissions()
    const newClient = await createClientPost(validCreateClientRequest, token)
    clientIds.push(newClient.data.clientId)
    const validClientGrantReq = await validClientGrantRequest(['read:api'], newClient.data.clientId)

    const response = await clientGrantPost(validClientGrantReq, token)
    expect(response.status).toBe(201)
    expect(response.data.id).toBeDefined()
    // act
    const response2 = await clientGrantDelete(response.data.id, token)
    //assert
    expect(response2.status).toBe(204)
    //assert client lost granted access to api
    try {
      await getAccessToken({
        clientId: newClient.data.clientId,
        clientSecret: newClient.data.clientSecret,
        useCache: false
      })
      fail('Should not reach this')
    } catch (e) {
      expect(e.response.status).toEqual(403)
      expect(e.response.data.error_description).toContain(
        `Client is not authorized to access "${validClientGrantReq.audience}". You need to create a \"client-grant\" associated to this API. See: https://auth0.com/docs/api/v2#!/Client_Grants/post_client_grants`,
      )
    }
  })

  it('should throw - 400', async () => {
    const token = await createTokenWithPermissions()
    const error = new Auth0Exception('Request failed with status code 400')
    await expect(clientGrantDelete('non-existent', token)).rejects.toHaveProperty(['response', 'status'], 400)
  })

  it('delete /clientGrant not enough permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      const validClientGrantReq = await validClientGrantRequest()
      await clientGrantDelete(validClientGrantReq.client_id, token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('get client grants no permissions should fail', async () => {
    const token = await createTokenWithoutPermissions()
    try {
      await clientGrantGet('', token)
      fail('Should not reach this line')
    } catch (error) {
      expect(error.response.status).toBe(403)
    }
  })

  it('get client grants for a client_id', async () => {
    // arrange
    const token = await createTokenWithPermissions()
    const newClient = await createClientPost(validCreateClientRequest, token)
    clientIds.push(newClient.data.clientId)
    const validClientGrantReq = await validClientGrantRequest(['read:api'], newClient.data.clientId)

    const response = await clientGrantPost(validClientGrantReq, token)
    expect(response.status).toBe(201)
    expect(response.data.id).toBeDefined()
    // act
    const clientGrantsResponse = await clientGrantGet(`clientId=${newClient.data.clientId}`, token)
    //assert
    expect(clientGrantsResponse.data.grants.length).toBe(1)
    expect(clientGrantsResponse.data.grants[0].clientId).toBe(newClient.data.clientId)
  })

  afterAll(async () => {
    if (clientIds.length > 0) { await deleteClient(auth0Client, clientIds) }
  })
})
