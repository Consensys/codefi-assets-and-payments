import {
  IWalletOperationEvent,
  MessageDataOperation,
} from '@codefi-assets-and-payments/messaging-events'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { RecoveryService } from '../services/RecoveryService'
import { WalletOperationEventConsumer } from './WalletOperationEventConsumer'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { walletAddressMock } from '../../test/mocks'

describe('WalletOperationEventConsumer', () => {
  let consumer: WalletOperationEventConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let recoveryServiceMock: jest.Mocked<RecoveryService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    recoveryServiceMock = createMockInstance(RecoveryService)
    consumer = new WalletOperationEventConsumer(loggerMock, recoveryServiceMock)
  })

  describe('onMessage', () => {
    const walletOperationEvent = {
      operation: MessageDataOperation.CREATE,
      address: walletAddressMock,
    } as IWalletOperationEvent

    it('passes event to recovery service', async () => {
      await consumer.onMessage(walletOperationEvent)

      expect(
        recoveryServiceMock.processWalletOperationEvent,
      ).toHaveBeenCalledTimes(1)

      expect(
        recoveryServiceMock.processWalletOperationEvent,
      ).toHaveBeenCalledWith(walletOperationEvent)
    })

    it('logs error when message cannot be processed', async () => {
      recoveryServiceMock.processWalletOperationEvent.mockRejectedValueOnce(
        new Error(),
      )

      await consumer.onMessage(walletOperationEvent)

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('throws if error is wallet not found exception', async () => {
      recoveryServiceMock.processWalletOperationEvent.mockRejectedValueOnce(
        new EntityNotFoundException(undefined, undefined, undefined),
      )

      await expect(
        consumer.onMessage(walletOperationEvent),
      ).rejects.toThrowError()
    })
  })
})
