import {
  IEntityOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { RecoveryService } from '../services/RecoveryService'
import { entityIdMock } from '../../test/mocks'
import { EntityOperationEventConsumer } from './EntityOperationEventConsumer'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'

describe('EntityOperationEventConsumer', () => {
  let consumer: EntityOperationEventConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let recoveryServiceMock: jest.Mocked<RecoveryService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    recoveryServiceMock = createMockInstance(RecoveryService)
    consumer = new EntityOperationEventConsumer(loggerMock, recoveryServiceMock)
  })

  describe('onMessage', () => {
    const entityOperationEvent = {
      operation: MessageDataOperation.CREATE,
      entityId: entityIdMock,
    } as IEntityOperationEvent

    it('passes event to recovery service', async () => {
      await consumer.onMessage(entityOperationEvent)

      expect(
        recoveryServiceMock.processEntityOperationEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        recoveryServiceMock.processEntityOperationEvent,
      ).toHaveBeenCalledWith(entityOperationEvent)
    })

    it('logs error when message cannot be processed', async () => {
      recoveryServiceMock.processEntityOperationEvent.mockRejectedValueOnce(
        new Error(),
      )

      await consumer.onMessage(entityOperationEvent)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('throws if error is entity not found exception', async () => {
      recoveryServiceMock.processEntityOperationEvent.mockRejectedValueOnce(
        new EntityNotFoundException(undefined, undefined, undefined),
      )

      await expect(
        consumer.onMessage(entityOperationEvent),
      ).rejects.toThrowError()
    })
  })
})
