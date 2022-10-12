import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { WorkflowInstancesService } from '../services/WorkflowInstancesService'

import { WorkflowInstancesControllerV2 } from './WorkflowInstancesControllerV2'
import { Paginate } from '../constants/query'
import { WorkflowInstance } from '../models/WorkflowInstanceEntity'

describe('WorkflowInstancesControllerV2', () => {
  let logger: jest.Mocked<NestJSPinoLogger>
  let workflowServiceMock: jest.Mocked<WorkflowInstancesService>
  let controller: WorkflowInstancesControllerV2

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    workflowServiceMock = createMockInstance(WorkflowInstancesService)
    controller = new WorkflowInstancesControllerV2(workflowServiceMock, logger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    beforeEach(() => {
      workflowServiceMock.findAll = jest.fn().mockImplementation(
        () =>
          ({
            items: [],
            total: 0,
          } as Paginate<WorkflowInstance>),
      )
    })
    it('returns by tenantId', async () => {
      const tenantId = 'tenantId'
      await expect(controller.findAll(tenantId)).resolves.toEqual({
        items: [],
        total: 0,
      })

      expect(workflowServiceMock.findAll).toBeCalledTimes(1)
      expect(workflowServiceMock.findAll).toBeCalledWith({
        tenantId,
        fields: [],
        options: {
          skip: 0,
          limit: 100,
          order: [],
        },
      })
    })
    describe('params', () => {
      describe('filters', () => {
        it('parses the param', async () => {
          const filter = { name: 'field', comparator: '=', value: 'foo' }

          const tenantId = 'tenantId'
          const filters = [JSON.stringify(filter)]
          await expect(controller.findAll(tenantId, filters)).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [filter],
            options: {
              skip: 0,
              limit: 100,
              order: [],
            },
            queryOption: undefined,
          })
        })

        it("throws an error when the string isn't a valid JSON", async () => {
          const tenantId = 'tenantId'
          const filters = ['invalid']
          await expect(controller.findAll(tenantId, filters)).rejects.toThrow(
            'Failed to parse "filters" param: Unexpected token i in JSON at position 0',
          )
        })

        it("throws an error when filter param doesn't match the format", async () => {
          const filter = {}

          const tenantId = 'tenantId'
          const filters = [JSON.stringify(filter)]
          await expect(controller.findAll(tenantId, filters)).rejects.toThrow(
            'Failed to parse "filters" param: Missing "name" property in {}',
          )
        })

        it('throws an error when the filter param misses one param', async () => {
          const filter = { name: 'field', comparator: '=' }

          const tenantId = 'tenantId'
          const filters = [JSON.stringify(filter)]
          await expect(controller.findAll(tenantId, filters)).rejects.toThrow(
            'Failed to parse "filters" param: Missing "value" property in {"name":"field","comparator":"="}',
          )
        })
      })

      describe('order', () => {
        it('parses the param', async () => {
          const criteria = { field: 'DESC' }

          const tenantId = 'tenantId'
          const filter = []
          const order = [JSON.stringify(criteria)]
          await expect(
            controller.findAll(tenantId, filter, order),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [],
            options: {
              skip: 0,
              limit: 100,
              order: [criteria],
            },
            queryOption: undefined,
          })
        })

        it('ignores empty params', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = ''
          await expect(
            controller.findAll(tenantId, filters, order),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })
        })

        it('ignores empty params in an array', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = ['']
          await expect(
            controller.findAll(tenantId, filters, order),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })
        })

        it("throws an error when the string isn't a valid JSON", async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = ['invalid']
          await expect(
            controller.findAll(tenantId, filters, order),
          ).rejects.toThrow(
            'Failed to parse "order" param: Unexpected token i in JSON at position 0',
          )
        })

        it("throws an error the param doesn't match the format", async () => {
          workflowServiceMock.findAll = jest.fn().mockImplementation(() => [])
          const criteria = {}

          const tenantId = 'tenantId'
          const filters = []
          const order = JSON.stringify(criteria)
          await expect(
            controller.findAll(tenantId, filters, order),
          ).rejects.toThrow('Failed to parse "order" param: Empty criteria')
        })

        it("throws an error if the param doesn't have the correct values", async () => {
          const criteria = { field: 'BOOM' }

          const tenantId = 'tenantId'
          const filters = []
          const order = JSON.stringify(criteria)
          await expect(
            controller.findAll(tenantId, filters, order),
          ).rejects.toThrow(
            'Failed to parse "order" param: Invalid value "BOOM" for order criteria "field". Valid values (ASC, DESC)',
          )
        })
      })

      describe('limit', () => {
        it('parses the param', async () => {
          const tenantId = 'tenantId'
          const filter = []
          const order = []
          const limit = '10' as any
          await expect(
            controller.findAll(tenantId, filter, order, limit),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [],
            options: {
              order: [],
              skip: 0,
              limit: parseInt(limit, 10),
            },
            queryOption: undefined,
          })
        })

        it('parses a number', async () => {
          const tenantId = 'tenantId'
          const filter = []
          const order = []
          const limit = '10.45' as any
          await expect(
            controller.findAll(tenantId, filter, order, limit),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [],
            options: {
              order: [],
              skip: 0,
              limit: 10,
            },
            queryOption: undefined,
          })
        })

        it('throws an error with invalid int', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = []
          const limit = 'boom' as any
          await expect(
            controller.findAll(tenantId, filters, order, limit),
          ).rejects.toThrow(`Failed to parse "${limit}". It isn't a number`)
        })
      })

      describe('skip', () => {
        it('parses the param', async () => {
          const tenantId = 'tenantId'
          const filter = []
          const order = []
          const skip = '10' as any
          await expect(
            controller.findAll(tenantId, filter, order, undefined, skip),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [],
            options: {
              order: [],
              skip: 10,
              limit: 100,
            },
            queryOption: undefined,
          })
        })

        it('parses a number', async () => {
          const tenantId = 'tenantId'
          const filter = []
          const order = []
          const skip = '10.45' as any
          await expect(
            controller.findAll(tenantId, filter, order, undefined, skip),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })

          expect(workflowServiceMock.findAll).toBeCalledTimes(1)
          expect(workflowServiceMock.findAll).toBeCalledWith({
            tenantId,
            fields: [],
            options: {
              order: [],
              skip: 10,
              limit: 100,
            },
            queryOption: undefined,
          })
        })

        it('throws an error with invalid int', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = []
          const skip = 'boom' as any
          await expect(
            controller.findAll(tenantId, filters, order, undefined, skip),
          ).rejects.toThrow(`Failed to parse "${skip}". It isn't a number`)
        })
      })

      describe('queryOption', () => {
        it('parse queryOption', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = []
          const queryOption = JSON.stringify({
            callerId: '6796fdea-0f44-42e8-a2a4-bef5769ec09f',
            isInvestorQuery: false,
          })

          await expect(
            controller.findAll(
              tenantId,
              filters,
              order,
              undefined,
              undefined,
              queryOption,
            ),
          ).resolves.toEqual({
            items: [],
            total: 0,
          })
        })

        it('throws if queryOption object does not contain callerId', async () => {
          const tenantId = 'tenantId'
          const filters = []
          const order = []
          const queryOption = JSON.stringify({
            isInvestorQuery: false,
          })

          await expect(
            controller.findAll(
              tenantId,
              filters,
              order,
              undefined,
              undefined,
              queryOption,
            ),
          ).rejects.toThrow(`Failed to validate V2QueryOption schema`)
        })
      })
    })
  })
})
