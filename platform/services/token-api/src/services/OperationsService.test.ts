import { EntityStatus, TokenOperationType } from '@codefi-assets-and-payments/ts-types'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Repository } from 'typeorm'
import {
  tenantIdMock,
  userIdMock,
  operationEntityMock,
  updateResultMock,
  chainNameMock,
  entityIdMock,
  createMockLogger,
} from '../../test/mocks'
import { OperationsService } from './OperationsService'

describe('OperationsService', () => {
  let service: OperationsService
  let operationRepoMock: jest.Mocked<Repository<any>>
  let loggerMock: jest.Mocked<NestJSPinoLogger>

  beforeEach(() => {
    loggerMock = createMockLogger()
    operationRepoMock = createMockInstance(Repository)

    service = new OperationsService(loggerMock, operationRepoMock)
  })

  describe('create', () => {
    it('success', async () => {
      operationRepoMock.findOneOrFail.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const result = await service.create({
        ...operationEntityMock,
        operationId: operationEntityMock.id,
        operationType: operationEntityMock.operation,
      })

      expect(result).toBe(operationEntityMock)
      expect(operationRepoMock.insert).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.insert).toHaveBeenCalledWith({
        id: operationEntityMock.id,
        operation: TokenOperationType.Deploy,
        status: EntityStatus.Pending,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        transactionId: expect.any(String),
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
        receipt: operationEntityMock.receipt,
        decodedEvent: operationEntityMock.decodedEvent,
      })
    })

    it('success with no id', async () => {
      const findResult = { ...operationEntityMock }
      delete findResult.blockNumber
      delete findResult.transactionHash

      operationRepoMock.findOneOrFail.mockImplementationOnce(
        async () => findResult,
      )

      const result = await service.create({
        ...operationEntityMock,
        operationType: operationEntityMock.operation,
        operationId: undefined,
      })

      expect(result).toStrictEqual({
        id: expect.any(String),
        operation: TokenOperationType.Deploy,
        status: EntityStatus.Pending,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        transactionId: expect.any(String),
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
        receipt: operationEntityMock.receipt,
        decodedEvent: operationEntityMock.decodedEvent,
      })
      expect(operationRepoMock.insert).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        operation: TokenOperationType.Deploy,
        status: EntityStatus.Pending,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        transactionId: expect.any(String),
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
        receipt: operationEntityMock.receipt,
        decodedEvent: operationEntityMock.decodedEvent,
      })
    })

    it('success with no status', async () => {
      const findResult = { ...operationEntityMock }
      delete findResult.blockNumber
      delete findResult.transactionHash

      operationRepoMock.findOneOrFail.mockImplementationOnce(
        async () => findResult,
      )

      const result = await service.create({
        ...operationEntityMock,
        operationId: operationEntityMock.id,
        operationType: operationEntityMock.operation,
        status: undefined,
      })

      expect(result).toStrictEqual({
        id: expect.any(String),
        operation: TokenOperationType.Deploy,
        status: EntityStatus.Pending,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        transactionId: expect.any(String),
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
        receipt: operationEntityMock.receipt,
        decodedEvent: operationEntityMock.decodedEvent,
      })
      expect(operationRepoMock.insert).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        operation: TokenOperationType.Deploy,
        status: EntityStatus.Pending,
        tenantId: tenantIdMock,
        entityId: entityIdMock,
        transactionId: expect.any(String),
        createdBy: userIdMock,
        createdAt: expect.any(Date),
        chainName: chainNameMock,
        receipt: operationEntityMock.receipt,
        decodedEvent: operationEntityMock.decodedEvent,
      })
    })
  })

  describe('update', () => {
    it('success', async () => {
      operationRepoMock.update.mockImplementationOnce(
        async () => updateResultMock,
      )

      const result = await service.update(
        {
          id: operationEntityMock.id,
        },
        operationEntityMock,
      )

      expect(result).toBe(1)
      expect(operationRepoMock.update).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.update).toHaveBeenCalledWith(
        {
          id: operationEntityMock.id,
        },
        {
          id: expect.any(String),
          operation: TokenOperationType.Deploy,
          status: EntityStatus.Pending,
          tenantId: tenantIdMock,
          entityId: entityIdMock,
          transactionId: expect.any(String),
          createdBy: userIdMock,
          createdAt: expect.any(Date),
          chainName: chainNameMock,
          blockNumber: operationEntityMock.blockNumber,
          transactionHash: operationEntityMock.transactionHash,
          receipt: operationEntityMock.receipt,
          decodedEvent: operationEntityMock.decodedEvent,
        },
      )
    })
  })

  describe('getAll', () => {
    it('forward params to repository', async () => {
      operationRepoMock.findAndCount.mockResolvedValueOnce([
        [operationEntityMock],
        1,
      ])

      const params = {
        skip: 10,
        take: 20,
        where: {
          transactionId: operationEntityMock.transactionId,
        },
      }

      const result = await service.getAll(params)

      expect(result).toEqual([[operationEntityMock], 1])
      expect(operationRepoMock.findAndCount).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.findAndCount).toHaveBeenCalledWith(params)
    })
  })

  describe('findOperationByTransactionId', () => {
    it('find operation by transactionId - success', async () => {
      operationRepoMock.findOne.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const result = await service.findOperationByTransactionId(
        operationEntityMock.transactionId,
      )

      expect(result).toBe(operationEntityMock)
      expect(operationRepoMock.findOne).toHaveBeenCalledTimes(1)
      expect(operationRepoMock.findOne).toHaveBeenCalledWith({
        transactionId: operationEntityMock.transactionId,
      })
    })

    it('find operation by not exist transactionId - success', async () => {
      operationRepoMock.findOne.mockImplementationOnce(
        async () => operationEntityMock,
      )

      const result = await service.findOperationByTransactionId(null)

      expect(result).toBe(undefined)
    })
  })
})
