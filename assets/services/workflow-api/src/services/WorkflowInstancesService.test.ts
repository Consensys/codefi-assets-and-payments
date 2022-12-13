import createMockInstance from 'jest-create-mock-instance'
import { FindOperator, Repository } from 'typeorm'

import { TransitionInstancesService } from './TransitionInstancesService'
import { WorkflowInstancesService } from './WorkflowInstancesService'
import {
  mockId,
  mockTenantId,
  mockField,
  mockValue,
  mockField2,
  mockValue2,
  mockField3,
  mockValue3,
  mockOtherValue1,
  validWorkflowInstanceRequest,
  validFirstTransitionInstanceResponse,
  validWorkflowInstanceResponse,
  validFirstWorkflowTemplateResponse,
  validFirstTransitionInstanceRequest,
  validUpdatedWorkflowInstanceResponse,
  validSecondTransitionInstanceRequest,
  validDeleteResponse,
} from '../../test/mocks'
import { WorkflowTemplatesService } from './WorkflowTemplatesService'
import { NestJSPinoLogger } from '@consensys/observability'
import { Field, LIMIT, SortCriteria } from '../constants/query'

describe('WorkflowInstancesService', () => {
  let workflowInstanceRepositoryMock: jest.Mocked<Repository<any>>
  let transitionInstanceServiceMock: jest.Mocked<TransitionInstancesService>
  let workflowTemplateServiceMock: jest.Mocked<WorkflowTemplatesService>
  let logger: jest.Mocked<NestJSPinoLogger>
  let service: WorkflowInstancesService

  beforeEach(async () => {
    logger = createMockInstance(NestJSPinoLogger)
    workflowInstanceRepositoryMock = createMockInstance(Repository)
    transitionInstanceServiceMock = createMockInstance(
      TransitionInstancesService,
    )
    workflowTemplateServiceMock = createMockInstance(WorkflowTemplatesService)
    service = new WorkflowInstancesService(
      workflowInstanceRepositoryMock,
      transitionInstanceServiceMock,
      workflowTemplateServiceMock,
      logger,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('success', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
        async () => [[], 0],
      )
      workflowInstanceRepositoryMock.save.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )

      await service.create(mockTenantId, validWorkflowInstanceRequest)
      expect(workflowInstanceRepositoryMock.save).toBeCalledTimes(1)
      expect(workflowInstanceRepositoryMock.save).toBeCalledWith({
        ...validWorkflowInstanceRequest,
        tenantId: mockTenantId,
      })
      expect(transitionInstanceServiceMock.create).toBeCalledTimes(1)
      expect(transitionInstanceServiceMock.create).toBeCalledWith(
        mockTenantId,
        validFirstTransitionInstanceRequest,
      )
    })

    it('failure', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowInstanceRepositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowInstanceRepositoryMock.save.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )
      transitionInstanceServiceMock.create.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.create(mockTenantId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('boom')
    })
  })

  describe('find', () => {
    describe('success', () => {
      beforeEach(async () => {
        workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
          async () => [[validWorkflowInstanceResponse], 1],
        )
      })
      it('success - with ID', async () => {
        await service.find(
          mockTenantId,
          mockId,
          undefined, // ids
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: { tenantId: mockTenantId, id: mockId },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 3 values', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          mockField3,
          mockValue3,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
            [mockField2]: mockValue2,
            [mockField3]: mockValue3,
          },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 3 values + other value for first one', async () => {
        await service.find(
          mockTenantId,
          undefined,
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
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: [
            {
              tenantId: mockTenantId,
              [mockField]: mockValue,
              [mockField2]: mockValue2,
              [mockField3]: mockValue3,
            },
            {
              tenantId: mockTenantId,
              [mockField]: mockOtherValue1,
              [mockField2]: mockValue2,
              [mockField3]: mockValue3,
            },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 2 values', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
            [mockField2]: mockValue2,
          },
          order: { createdAt: 'DESC' },
          take: undefined,
        })
      })

      it('success - with 2 values + other value for first one', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          undefined,
          undefined,
          undefined,
          mockOtherValue1,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: [
            {
              tenantId: mockTenantId,
              [mockField]: mockValue,
              [mockField2]: mockValue2,
            },
            {
              tenantId: mockTenantId,
              [mockField]: mockOtherValue1,
              [mockField2]: mockValue2,
            },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 1 value', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          mockField,
          mockValue,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
          },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 1 value + other value for first one', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          mockField,
          mockValue,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          mockOtherValue1,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: [
            {
              tenantId: mockTenantId,
              [mockField]: mockValue,
            },
            {
              tenantId: mockTenantId,
              [mockField]: mockOtherValue1,
            },
          ],
          order: { createdAt: 'DESC' },
        })
      })
      it('success - all', async () => {
        await service.find(
          mockTenantId,
          undefined,
          undefined, // ids
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
          },
          order: { createdAt: 'DESC' },
        })
      })
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.find(
          mockTenantId,
          mockId,
          undefined, // ids
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
        async () => {
          const results = [
            validWorkflowInstanceResponse,
            validWorkflowInstanceResponse,
          ]
          const total = 10
          return [results, total]
        },
      )
    })

    it('returns by tenantId', async () => {
      const fields = []
      const options = {
        order: [],
        limit: LIMIT,
        skip: 0,
      }
      await expect(
        service.findAll({ tenantId: mockTenantId, fields, options }),
      ).resolves.toEqual({
        items: [validWorkflowInstanceResponse, validWorkflowInstanceResponse],
        total: 10,
      })

      expect(workflowInstanceRepositoryMock.findAndCount).toHaveBeenCalledWith({
        order: {},
        skip: 0,
        take: 100,
        where: [
          {
            tenantId: mockTenantId,
          },
        ],
      })
    })

    describe('fields', () => {
      it('returns a list filtered', async () => {
        const field: Field = { name: 'field', comparator: '=', value: 'foo' }
        const fields: Field[] = [field]
        const options = {
          order: [],
          limit: LIMIT,
          skip: 0,
        }
        await expect(
          service.findAll({ tenantId: mockTenantId, fields, options }),
        ).resolves.toEqual({
          items: [validWorkflowInstanceResponse, validWorkflowInstanceResponse],
          total: 10,
        })

        expect(
          workflowInstanceRepositoryMock.findAndCount,
        ).toHaveBeenCalledWith({
          order: {},
          skip: 0,
          take: 100,
          where: [
            {
              [field.name]: field.value,
              tenantId: mockTenantId,
            },
          ],
        })
      })
      it('returns a list filtered using the comparator "<"', async () => {
        const field: Field = { name: 'field', comparator: '<', value: 'foo' }
        const fields: Field[] = [field]
        const options = {
          order: [],
          limit: LIMIT,
          skip: 0,
        }
        await expect(
          service.findAll({ tenantId: mockTenantId, fields, options }),
        ).resolves.toEqual({
          items: [validWorkflowInstanceResponse, validWorkflowInstanceResponse],
          total: 10,
        })
        const findOperator = new FindOperator(
          'lessThan',
          field.value,
          true,
          false,
        )
        expect(
          workflowInstanceRepositoryMock.findAndCount,
        ).toHaveBeenCalledWith({
          order: {},
          skip: 0,
          take: 100,
          where: [
            {
              [field.name]: findOperator,
              tenantId: mockTenantId,
            },
          ],
        })
      })
      it('returns a list filtered using the comparator ">"', async () => {
        const field: Field = { name: 'field', comparator: '>', value: 'foo' }
        const fields: Field[] = [field]
        const options = {
          order: [],
          limit: LIMIT,
          skip: 0,
        }
        await expect(
          service.findAll({ tenantId: mockTenantId, fields, options }),
        ).resolves.toEqual({
          items: [validWorkflowInstanceResponse, validWorkflowInstanceResponse],
          total: 10,
        })

        const findOperator = new FindOperator(
          'moreThan',
          field.value,
          true,
          false,
        )

        expect(
          workflowInstanceRepositoryMock.findAndCount,
        ).toHaveBeenCalledWith({
          order: {},
          skip: 0,
          take: 100,
          where: [
            {
              [field.name]: findOperator,
              tenantId: mockTenantId,
            },
          ],
        })
      })
      it("throws if a field comparator isn't supported", async () => {
        const field: Field = {
          name: 'field',
          comparator: '!!!!' as any,
          value: 'foo',
        }
        const fields: Field[] = [field]
        const options = {
          order: [],
          limit: LIMIT,
          skip: 0,
        }
        await expect(
          service.findAll({ tenantId: mockTenantId, fields, options }),
        ).rejects.toThrowError(
          '"!!!!" unsupported comparator. You can use "=", "<" or ">"',
        )
      })
    })

    describe('order', () => {
      it('returns a list sorted', async () => {
        const fields: Field[] = []
        const criteria: SortCriteria = { date: 'DESC' }
        const order: SortCriteria[] = [criteria]
        const options = {
          order,
          limit: LIMIT,
          skip: 0,
        }
        await expect(
          service.findAll({ tenantId: mockTenantId, fields, options }),
        ).resolves.toEqual({
          items: [validWorkflowInstanceResponse, validWorkflowInstanceResponse],
          total: 10,
        })

        expect(
          workflowInstanceRepositoryMock.findAndCount,
        ).toHaveBeenCalledWith({
          order: {
            ...criteria,
          },
          skip: 0,
          take: 100,
          where: [
            {
              tenantId: mockTenantId,
            },
          ],
        })
      })
    })
  })

  describe('findOne', () => {
    describe('success', () => {
      beforeEach(async () => {
        workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
          async () => [[validWorkflowInstanceResponse], 1],
        )
      })
      it('success - with ID', async () => {
        await service.findOne(
          mockTenantId,
          mockId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: { tenantId: mockTenantId, id: mockId },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 3 values', async () => {
        await service.findOne(
          mockTenantId,
          undefined,
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          mockField3,
          mockValue3,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
            [mockField2]: mockValue2,
            [mockField3]: mockValue3,
          },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 2 values', async () => {
        await service.findOne(
          mockTenantId,
          undefined,
          mockField,
          mockValue,
          mockField2,
          mockValue2,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
            [mockField2]: mockValue2,
          },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - with 1 value', async () => {
        await service.findOne(
          mockTenantId,
          undefined,
          mockField,
          mockValue,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
            [mockField]: mockValue,
          },
          order: { createdAt: 'DESC' },
        })
      })
      it('success - all', async () => {
        await service.findOne(
          mockTenantId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        )
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledTimes(1)
        expect(workflowInstanceRepositoryMock.findAndCount).toBeCalledWith({
          where: {
            tenantId: mockTenantId,
          },
          order: { createdAt: 'DESC' },
        })
      })
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.findOne(
          mockTenantId,
          mockId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
        ),
      ).rejects.toThrowError('boom')
    })
  })

  describe('update', () => {
    it('success', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(
        async () => validFirstWorkflowTemplateResponse,
      )
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
        async () => [[validWorkflowInstanceResponse], 1],
      )
      workflowInstanceRepositoryMock.findOne.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )
      workflowInstanceRepositoryMock.save.mockImplementationOnce(
        async () => validUpdatedWorkflowInstanceResponse,
      )

      await service.update(
        mockTenantId,
        validUpdatedWorkflowInstanceResponse.id,
        validUpdatedWorkflowInstanceResponse,
      )
      expect(workflowTemplateServiceMock.findOne).toBeCalledTimes(1)
      expect(workflowTemplateServiceMock.findOne).toBeCalledWith(
        mockTenantId,
        validWorkflowInstanceResponse.id,
        undefined,
        undefined,
      )
      expect(transitionInstanceServiceMock.create).toBeCalledTimes(1)
      expect(transitionInstanceServiceMock.create).toBeCalledWith(
        mockTenantId,
        validSecondTransitionInstanceRequest,
      )
      expect(workflowInstanceRepositoryMock.save).toBeCalledTimes(1)
      expect(workflowInstanceRepositoryMock.save).toBeCalledWith(
        {
          ...validUpdatedWorkflowInstanceResponse,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      )
    })

    it('failure', async () => {
      workflowTemplateServiceMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(mockTenantId, mockId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('Http Exception')
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(mockTenantId, mockId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('Http Exception')
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(mockTenantId, mockId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('boom')
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.save.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(
        service.update(mockTenantId, mockId, validWorkflowInstanceRequest),
      ).rejects.toThrowError('Http Exception')
    })
  })

  describe('delete', () => {
    it('success', async () => {
      workflowInstanceRepositoryMock.findAndCount.mockImplementationOnce(
        async () => [[validWorkflowInstanceResponse], 1],
      )
      workflowInstanceRepositoryMock.findOne.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )
      workflowInstanceRepositoryMock.delete.mockImplementationOnce(
        async () => validDeleteResponse,
      )

      await service.delete(mockTenantId, mockId)
      expect(workflowInstanceRepositoryMock.delete).toBeCalledTimes(1)
      expect(workflowInstanceRepositoryMock.delete).toBeCalledWith(mockId)
    })

    it('failure', async () => {
      workflowInstanceRepositoryMock.findOne.mockImplementationOnce(() => {
        throw new Error('boom')
      })
      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'boom',
      )
    })
    it('failure', async () => {
      workflowInstanceRepositoryMock.delete.mockImplementationOnce(() => {
        throw new Error('boom')
      })

      await expect(service.delete(mockTenantId, mockId)).rejects.toThrowError(
        'Http Exception',
      )
    })
  })

  describe('list all transitions', () => {
    beforeEach(async () => {
      workflowInstanceRepositoryMock.findOne.mockImplementationOnce(
        async () => validWorkflowInstanceResponse,
      )
      transitionInstanceServiceMock.find.mockImplementationOnce(async () => [
        validFirstTransitionInstanceResponse,
      ])
    })
    it('sucess', async () => {
      await service.listAllTransitions(mockTenantId, mockId)
      expect(workflowInstanceRepositoryMock.findOne).toBeCalledTimes(1)
      expect(workflowInstanceRepositoryMock.findOne).toBeCalledWith({
        where: { id: mockId },
      })
      expect(transitionInstanceServiceMock.find).toBeCalledTimes(1)
      expect(transitionInstanceServiceMock.find).toBeCalledWith(
        mockTenantId,
        undefined,
        'workflowInstanceId',
        `${mockId}`,
      )
    })
  })
})
