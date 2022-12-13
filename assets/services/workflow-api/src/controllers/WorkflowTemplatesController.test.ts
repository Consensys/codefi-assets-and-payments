import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'

import { WorkflowTemplatesController } from './WorkflowTemplatesController'
import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'
import {
  mockId,
  validFirstWorkflowTemplateRequest,
  validFirstWorkflowTemplateResponse,
  mockIdentityQuery,
  mockValue,
  mockField,
} from '../../test/mocks'

describe('WorkflowTemplatesController', () => {
  let logger: jest.Mocked<NestJSPinoLogger>
  let workflowServiceMock: jest.Mocked<WorkflowTemplatesService>
  let controller: WorkflowTemplatesController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    workflowServiceMock = createMockInstance(WorkflowTemplatesService)
    controller = new WorkflowTemplatesController(workflowServiceMock, logger)
  })

  describe('create', () => {
    it('success', async () => {
      workflowServiceMock.create.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      await controller.create(
        mockIdentityQuery,
        validFirstWorkflowTemplateRequest,
      )
      expect(workflowServiceMock.create).toBeCalledTimes(1)
      expect(workflowServiceMock.create).toBeCalledWith(
        mockIdentityQuery.tenantId,
        validFirstWorkflowTemplateRequest,
        true,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
    })

    it('failure', async () => {
      workflowServiceMock.create.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.create(mockIdentityQuery, validFirstWorkflowTemplateRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    it('success', async () => {
      await controller.find(mockIdentityQuery, mockId, mockField, mockValue)
      expect(workflowServiceMock.find).toBeCalledTimes(1)
      expect(workflowServiceMock.find).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        mockField,
        mockValue,
      )
    })

    it('failure', async () => {
      workflowServiceMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.find(mockIdentityQuery, undefined, undefined, undefined),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      await controller.update(
        mockIdentityQuery,
        mockId,
        validFirstWorkflowTemplateRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
      expect(workflowServiceMock.update).toBeCalledTimes(1)
      expect(workflowServiceMock.update).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        validFirstWorkflowTemplateRequest,
        true,
      )
    })

    it('failure', async () => {
      workflowServiceMock.update.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.update(
          mockIdentityQuery,
          mockId,
          validFirstWorkflowTemplateRequest,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      await controller.delete(mockIdentityQuery, mockId)
      expect(workflowServiceMock.delete).toHaveBeenCalledTimes(1)
      expect(workflowServiceMock.delete).toHaveBeenCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
      )
    })

    it('failure', async () => {
      workflowServiceMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.delete(mockIdentityQuery, mockId),
      ).rejects.toThrowError('boom')
    })
  })
})
