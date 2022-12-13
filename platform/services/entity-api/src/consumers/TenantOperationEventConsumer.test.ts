import {
  ITenantOperationEvent,
  MessageDataOperation,
} from '@consensys/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { RecoveryService } from '../services/RecoveryService'
import { tenantIdMock } from '../../test/mocks'
import { TenantOperationEventConsumer } from './TenantOperationEventConsumer'
import { EntityNotFoundException } from '@consensys/error-handler'

describe('TenantOperationEventConsumer', () => {
  let consumer: TenantOperationEventConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let recoveryServiceMock: jest.Mocked<RecoveryService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    recoveryServiceMock = createMockInstance(RecoveryService)
    consumer = new TenantOperationEventConsumer(loggerMock, recoveryServiceMock)
  })

  describe('onMessage', () => {
    const tenantOperationEvent = {
      operation: MessageDataOperation.CREATE,
      tenantId: tenantIdMock,
    } as ITenantOperationEvent

    it('passes event to recovery service', async () => {
      await consumer.onMessage(tenantOperationEvent)

      expect(
        recoveryServiceMock.processTenantOperationEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        recoveryServiceMock.processTenantOperationEvent,
      ).toHaveBeenCalledWith(tenantOperationEvent)
    })

    it('logs error when message cannot be processed', async () => {
      recoveryServiceMock.processTenantOperationEvent.mockRejectedValueOnce(
        new Error(),
      )

      await consumer.onMessage(tenantOperationEvent)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('throws if error is tenant not found exception', async () => {
      recoveryServiceMock.processTenantOperationEvent.mockRejectedValueOnce(
        new EntityNotFoundException(undefined, undefined, undefined),
      )

      await expect(
        consumer.onMessage(tenantOperationEvent),
      ).rejects.toThrowError()
    })
  })
})
