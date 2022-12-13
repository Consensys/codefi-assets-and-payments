import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { clientCreateCommandMock } from '../../test/mocks'
import { ClientCreateCommandConsumer } from './ClientCreateCommandConsumer'
import { ClientService } from '../services/ClientService'

describe('ClientCreateCommandConsumer', () => {
  let consumer: ClientCreateCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    consumer = new ClientCreateCommandConsumer(loggerMock, clientServiceMock)
  })

  describe('onMessage', () => {
    it('(OK) invokes client service to create client', async () => {
      await consumer.onMessage(clientCreateCommandMock)

      expect(clientServiceMock.createClient).toHaveBeenCalledTimes(1)
      expect(clientServiceMock.createClient).toHaveBeenCalledWith(
        {
          ...clientCreateCommandMock,
          clientMetadata: {},
        },
        false,
      )
    })

    it('(FAIL) logs error when service fails', async () => {
      clientServiceMock.createClient.mockImplementationOnce(() => {
        throw new Error()
      })

      await consumer.onMessage(clientCreateCommandMock)
      expect(loggerMock.error).toHaveBeenCalledTimes(2)
    })
  })
})
