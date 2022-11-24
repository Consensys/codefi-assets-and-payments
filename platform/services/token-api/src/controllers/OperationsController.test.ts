import {
  createMockLogger,
  operationEntityMock,
  operationIdMock,
  transactionIdMock,
} from '../../test/mocks'
import { OperationsController } from './OperationsController'
import { OperationsService } from '../services/OperationsService'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import { TokenOperationQueryRequest } from '@consensys/ts-types'

describe('OperationsController', () => {
  let controller: OperationsController
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let operationsServiceMock: jest.Mocked<OperationsService>

  beforeEach(async () => {
    operationsServiceMock = createMockInstance(OperationsService)
    loggerMock = createMockLogger()
    controller = new OperationsController(loggerMock, operationsServiceMock)
  })

  describe('findAll', () => {
    it('resturns paginated items', async () => {
      const items = [operationEntityMock]
      const count = 1
      const skip = 20
      const limit = 10
      const whereFilter = {
        id: operationIdMock,
        transactionId: transactionIdMock,
      }

      operationsServiceMock.getAll.mockResolvedValueOnce([items, count])

      const mockedQuery: TokenOperationQueryRequest = {
        ...whereFilter,
        skip,
        limit,
      }

      const result = await controller.findAll(mockedQuery)

      expect(result).toEqual({
        items,
        count,
        skip,
        limit,
      })
      expect(operationsServiceMock.getAll).toHaveBeenCalledTimes(1)
      expect(operationsServiceMock.getAll).toHaveBeenCalledWith({
        skip,
        take: limit,
        where: whereFilter,
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })
})
