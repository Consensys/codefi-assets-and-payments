import createMockInstance from 'jest-create-mock-instance'
import { Repository } from 'typeorm'

import { TransitionInstancesService } from './TransitionInstancesService'
import {
  mockId,
  mockTenantId,
  mockField,
  mockValue,
  validFirstTransitionInstanceRequest,
  validFirstTransitionInstanceResponse,
  validFirstUpdatedTransitionInstanceRequest,
  validFirstUpdatedTransitionInstanceResponse,
  validDeleteResponse,
} from '../../test/mocks'
import { NestJSPinoLogger } from '@consensys/observability'

describe('TransitionInstancesService', () => {
  let repositoryMock: jest.Mocked<Repository<any>>
  let logger: jest.Mocked<NestJSPinoLogger>
  let service: TransitionInstancesService

  beforeEach(async () => {
    logger = createMockInstance(NestJSPinoLogger)
    repositoryMock = createMockInstance(Repository)
    service = new TransitionInstancesService(repositoryMock, logger)
  })

  describe('create', () => {
    it('success', async () => {
      repositoryMock.save.mockImplementationOnce(
        async () => validFirstTransitionInstanceResponse,
      )

      await service.create(mockTenantId, validFirstTransitionInstanceRequest)
      expect(repositoryMock.save).toBeCalledTimes(1)
      expect(repositoryMock.save).toBeCalledWith({
        ...validFirstTransitionInstanceRequest,
        tenantId: mockTenantId,
      })
    })

    it('failure', async () => {
      repositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validFirstTransitionInstanceRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    describe('success', () => {
      beforeEach(async () => {
        repositoryMock.find.mockImplementationOnce(async () => [
          validFirstTransitionInstanceResponse,
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
      it('success - with 1 value', async () => {
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
        service.find(mockTenantId, mockId, undefined, undefined),
      ).rejects.toThrowError('boom')
    })
  })

  describe('findOne', () => {
    describe('success', () => {
      beforeEach(async () => {
        repositoryMock.find.mockImplementationOnce(async () => [
          validFirstTransitionInstanceResponse,
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
      it('success - with 1 value', async () => {
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
        async () => validFirstTransitionInstanceResponse,
      )
      repositoryMock.save.mockImplementationOnce(
        async () => validFirstUpdatedTransitionInstanceResponse,
      )

      await service.update(
        mockTenantId,
        mockId,
        validFirstUpdatedTransitionInstanceRequest,
      )
      expect(repositoryMock.findOne).toBeCalledTimes(1)
      expect(repositoryMock.findOne).toBeCalledWith({ where: { id: mockId } })
      expect(repositoryMock.save).toBeCalledTimes(1)
      expect(repositoryMock.save).toBeCalledWith({
        ...validFirstUpdatedTransitionInstanceRequest,
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
          validFirstUpdatedTransitionInstanceRequest,
        ),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      repositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedTransitionInstanceRequest,
        ),
      ).rejects.toThrowError('Http Exception')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => validFirstTransitionInstanceResponse,
      )
      repositoryMock.delete.mockImplementationOnce(
        async () => validDeleteResponse,
      )

      await service.delete(mockTenantId, mockId)
      expect(repositoryMock.delete).toBeCalledTimes(1)
      expect(repositoryMock.delete).toBeCalledWith(mockId)
    })

    it('failure', async () => {
      repositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
    it('failure', async () => {
      repositoryMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'Http Exception',
      )
    })
  })
})
