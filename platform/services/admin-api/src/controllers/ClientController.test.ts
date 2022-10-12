import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import {
  connectionMock,
  getClientResponseMock,
  validClientId,
  validCreateClientRequest,
} from '../../test/mocks'
import { ClientService } from '../services/ClientService'
import { ClientController } from './ClientController'

describe('ClientController', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let controller: ClientController
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    controller = new ClientController(loggerMock, clientServiceMock)
  })

  describe('create a client', () => {
    it('should create a regular client - success', async () => {
      await controller.createClient({
        ...validCreateClientRequest,
        clientMetadata: null,
      })
      expect(clientServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.createClient).toHaveBeenCalledWith(
        {
          ...validCreateClientRequest,
          clientMetadata: null,
        },
        false,
      )
    })

    it('should create client with metadata - success', async () => {
      await controller.createClient(validCreateClientRequest)
      expect(clientServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.createClient).toHaveBeenCalledWith(
        validCreateClientRequest,
        false,
      )
    })
  })

  describe('get by id', () => {
    it('should get a regular client - success', async () => {
      await controller.getClient(validClientId)
      expect(clientServiceMock.getClient).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getClient).toHaveBeenCalledWith(validClientId)
    })
  })

  describe('get all clients', () => {
    it('success', async () => {
      const skip = 1
      const limit = 2
      const connectionName = connectionMock

      clientServiceMock.getAllClients.mockImplementationOnce(async () => [
        getClientResponseMock,
        getClientResponseMock,
      ])

      const result = await controller.getAllClients(skip, limit, connectionName)

      expect(clientServiceMock.getAllClients).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getAllClients).toHaveBeenCalledWith(
        limit,
        skip,
        connectionName,
      )

      expect(result).toMatchObject({
        count: 2,
        items: [getClientResponseMock, getClientResponseMock],
        skip: skip,
        limit: limit,
      })
    })
  })

  describe('delete client by id', () => {
    it('success', async () => {
      await controller.deleteClientById(validClientId)
      expect(clientServiceMock.deleteClientById).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.deleteClientById).toHaveBeenCalledWith(
        validClientId,
      )
    })

    it('fails', async () => {
      clientServiceMock.deleteClientById.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.deleteClientById(validClientId),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update client', () => {
    it('success', async () => {
      await controller.updateClient(validCreateClientRequest, validClientId)
      expect(clientServiceMock.updateClient).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.updateClient).toHaveBeenCalledWith(
        validCreateClientRequest,
        validClientId,
      )
    })

    it('fails', async () => {
      clientServiceMock.updateClient.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.updateClient(validCreateClientRequest, validClientId),
      ).rejects.toThrowError('boom')
    })
  })
})
