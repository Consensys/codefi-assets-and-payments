import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { DigitalCurrencyService } from '../services/DigitalCurrencyService'
import { OperationService } from '../services/OperationService'
import {
  asyncOperationResultEventMock,
  operationMock,
  operationPendingMock,
} from '../../test/mocks'
import { AsyncOperationResultConsumer } from './AsyncOperationResultConsumer'

import { EntityStatus } from '@consensys/ts-types'
import { EntityNotFoundException } from '@consensys/error-handler'
import { LocalErrorName } from '../LocalErrorNameEnum'

describe('AsyncOperationResultConsumer', () => {
  let consumer: AsyncOperationResultConsumer
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let digitalCurrencyServiceMock: jest.Mocked<DigitalCurrencyService>
  let operationServiceMock: jest.Mocked<OperationService>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    digitalCurrencyServiceMock = createMockInstance(DigitalCurrencyService)
    operationServiceMock = createMockInstance(OperationService)
    consumer = new AsyncOperationResultConsumer(
      loggerMock,
      operationServiceMock,
      digitalCurrencyServiceMock,
    )
  })

  describe('onMessage', () => {
    it('success', async () => {
      operationServiceMock.findOne.mockImplementationOnce(
        async () => operationPendingMock,
      )
      operationServiceMock.findOne.mockImplementation(async () => operationMock)
      await consumer.onMessage(asyncOperationResultEventMock)
      expect(
        digitalCurrencyServiceMock.updateByOperationId,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.updateByOperationId,
      ).toHaveBeenCalledWith(asyncOperationResultEventMock.operationId, {
        createdAt: expect.any(Date),
        status: EntityStatus.Confirmed,
        currencyEthereumAddress:
          asyncOperationResultEventMock.receipt.contractAddress,
      })
      expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.update).toHaveBeenCalledWith(
        {
          id: asyncOperationResultEventMock.operationId,
        },
        {
          createdAt: expect.any(Date),
          status: EntityStatus.Confirmed,
          digitalCurrencyAddress:
            asyncOperationResultEventMock.receipt.contractAddress,
          transactionHash: asyncOperationResultEventMock.transactionHash,
        },
      )
      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        1,
      )
      expect(digitalCurrencyServiceMock.computeOperation).toBeCalledWith(
        operationMock,
      )
    })

    it('success - operation already receive an event before', async () => {
      operationServiceMock.findOne.mockImplementation(async () => operationMock)
      await consumer.onMessage(asyncOperationResultEventMock)
      expect(
        digitalCurrencyServiceMock.updateByOperationId,
      ).toHaveBeenCalledTimes(0)

      expect(operationServiceMock.update).toHaveBeenCalledTimes(0)
      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        0,
      )
    })

    it('success - transaction fail', async () => {
      operationServiceMock.findOne.mockImplementation(
        async () => operationPendingMock,
      )
      await consumer.onMessage({
        ...asyncOperationResultEventMock,
        result: false,
      })

      expect(
        digitalCurrencyServiceMock.updateByOperationId,
      ).toHaveBeenCalledTimes(1)
      expect(
        digitalCurrencyServiceMock.updateByOperationId,
      ).toHaveBeenCalledWith(asyncOperationResultEventMock.operationId, {
        createdAt: expect.any(Date),
        status: EntityStatus.Failed,
        currencyEthereumAddress:
          asyncOperationResultEventMock.receipt.contractAddress,
      })
      expect(operationServiceMock.update).toHaveBeenCalledTimes(1)
      expect(operationServiceMock.update).toHaveBeenCalledWith(
        {
          id: asyncOperationResultEventMock.operationId,
        },
        {
          createdAt: expect.any(Date),
          status: EntityStatus.Failed,
          digitalCurrencyAddress:
            asyncOperationResultEventMock.receipt.contractAddress,
          transactionHash: asyncOperationResultEventMock.transactionHash,
        },
      )
      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        0,
      )
    })

    it('throws - fail to consume message', async () => {
      operationServiceMock.findOne.mockImplementationOnce(
        async () => operationPendingMock,
      )
      digitalCurrencyServiceMock.updateByOperationId.mockImplementationOnce(
        () => {
          throw new Error('boom')
        },
      )
      await expect(
        consumer.onMessage(asyncOperationResultEventMock),
      ).rejects.toThrowError()
      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        0,
      )
      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('throws - fail to consume message, generic error', async () => {
      operationServiceMock.findOne.mockImplementationOnce(async () => {
        throw new Error('boom')
      })
      await expect(
        consumer.onMessage(asyncOperationResultEventMock),
      ).rejects.toThrowError()
      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        0,
      )

      expect(loggerMock.error).toHaveBeenCalledTimes(1)
    })

    it('throws - fail to consume message, operation not found', async () => {
      operationServiceMock.findOne.mockImplementationOnce(async () => {
        throw new EntityNotFoundException(
          LocalErrorName.OperationNotFoundException,
          'Operation does not exist or it is not part of the tenant',
          {
            operationId: asyncOperationResultEventMock.operationId,
            tenantId: undefined,
          },
        )
      })

      await consumer.onMessage(asyncOperationResultEventMock)

      expect(digitalCurrencyServiceMock.computeOperation).toHaveBeenCalledTimes(
        0,
      )
      expect(loggerMock.warn).toHaveBeenCalledTimes(1)
    })
  })
})
