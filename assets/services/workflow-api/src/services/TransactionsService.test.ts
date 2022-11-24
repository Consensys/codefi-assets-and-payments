import createMockInstance from 'jest-create-mock-instance'
import { Repository } from 'typeorm'

import { TransactionsService } from './TransactionsService'
import {
  mockField,
  mockValue,
  mockId,
  mockTenantId,
  validFirstTransactionRequest,
  validFirstTransactionResponse,
  validFirstUpdatedTransactionResponse,
  validFirstUpdatedTransactionRequest,
  validDeleteResponse,
} from '../../test/mocks'
import { NestJSPinoLogger } from '@consensys/observability'

describe('TransactionsService', () => {
  let repositoryMock: jest.Mocked<Repository<any>>
  let logger: jest.Mocked<NestJSPinoLogger>
  let service: TransactionsService

  beforeEach(async () => {
    repositoryMock = createMockInstance(Repository)
    logger = createMockInstance(NestJSPinoLogger)
    service = new TransactionsService(repositoryMock, logger)
  })

  describe('create', () => {
    it('success', async () => {
      repositoryMock.find.mockImplementationOnce(async () => [])
      repositoryMock.save.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )

      await service.create(mockTenantId, validFirstTransactionRequest)
      expect(repositoryMock.save).toBeCalledTimes(1)
      expect(repositoryMock.save).toBeCalledWith({
        ...validFirstTransactionRequest,
        tenantId: mockTenantId,
      })
    })

    it('failure', async () => {
      repositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validFirstTransactionRequest),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      repositoryMock.find.mockImplementationOnce(async () => [])
      repositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validFirstTransactionRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    describe('success', () => {
      beforeEach(async () => {
        repositoryMock.find.mockImplementationOnce(async () => [
          validFirstTransactionResponse,
        ])
      })
      it('success - with ID', async () => {
        await service.find(mockTenantId, mockId, undefined, undefined)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId, id: mockId },
          order: { createdAt: 'DESC' },
        })
      })

      it('success - with field+value', async () => {
        await service.find(mockTenantId, undefined, mockField, mockValue)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId, [mockField]: mockValue },
          order: { createdAt: 'DESC' },
        })
      })

      it('success - all', async () => {
        await service.find(mockTenantId, undefined, undefined, undefined)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId },
          order: { createdAt: 'DESC' },
        })
      })
    })

    it('failure', async () => {
      repositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.findOne(mockTenantId, mockId, undefined, undefined),
      ).rejects.toThrowError('boom')
    })
  })

  describe('findOne', () => {
    describe('success', () => {
      beforeEach(async () => {
        repositoryMock.find.mockImplementationOnce(async () => [
          validFirstTransactionResponse,
        ])
      })
      it('success - with ID', async () => {
        await service.findOne(mockTenantId, mockId, undefined, undefined)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId, id: mockId },
          order: { createdAt: 'DESC' },
        })
      })

      it('success - with field+value', async () => {
        await service.findOne(mockTenantId, undefined, mockField, mockValue)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId, [mockField]: mockValue },
          order: { createdAt: 'DESC' },
        })
      })

      it('success - all', async () => {
        await service.findOne(mockTenantId, undefined, undefined, undefined)
        expect(repositoryMock.find).toBeCalledTimes(1)
        expect(repositoryMock.find).toBeCalledWith({
          where: { tenantId: mockTenantId },
          order: { createdAt: 'DESC' },
        })
      })
    })

    it('failure', async () => {
      repositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.findOne(mockTenantId, mockId, undefined, undefined),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      repositoryMock.find.mockImplementationOnce(async () => [
        validFirstTransactionResponse,
      ])
      repositoryMock.save.mockImplementationOnce(
        async () => validFirstUpdatedTransactionResponse,
      )

      await service.update(
        mockTenantId,
        mockId,
        validFirstUpdatedTransactionRequest,
      )
      expect(repositoryMock.save).toBeCalledTimes(1)
      expect(repositoryMock.save).toBeCalledWith({
        ...validFirstUpdatedTransactionRequest,
        id: mockId,
      })
    })

    it('failure', async () => {
      repositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedTransactionRequest,
        ),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      repositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedTransactionRequest,
        ),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      repositoryMock.find.mockImplementationOnce(async () => [
        validFirstTransactionResponse,
      ])
      repositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedTransactionRequest,
        ),
      ).rejects.toThrowError('Http Exception')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      repositoryMock.delete.mockImplementationOnce(
        async () => validDeleteResponse,
      )
      await service.delete(mockTenantId, mockId)
      expect(repositoryMock.delete).toBeCalledTimes(1)
      expect(repositoryMock.delete).toBeCalledWith(mockId)
    })

    it('failure - boom', async () => {
      repositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
    it('failure - boom', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransactionResponse,
      )
      repositoryMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
  })
})
