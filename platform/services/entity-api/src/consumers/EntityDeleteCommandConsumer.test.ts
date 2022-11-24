import { IEntityDeleteCommand } from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { entityIdMock, tenantIdMock } from '../../test/mocks'
import { EntityService } from '../services/EntityService'
import { EntityDeleteCommandConsumer } from './EntityDeleteCommandConsumer'

describe('EntityDeleteCommandConsumer', () => {
  let consumer: EntityDeleteCommandConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let entityServiceMock: jest.Mocked<EntityService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    entityServiceMock = createMockInstance(EntityService)

    consumer = new EntityDeleteCommandConsumer(loggerMock, entityServiceMock)
  })

  describe('onMessage', () => {
    const entityDeleteCommand: IEntityDeleteCommand = {
      tenantId: tenantIdMock,
      entityId: entityIdMock,
    }

    it('(OK) processes message', async () => {
      await consumer.onMessage(entityDeleteCommand)

      expect(entityServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(entityServiceMock.delete).toHaveBeenCalledWith(
        tenantIdMock,
        entityIdMock,
      )
    })

    it('(OK) logs error when message cannot be processed', async () => {
      entityServiceMock.delete.mockRejectedValueOnce(new Error())

      await consumer.onMessage(entityDeleteCommand)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })
  })
})
