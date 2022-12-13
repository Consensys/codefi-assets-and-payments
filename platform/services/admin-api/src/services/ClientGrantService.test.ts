import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import {
  mockClientGrantId,
  validClientGrantMock,
  validClientGrantRequest,
  validClientGrantResponse,
  validClientGrantsMock,
} from '../../test/mocks'
import { Auth0Exception } from '../errors/Auth0Exception'
import { Auth0Service } from './Auth0Service'
import { ClientGrantService } from './ClientGrantService'

import * as pagination from '../utils/paginationUtils'

describe('ClientGrantService', () => {
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let service: ClientGrantService
  let getManagementClientMock: any
  let createClientGrantMock: jest.Mock
  let deleteClientGrantByIdMock: jest.Mock
  let getClientGrantsMock: jest.Mock
  const paginationMock = jest.spyOn(pagination, 'getAllResultPaginated')

  beforeEach(() => {
    createClientGrantMock = jest.fn(() => validClientGrantMock)
    deleteClientGrantByIdMock = jest.fn()
    getClientGrantsMock = jest
      .fn()
      .mockImplementationOnce(() => validClientGrantsMock)
    getManagementClientMock = {
      createClientGrant: createClientGrantMock,
      deleteClientGrant: deleteClientGrantByIdMock,
      getClientGrants: getClientGrantsMock,
    }

    auth0ServiceMock = createMockInstance(Auth0Service)
    auth0ServiceMock.getManagementClient.mockImplementation(
      () => getManagementClientMock,
    )
    loggerMock = createMockInstance(NestJSPinoLogger)

    paginationMock.mockImplementation(getClientGrantsMock)

    service = new ClientGrantService(loggerMock, auth0ServiceMock)
  })

  describe('create client grant', () => {
    it('clientGrant success', async () => {
      const validClientGrantReq = await validClientGrantRequest([
        'read:api',
        'write:api',
      ])
      const response = await service.clientGrant(
        validClientGrantReq.client_id,
        validClientGrantReq.audience,
        validClientGrantReq.scope,
      )
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toEqual(validClientGrantResponse)
    })

    it('clientGrant Throw, Not Found', async () => {
      getManagementClientMock = jest.fn().mockImplementationOnce(() => {
        throw new Auth0Exception({ message: 'Not Found' })
      })
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClientMock,
      )
      const validClientGrantReq = await validClientGrantRequest([
        'read:api',
        'write:api',
      ])
      await expect(
        service.clientGrant(
          validClientGrantReq.client_id,
          validClientGrantReq.audience,
          validClientGrantReq.scope,
        ),
      ).rejects.toThrow(Auth0Exception)
    })

    it('clientGrant Throw, Conflict', async () => {
      getManagementClientMock = jest.fn().mockImplementationOnce(() => {
        throw new Auth0Exception({ message: 'resource_server_conflict' })
      })
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClientMock,
      )
      const validClientGrantReq = await validClientGrantRequest([
        'read:api',
        'write:api',
      ])
      await expect(
        service.clientGrant(
          validClientGrantReq.client_id,
          validClientGrantReq.audience,
          validClientGrantReq.scope,
        ),
      ).rejects.toThrow(Auth0Exception)
    })
  })

  describe('delete client grant by id', () => {
    it('success', async () => {
      await service.deleteClientGrantById(mockClientGrantId)
      expect(deleteClientGrantByIdMock).toHaveBeenCalledTimes(1)
      expect(deleteClientGrantByIdMock).toHaveBeenCalledWith({
        id: mockClientGrantId,
      })
    })

    it('deleteClientGrant Throw', async () => {
      getManagementClientMock.deleteClientGrantByIdMock = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Auth0Exception({ message: 'Boom' })
        })
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClientMock,
      )
      await expect(
        service.deleteClientGrantById(mockClientGrantId),
      ).rejects.toThrow(Auth0Exception)
    })
  })

  describe('getClientGrant', () => {
    it('success - without filters', async () => {
      const response = await service.getClientGrant()
      expect(response.grants.length).toBe(validClientGrantsMock.length)
      expect(getClientGrantsMock).toHaveBeenCalledTimes(1)
    })

    it('success - clientId filter', async () => {
      const response = await service.getClientGrant(
        validClientGrantsMock[0].client_id,
      )
      expect(response.grants.length).toBe(2)
      expect(response.grants[0].clientId).toBe(
        validClientGrantsMock[0].client_id,
      )
      expect(response.grants[1].clientId).toBe(
        validClientGrantsMock[0].client_id,
      )
    })

    it('success - audience filter', async () => {
      const response = await service.getClientGrant(
        undefined,
        validClientGrantsMock[0].audience,
      )
      expect(response.grants.length).toBe(1)
      expect(response.grants[0].audience).toBe(
        validClientGrantsMock[0].audience,
      )
    })

    it('error', async () => {
      getClientGrantsMock.mockReset()
      getClientGrantsMock.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.getClientGrant()).rejects.toThrow(Auth0Exception)
    })
  })
})
