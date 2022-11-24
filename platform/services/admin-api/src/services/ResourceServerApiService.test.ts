import createMockInstance from 'jest-create-mock-instance'
import {
  validResourceServerMock,
  validCreateApiRequest,
  validResourceServerApiMock,
  mockUuid,
} from '../../test/mocks'
import { Auth0Service } from './Auth0Service'
import { ResourceServerApiService } from './ResourceServerApiService'
import { NestJSPinoLogger } from '@consensys/observability'
import { Auth0Exception } from '../errors/Auth0Exception'
import { ConfigConstants } from '../config/ConfigConstants'

describe('ResourceServerApiService', () => {
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let service: ResourceServerApiService
  let getManagementClient
  let createResourceServerMock: jest.Mock
  let getResourceServerMock: jest.Mock
  let getResourceServersMock: jest.Mock

  beforeEach(() => {
    createResourceServerMock = jest.fn(() => validResourceServerMock)
    getResourceServerMock = jest.fn()
    getResourceServersMock = jest.fn()
    getManagementClient = jest.fn().mockImplementation(() => {
      return { createResourceServer: createResourceServerMock }
    })

    const managementClientMock: any = {
      createResourceServer: createResourceServerMock,
      getResourceServer: getResourceServerMock,
      getResourceServers: getResourceServersMock,
    }

    loggerMock = createMockInstance(NestJSPinoLogger)
    auth0ServiceMock = createMockInstance(Auth0Service)
    auth0ServiceMock.getManagementClient.mockImplementation(
      () => managementClientMock,
    )

    service = new ResourceServerApiService(loggerMock, auth0ServiceMock)
  })

  describe('createResourceServiceApi', () => {
    it('createResourceServiceApi success', async () => {
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClient,
      )
      const validCreateApiReq = validCreateApiRequest()
      const response = await service.createApi(
        validCreateApiReq.name,
        validCreateApiReq.identifier,
        validCreateApiReq.scopes,
        validCreateApiReq.token_lifetime,
        validCreateApiReq.rbac,
      )
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toEqual(validResourceServerApiMock)
    })

    it('createResourceServiceApi Throw, Not Found', async () => {
      getManagementClient = jest.fn().mockImplementationOnce(() => {
        throw new Auth0Exception({ message: 'Not Found' })
      })
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClient,
      )
      const validCreateApiReq = validCreateApiRequest()
      await expect(
        service.createApi(
          validCreateApiReq.name,
          validCreateApiReq.identifier,
          validCreateApiReq.scopes,
          validCreateApiReq.token_lifetime,
          validCreateApiReq.rbac,
        ),
      ).rejects.toThrow(Auth0Exception)
    })

    it('createResourceServiceApi Throw, Conflict', async () => {
      getManagementClient = jest.fn().mockImplementationOnce(() => {
        throw new Auth0Exception({ message: 'resource_server_conflict' })
      })
      auth0ServiceMock.getManagementClient.mockImplementationOnce(
        getManagementClient,
      )
      const validCreateApiReq = validCreateApiRequest()
      await expect(
        service.createApi(
          validCreateApiReq.name,
          validCreateApiReq.identifier,
          validCreateApiReq.scopes,
          validCreateApiReq.token_lifetime,
          true,
        ),
      ).rejects.toThrow(Auth0Exception)
    })
  })

  describe('getResourceServerScopes', () => {
    it('success - using param', async () => {
      getResourceServerMock.mockImplementationOnce(
        () => validResourceServerMock,
      )
      const response = await service.getResourceServerScopes(mockUuid)
      expect(getResourceServerMock).toHaveBeenCalledTimes(1)
      expect(getResourceServerMock).toHaveBeenCalledWith({ id: mockUuid })
      expect(response).toMatchObject(validResourceServerMock.scopes)
    })

    it('not found - using param', async () => {
      getResourceServerMock.mockImplementationOnce(() => undefined)
      await expect(
        service.getResourceServerScopes(mockUuid),
      ).rejects.toThrowError(`Resource server not found`)
    })

    it('success - not using param - codefiapi present', async () => {
      getResourceServersMock.mockImplementationOnce(() => {
        return [
          {
            ...validResourceServerMock,
            identifier: ConfigConstants.CODEFI_API_RESOURCE_SERVER_IDENTIFIER,
          },
        ]
      })
      const response = await service.getResourceServerScopes()
      expect(getResourceServersMock).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject(validResourceServerMock.scopes)
    })

    it('success - not using param - adminapi present', async () => {
      getResourceServersMock.mockImplementationOnce(() => {
        return [
          {
            ...validResourceServerMock,
            identifier: ConfigConstants.ADMIN_API_RESOURCE_SERVER_IDENTIFIER,
          },
        ]
      })
      const response = await service.getResourceServerScopes()
      expect(getResourceServersMock).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject(validResourceServerMock.scopes)
    })

    it('success - no default apis present - empty', async () => {
      getResourceServersMock.mockImplementationOnce(() => [])
      const response = await service.getResourceServerScopes()
      expect(getResourceServersMock).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject([])
    })
  })
})
