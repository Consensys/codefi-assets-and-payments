import {
  validCreateClientRequest,
  createClientResponseMock,
  clientMock,
  getAllClientsMock,
  validClientId,
  getAllClientsResponseMock,
  tenantIdMock,
  entityIdMock,
  productMock,
  getClientResponseMock,
} from '../../test/mocks'
import createMockInstance from 'jest-create-mock-instance'
import { ClientService } from './ClientService'
import { Auth0Service } from './Auth0Service'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Auth0Exception } from '../errors/Auth0Exception'
import { ConfigConstants } from '../config/ConfigConstants'
import { EventsService } from './EventsService'

import * as pagination from '../utils/paginationUtils'

describe('ClientService', () => {
  let auth0ServiceMock: jest.Mocked<Auth0Service>
  let eventsServiceMock: jest.Mocked<EventsService>
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let service: ClientService
  let createClient: jest.Mock
  let updateTenantSettings: jest.Mock
  let getConnections: jest.Mock
  let updateConnection: jest.Mock
  let deleteClient: jest.Mock
  let getClient: jest.Mock
  let getClients: jest.Mock
  let updateClient: jest.Mock
  const paginationMock = jest.spyOn(pagination, 'getAllResultPaginated')

  beforeEach(() => {
    createClient = jest.fn((client) => {
      const response = {
        ...clientMock,
      }
      if (client?.client_metadata) {
        response.client_metadata = {
          ...clientMock.client_metadata,
          ...client.client_metadata,
        }
      }

      return response
    })
    updateTenantSettings = jest.fn()
    updateConnection = jest.fn()
    getConnections = jest.fn().mockImplementationOnce(() => [
      {
        name: ConfigConstants.EMAIL_INVITE_ONLY_CONNECTION_NAME,
        id: 'id',
        enabled_clients: [],
      },
    ])
    deleteClient = jest.fn()
    getClient = jest.fn(() => clientMock)
    getClients = jest.fn(() => getAllClientsMock)
    updateClient = jest.fn(() => clientMock)

    auth0ServiceMock = createMockInstance(Auth0Service)
    auth0ServiceMock.getManagementClient.mockImplementation(() => {
      return {
        createClient,
        updateTenantSettings,
        getConnections,
        updateConnection,
        deleteClient,
        getClient,
        getClients,
        updateClient,
      } as any
    })

    eventsServiceMock = createMockInstance(EventsService)
    loggerMock = createMockInstance(NestJSPinoLogger)
    service = new ClientService(loggerMock, auth0ServiceMock, eventsServiceMock)
  })

  describe('getAllClients', () => {
    it('success', async () => {
      const limitMock = 10
      const skipMock = 2

      const response = await service.getAllClients(limitMock, skipMock)

      expect(getClients).toHaveBeenCalledTimes(1)
      expect(getClients).toHaveBeenCalledWith({
        page: skipMock,
        per_page: limitMock,
      })

      expect(response).toEqual(getAllClientsResponseMock)
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })

    it('can filter by connection name', async () => {
      const connectionNameMock = 'testConnection'
      const clientIdMock1 = 'testClient1'
      const clientIdMock2 = 'testClient2'

      getConnections.mockReset()
      getConnections.mockImplementationOnce(() => [
        {
          name: connectionNameMock,
          enabled_clients: [
            undefined,
            undefined,
            undefined,
            clientIdMock1,
            clientIdMock2,
            undefined,
            undefined,
          ],
        },
      ])

      getClient.mockReset()
      getClient.mockImplementationOnce(() => clientMock)
      getClient.mockImplementationOnce(() => clientMock)

      const response = await service.getAllClients(2, 3, connectionNameMock)

      expect(getConnections).toHaveBeenCalledTimes(2)
      expect(getClient).toHaveBeenCalledTimes(2)
      expect(getClient).toHaveBeenCalledWith({ client_id: clientIdMock1 })
      expect(getClient).toHaveBeenCalledWith({ client_id: clientIdMock2 })

      expect(response).toEqual([getClientResponseMock, getClientResponseMock])

      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('getClient', () => {
    it('success', async () => {
      const response = await service.getClient(validClientId)

      expect(getClient).toHaveBeenCalledTimes(1)
      expect(getClient).toHaveBeenCalledWith({ client_id: validClientId })

      expect(response).toMatchObject(createClientResponseMock)
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteClient', () => {
    it('delete client by id - success', async () => {
      await service.deleteClientById(validClientId)
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })

    it('delete client by id - throws outside try/catch', async () => {
      auth0ServiceMock.getManagementClient.mockImplementationOnce(() => {
        throw new Error('boom!')
      })

      await expect(
        service.deleteClientById(validClientId),
      ).rejects.toMatchObject(Error('boom!'))
    })

    it('delete client by id - throws inside try/catch', async () => {
      deleteClient.mockImplementationOnce(() => {
        throw new Error('boom!')
      })

      await expect(
        service.deleteClientById(validClientId),
      ).rejects.toMatchObject({
        message: 'boom!',
      })
    })
  })

  describe('updateClient', () => {
    it('updateClient success', async () => {
      const response = await service.updateClient(
        {
          name: validCreateClientRequest.name,
          description: validCreateClientRequest.description,
          appType: '',
        },
        validClientId,
      )
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject(createClientResponseMock)
    })

    it('updateClient - throws inside try/catch', async () => {
      updateClient.mockImplementationOnce(() => {
        throw new Error('boom!')
      })

      await expect(
        service.updateClient(
          {
            name: validCreateClientRequest.name,
            description: validCreateClientRequest.description,
            appType: '',
          },
          validClientId,
        ),
      ).rejects.toMatchObject({
        message: 'boom!',
      })
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })

    it('updateClient - throws outside try/catch', async () => {
      auth0ServiceMock.getManagementClient.mockImplementationOnce(() => {
        throw new Error('boom!')
      })

      await expect(
        service.updateClient(
          {
            name: validCreateClientRequest.name,
            description: validCreateClientRequest.description,
            appType: '',
          },
          validClientId,
        ),
      ).rejects.toMatchObject(Error('boom!'))
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('createClient', () => {
    it('createClient success', async () => {
      const response = await service.createClient({
        name: validCreateClientRequest.name,
        description: validCreateClientRequest.description,
        appType: '',
      })
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject(createClientResponseMock)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledWith({
        clientId: response.clientId,
        clientSecret: response.clientSecret,
        name: response.name,
        appType: response.appType,
      })
    })

    it('createClient tenantId, entityId, product - success', async () => {
      const response = await service.createClient({
        name: validCreateClientRequest.name,
        description: validCreateClientRequest.description,
        appType: '',
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        product: productMock,
      })
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject({
        ...createClientResponseMock,
        clientMetadata: {
          ...createClientResponseMock.clientMetadata,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          [productMock]: 'true',
        },
      })
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledWith({
        clientId: response.clientId,
        clientSecret: response.clientSecret,
        name: response.name,
        appType: response.appType,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        product: productMock,
      })
    })

    it('createClient regular_web - success', async () => {
      const response = await service.createClient({
        name: validCreateClientRequest.name,
        description: validCreateClientRequest.description,
        appType: 'regular_web',
      })
      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(response).toMatchObject(createClientResponseMock)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledWith({
        clientId: response.clientId,
        clientSecret: response.clientSecret,
        name: response.name,
        appType: response.appType,
      })
    })

    it('createClient emailOnly - success', async () => {
      paginationMock.mockReset()
      paginationMock.mockImplementationOnce(getConnections)

      const response = await service.createClient(
        {
          name: validCreateClientRequest.name,
          description: validCreateClientRequest.description,
          appType: 'regular_web',
        },
        true,
      )

      expect(auth0ServiceMock.getManagementClient).toHaveBeenCalledTimes(1)
      expect(updateTenantSettings).toHaveBeenCalledTimes(2)
      expect(getConnections).toHaveBeenCalledTimes(1)
      expect(updateConnection).toHaveBeenCalledTimes(1)
      expect(response).toEqual(createClientResponseMock)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledTimes(1)
      expect(eventsServiceMock.emitClientCreatedEvent).toHaveBeenCalledWith({
        clientId: response.clientId,
        clientSecret: response.clientSecret,
        name: response.name,
        appType: response.appType,
      })
    })

    it('createClient emailOnly - no email connection - throw', async () => {
      getConnections.mockReset()
      getConnections.mockImplementationOnce(() => [])
      try {
        await service.createClient(
          {
            name: validCreateClientRequest.name,
            description: validCreateClientRequest.description,
            appType: 'regular_web',
          },
          true,
        )
      } catch (error) {
        expect(error.status).toBe(500)
      }
    })

    it('createClient emailOnly - bad params config - throws', async () => {
      await expect(
        service.createClient(
          {
            name: validCreateClientRequest.name,
            description: validCreateClientRequest.description,
            appType: 'non_interactive',
          },
          true,
        ),
      ).rejects.toThrowError(
        'a client cannot be non_interactive and e-mail only at the same time',
      )
    })

    it('createClient Throw, Conflict', async () => {
      auth0ServiceMock.getManagementClient.mockImplementationOnce(() => {
        throw new Auth0Exception({ message: 'resource_server_conflict' })
      })

      await expect(
        service.createClient({
          name: validCreateClientRequest.name,
          description: validCreateClientRequest.description,
          appType: '',
        }),
      ).rejects.toThrow(Auth0Exception)
    })

    it('if it fails sending kafka event it must revert and throw', async () => {
      eventsServiceMock.emitClientCreatedEvent.mockImplementationOnce(() => {
        throw new Error('boom!')
      })
      await expect(
        service.createClient({
          name: validCreateClientRequest.name,
          description: validCreateClientRequest.description,
          appType: '',
        }),
      ).rejects.toMatchObject({ message: 'boom!' })
      expect(deleteClient).toHaveBeenCalledTimes(1)
    })
  })
})
