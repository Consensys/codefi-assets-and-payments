import createMockInstance from 'jest-create-mock-instance'
import { Repository } from 'typeorm'
import { NestJSPinoLogger } from '@consensys/observability'

import { WorkflowTemplatesService } from './WorkflowTemplatesService'
import {
  mockId,
  mockField,
  mockValue,
  validFirstWorkflowTemplateRequest,
  validFirstUpdatedWorkflowTemplateRequest,
  validFirstUpdatedWorkflowTemplateResponse,
  mockTenantId,
  validFirstWorkflowTemplateResponse,
  validDeleteResponse,
} from '../../test/mocks'
import { DEFAULT_TENANT_ID } from '../utils/constants'

describe('WorkflowTemplatesService', () => {
  let workflowRepositoryMock: jest.Mocked<Repository<any>>
  let logger: jest.Mocked<NestJSPinoLogger>
  let service: WorkflowTemplatesService

  beforeEach(async () => {
    logger = createMockInstance(NestJSPinoLogger)
    workflowRepositoryMock = createMockInstance(Repository)
    service = new WorkflowTemplatesService(logger, workflowRepositoryMock)
  })

  describe('create', () => {
    it('success', async () => {
      workflowRepositoryMock.find.mockImplementationOnce(async () => [])
      workflowRepositoryMock.save.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )

      await service.create(
        mockTenantId,
        validFirstWorkflowTemplateRequest,
        true,
      )
      expect(workflowRepositoryMock.save).toBeCalledTimes(1)
      expect(workflowRepositoryMock.save).toBeCalledWith({
        ...validFirstWorkflowTemplateRequest,
        tenantId: mockTenantId,
      })
    })

    it('failure', async () => {
      workflowRepositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validFirstWorkflowTemplateRequest, true),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowRepositoryMock.find.mockImplementationOnce(async () => [])
      workflowRepositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validFirstWorkflowTemplateRequest, true),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    describe('success', () => {
      beforeEach(async () => {
        workflowRepositoryMock.find.mockImplementationOnce(async () => [
          validFirstWorkflowTemplateResponse,
        ])
      })
      it('success - with ID', async () => {
        await service.find(mockTenantId, mockId, undefined, undefined)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [
            { tenantId: mockTenantId, id: mockId },
            { tenantId: DEFAULT_TENANT_ID, id: mockId },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 1 value', async () => {
        await service.find(mockTenantId, undefined, mockField, mockValue)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [
            { tenantId: mockTenantId, [mockField]: mockValue },
            { tenantId: DEFAULT_TENANT_ID, [mockField]: mockValue },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - all', async () => {
        await service.find(mockTenantId, undefined, undefined, undefined)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [{ tenantId: mockTenantId }, { tenantId: DEFAULT_TENANT_ID }],
          order: { createdAt: 'DESC' },
        })
      })
    })

    it('failure', async () => {
      workflowRepositoryMock.find.mockImplementationOnce(() => {
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
        workflowRepositoryMock.find.mockImplementationOnce(async () => [
          validFirstWorkflowTemplateResponse,
        ])
      })
      it('success - with ID', async () => {
        await service.findOne(mockTenantId, mockId, undefined, undefined)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [
            { tenantId: mockTenantId, id: mockId },
            { tenantId: DEFAULT_TENANT_ID, id: mockId },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 1 value', async () => {
        await service.findOne(mockTenantId, undefined, mockField, mockValue)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [
            { tenantId: mockTenantId, [mockField]: mockValue },
            { tenantId: DEFAULT_TENANT_ID, [mockField]: mockValue },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - all', async () => {
        await service.findOne(mockTenantId, undefined, undefined, undefined)
        expect(workflowRepositoryMock.find).toBeCalledTimes(1)
        expect(workflowRepositoryMock.find).toBeCalledWith({
          where: [{ tenantId: mockTenantId }, { tenantId: DEFAULT_TENANT_ID }],
          order: { createdAt: 'DESC' },
        })
      })
    })

    it('failure', async () => {
      workflowRepositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.findOne(mockTenantId, mockId, undefined, undefined),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowRepositoryMock.find.mockImplementationOnce(async () => [
        validFirstWorkflowTemplateResponse,
      ])
      workflowRepositoryMock.save.mockImplementationOnce(
        async () => validFirstUpdatedWorkflowTemplateResponse,
      )

      await service.update(
        mockTenantId,
        validFirstWorkflowTemplateResponse.id,
        validFirstUpdatedWorkflowTemplateRequest,
        true,
      )
      expect(workflowRepositoryMock.findOne).toBeCalledTimes(1)
      expect(workflowRepositoryMock.findOne).toBeCalledWith({
        where: { id: validFirstWorkflowTemplateResponse.id },
      })
      expect(workflowRepositoryMock.save).toBeCalledTimes(1)
      expect(workflowRepositoryMock.save).toBeCalledWith({
        ...validFirstUpdatedWorkflowTemplateRequest,
        id: validFirstWorkflowTemplateResponse.id,
      })
    })

    it('failure', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedWorkflowTemplateRequest,
          true,
        ),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowRepositoryMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedWorkflowTemplateRequest,
          true,
        ),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowRepositoryMock.find.mockImplementationOnce(async () => [
        validFirstWorkflowTemplateResponse,
      ])
      workflowRepositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(
          mockTenantId,
          mockId,
          validFirstUpdatedWorkflowTemplateRequest,
          true,
        ),
      ).rejects.toThrowError('Http Exception')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowRepositoryMock.delete.mockImplementationOnce(
        async () => validDeleteResponse,
      )

      await service.delete(mockTenantId, mockId)
      expect(workflowRepositoryMock.delete).toBeCalledTimes(1)
      expect(workflowRepositoryMock.delete).toBeCalledWith(mockId)
    })

    it('failure', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
    it('failure', async () => {
      workflowRepositoryMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowRepositoryMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
  })
})
