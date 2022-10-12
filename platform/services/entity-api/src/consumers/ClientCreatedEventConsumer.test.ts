import { IClientCreatedEvent } from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { ClientService } from '../services/ClientService'
import { entityIdMock, tenantIdMock } from '../../test/mocks'
import { ClientCreatedEventConsumer } from './ClientCreatedEventConsumer'

describe('ClientCreatedEventConsumer', () => {
  let consumer: ClientCreatedEventConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let clientServiceMock: jest.Mocked<ClientService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    clientServiceMock = createMockInstance(ClientService)
    consumer = new ClientCreatedEventConsumer(loggerMock, clientServiceMock)
  })

  describe('onMessage', () => {
    it('(OK) updates client status', async () => {
      const clientCreatedEvent = {
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        name: 'TestClinetName',
        clientId: 'TestClientId',
      } as IClientCreatedEvent

      await consumer.onMessage(clientCreatedEvent)

      expect(clientServiceMock.updateStatus).toHaveBeenCalledWith(
        clientCreatedEvent.tenantId,
        clientCreatedEvent.entityId,
        clientCreatedEvent.name,
        clientCreatedEvent.clientId,
      )
    })

    it('(FAIL) logs error when processing message throws', async () => {
      const clientCreatedEvent = {
        tenantId: tenantIdMock,
        name: 'TestClinetName',
        clientId: 'TestClientId',
      } as IClientCreatedEvent

      clientServiceMock.updateStatus.mockRejectedValueOnce(new Error())

      await consumer.onMessage(clientCreatedEvent)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
