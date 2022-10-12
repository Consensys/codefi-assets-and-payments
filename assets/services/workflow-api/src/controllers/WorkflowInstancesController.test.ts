import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { WorkflowInstancesController } from './WorkflowInstancesController'
import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import {
  mockId,
  mockField,
  mockValue,
  mockField2,
  mockValue2,
  mockField3,
  mockValue3,
  mockIdentityQuery,
  validWorkflowInstanceRequest,
  validWorkflowInstanceResponse,
  validUpdatedWorkflowInstanceRequest,
  mockOtherValue1,
} from '../../test/mocks'
import { WorkflowInstanceDto } from 'src/models/dto/WorkflowInstanceDto'

describe('WorkflowInstancesController', () => {
  let logger: jest.Mocked<NestJSPinoLogger>
  let workflowServiceMock: jest.Mocked<WorkflowInstancesService>
  let controller: WorkflowInstancesController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    workflowServiceMock = createMockInstance(WorkflowInstancesService)
    controller = new WorkflowInstancesController(workflowServiceMock, logger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('success', async () => {
      workflowServiceMock.create.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )
      await controller.create(mockIdentityQuery, validWorkflowInstanceRequest)
      expect(workflowServiceMock.create).toBeCalledTimes(1)
      expect(workflowServiceMock.create).toBeCalledWith(
        mockIdentityQuery.tenantId,
        validWorkflowInstanceRequest,
      )
      expect(logger.info).toHaveBeenCalledTimes(1)
    })

    it('failure', async () => {
      workflowServiceMock.create.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.create(mockIdentityQuery, validWorkflowInstanceRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    it('success', async () => {
      await controller.find(
        mockIdentityQuery,
        mockId,
        undefined, // ids
        mockField,
        mockValue,
        mockField2,
        mockValue2,
        mockField3,
        mockValue3,
        undefined,
        mockOtherValue1,
        undefined,
        undefined,
      )
      expect(workflowServiceMock.find).toBeCalledTimes(1)
      expect(workflowServiceMock.find).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        undefined, // ids
        mockField,
        mockValue,
        mockField2,
        mockValue2,
        mockField3,
        mockValue3,
        undefined,
        mockOtherValue1,
        undefined,
        undefined,
      )
    })

    it('failure', async () => {
      workflowServiceMock.find.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.find(
          mockIdentityQuery,
          mockId,
          undefined, // ids
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          mockField3,
          mockValue3,
          undefined,
          mockOtherValue1,
          undefined,
          undefined,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      await controller.update(
        mockIdentityQuery,
        mockId,
        validUpdatedWorkflowInstanceRequest as WorkflowInstanceDto,
      )
      expect(workflowServiceMock.update).toBeCalledTimes(1)
      expect(workflowServiceMock.update).toBeCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
        validUpdatedWorkflowInstanceRequest,
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
          validUpdatedWorkflowInstanceRequest as WorkflowInstanceDto,
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

  describe('listAllTransitions', () => {
    it('success', async () => {
      workflowServiceMock.listAllTransitions.mockImplementationOnce(
        async () => [],
      )
      await controller.listAllTransitions(mockIdentityQuery, mockId)
      expect(workflowServiceMock.listAllTransitions).toHaveBeenCalledTimes(1)
      expect(workflowServiceMock.listAllTransitions).toHaveBeenCalledWith(
        mockIdentityQuery.tenantId,
        mockId,
      )
    })

    it('failure', async () => {
      workflowServiceMock.listAllTransitions.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        controller.listAllTransitions(mockIdentityQuery, mockId),
      ).rejects.toThrowError('boom')
    })
  })
})
