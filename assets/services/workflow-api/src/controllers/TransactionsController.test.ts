import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { TransactionsController } from './TransactionsController'
import { TransactionsService } from '../services/TransactionsService'
import {
  mockIdentityQuery,
  mockId,
  mockField,
  mockValue,
  validFirstTransactionRequest,
  validFirstTransactionResponse,
  validFirstUpdatedTransactionRequest,
} from '../../test/mocks'

describe('TransactionsController', () => {
  let logger: NestJSPinoLogger
  let serviceMock: jest.Mocked<TransactionsService>
  let controller: TransactionsController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    serviceMock = createMockInstance(TransactionsService)
    controller = new TransactionsController(serviceMock, logger)
  })

  describe('create', () => {
    it('success', async () => {
      serviceMock.create.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      await controller.create(mockIdentityQuery, validFirstTransactionRequest)
      expect(serviceMock.create).toBeCalledTimes(1)
      expect(serviceMock.create).toBeCalledWith(
        mockIdentityQuery.tenantId,
        validFirstTransactionRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
    })

    it('failure', async () => {
      serviceMock.create.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.create(mockIdentityQuery, validFirstTransactionRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    it('success', async () => {
      await controller.find(mockIdentityQuery, mockId, mockField, mockValue)
      expect(serviceMock.find).toBeCalledTimes(1)
      expect(serviceMock.find).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        mockField,
        mockValue,
      )
    })

    it('failure', async () => {
      serviceMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.find(mockIdentityQuery, mockId, mockField, mockValue),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      await controller.update(
        mockIdentityQuery,
        mockId,
        validFirstUpdatedTransactionRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(serviceMock.update).toBeCalledTimes(1)
      expect(serviceMock.update).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        validFirstUpdatedTransactionRequest,
      )
    })

    it('failure', async () => {
      serviceMock.update.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.update(
          mockIdentityQuery,
          mockId,
          validFirstUpdatedTransactionRequest,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      await controller.delete(mockIdentityQuery, mockId)
      expect(serviceMock.delete).toHaveBeenCalledTimes(1)
      expect(serviceMock.delete).toHaveBeenCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
      )
    })

    it('failure', async () => {
      serviceMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.delete(mockIdentityQuery, mockId),
      ).rejects.toThrowError('boom')
    })
  })
})
