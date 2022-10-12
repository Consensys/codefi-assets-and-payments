import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import createMockInstance from 'jest-create-mock-instance'
import { ClientService } from '../services/ClientService'
import { InfuraController } from './InfuraController'
import { getClientResponseMock } from '../../test/mocks'
import { ConfigConstants } from '../config/ConfigConstants'

describe('InfuraController', () => {
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let controller: InfuraController
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    controller = new InfuraController(loggerMock, clientServiceMock)
  })

  describe('getAllInfuraClients', () => {
    it('success', async () => {
      const skip = 1
      const limit = 2

      clientServiceMock.getAllClients.mockImplementationOnce(async () => [
        getClientResponseMock,
        getClientResponseMock,
      ])

      const result = await controller.getAllInfuraClients(skip, limit)

      expect(clientServiceMock.getAllClients).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.getAllClients).toHaveBeenCalledWith(
        limit,
        skip,
        ConfigConstants.INFURA_CONNECTION_NAME,
      )

      const clientMockWithoutSecret = {
        ...getClientResponseMock,
        clientSecret: null,
      }

      expect(result).toMatchObject({
        count: 2,
        items: [clientMockWithoutSecret, clientMockWithoutSecret],
        skip,
        limit,
      })
    })
  })
})
