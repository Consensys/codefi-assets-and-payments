import { OperationService } from './OperationService'
import { NestJSPinoLogger } from '@consensys/observability'
import createMockInstance from 'jest-create-mock-instance'
import { Repository, SelectQueryBuilder } from 'typeorm'
import {
  addressMock,
  addressMock2,
  addressMock3,
  addressMock4,
  chainNameMock,
  entityIdMock,
  hashMock,
  legalEntityMock,
  operationEntitiesMock,
  operationEntityMock,
  subjectMock,
  tenantIdMock,
  uuidMock,
} from '../../test/mocks'
import {
  EntityStatus,
  PeriodGranularity,
  OperationType,
} from '@consensys/ts-types'
import { ValidationException } from '@consensys/error-handler'

describe('OperationService', () => {
  let service: OperationService
  let loggerMock: jest.Mocked<NestJSPinoLogger>
  let repositoryMock: jest.Mocked<Repository<any>>
  let queryBuilderMock: jest.Mocked<SelectQueryBuilder<any>>

  beforeEach(() => {
    loggerMock = createMockInstance(NestJSPinoLogger)
    repositoryMock = createMockInstance(Repository)
    queryBuilderMock = createMockInstance(SelectQueryBuilder)

    repositoryMock.createQueryBuilder.mockImplementationOnce(
      () => queryBuilderMock,
    )

    service = new OperationService(loggerMock, repositoryMock)
  })

  describe('create', () => {
    it('success', async () => {
      repositoryMock.save.mockImplementationOnce(
        async () => operationEntityMock,
      )
      await service.create(
        OperationType.Creation,
        EntityStatus.Pending,
        'chainName',
        '5',
        addressMock3,
        uuidMock,
        tenantIdMock,
        entityIdMock,
        subjectMock,
        addressMock,
        addressMock2,
        addressMock4,
        hashMock,
      )

      expect(repositoryMock.save).toHaveBeenCalledTimes(1)
      expect(repositoryMock.save).toHaveBeenCalledWith({
        ...operationEntityMock,
        createdAt: expect.any(Date),
      })
    })
  })

  describe('update', () => {
    it('success', async () => {
      const resultMock = {
        affected: 1,
      } as any
      repositoryMock.update.mockImplementationOnce(async () => resultMock)
      const result = await service.update(
        {
          id: uuidMock,
        },
        {
          transactionHash: hashMock,
        },
      )
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith(
        {
          id: uuidMock,
        },
        {
          transactionHash: hashMock,
        },
      )
      expect(result).toBe(resultMock.affected)
    })
  })

  describe('find', () => {
    it('success', async () => {
      const operationsMock = [operationEntityMock, operationEntityMock]
      const findAndCountMock: any = [operationsMock, 2]
      repositoryMock.findAndCount.mockImplementationOnce(
        async () => findAndCountMock,
      )
      await service.find(operationEntityMock)
      expect(repositoryMock.findAndCount).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findAndCount).toHaveBeenCalledWith({
        where: operationEntityMock,
        order: {
          createdAt: 'DESC',
        },
      })
    })
  })
  describe('findOne', () => {
    it('success', async () => {
      repositoryMock.findOne.mockImplementationOnce(
        async () => operationEntityMock,
      )
      await service.findOne(operationEntityMock)
      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findOne).toHaveBeenCalledWith(operationEntityMock)
    })
  })

  describe('findBalanceHistoryByPeriod', () => {
    it('success', async () => {
      // find all operations up to dateFrom to get initial balance
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () =>
        operationEntitiesMock.slice(0, 2),
      )

      // find all operations between dateFrom and dateTo
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () =>
        operationEntitiesMock.slice(2, 4),
      )

      const result = await service.findBalanceHistoryByPeriod(
        addressMock,
        addressMock2,
        chainNameMock,
        PeriodGranularity.DAY,
        new Date(2021, 0, 1),
        new Date(2021, 0, 30),
        0,
        0,
      )

      expect(queryBuilderMock.where).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(7)
      expect(queryBuilderMock.orderBy).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.skip).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.take).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(2)

      expect(result.length).toBe(30)
      expect(result[result.length - 1].v).toBe('258')
    })

    it('success - no operations between dateFrom and dateTo', async () => {
      // find all operations up to dateFrom to get initial balance
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () =>
        operationEntitiesMock.slice(0, 2),
      )

      // find all operations between dateFrom and dateTo
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () => [])

      const result = await service.findBalanceHistoryByPeriod(
        addressMock,
        addressMock2,
        chainNameMock,
        PeriodGranularity.DAY,
        new Date('01-01-2021'),
        new Date('02-30-2021'),
        0,
        0,
      )

      expect(queryBuilderMock.where).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(7)
      expect(queryBuilderMock.orderBy).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.skip).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.take).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(2)

      expect(result.length).toBe(61)
      expect(result[result.length - 1].v).toBe('200')
    })

    it('success - should return history balances WEEKLY', async () => {
      // find all operations up to dateFrom to get initial balance
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () =>
        operationEntitiesMock.slice(0, 2),
      )

      // find all operations between dateFrom and dateTo
      queryBuilderMock.where.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.andWhere.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.orderBy.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.skip.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.take.mockImplementationOnce(() => queryBuilderMock)
      queryBuilderMock.getMany.mockImplementationOnce(async () =>
        operationEntitiesMock.slice(2, 4),
      )

      const result = await service.findBalanceHistoryByPeriod(
        addressMock,
        addressMock2,
        chainNameMock,
        PeriodGranularity.WEEK,
        new Date('01-01-2021'),
        new Date('01-30-2021'),
        0,
        0,
      )

      expect(queryBuilderMock.where).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(7)
      expect(queryBuilderMock.orderBy).toHaveBeenCalledTimes(2)
      expect(queryBuilderMock.skip).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.take).toHaveBeenCalledTimes(1)
      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(2)

      expect(result.length).toBe(5)
      expect(result[result.length - 1].v).toBe('258')
    })

    it('throws - should fail if dateFrom is greater or equal to dateTo', async () => {
      const dateFrom = new Date(2022, 0, 1)
      const dateTo = new Date(2021, 0, 1)
      await expect(
        service.findBalanceHistoryByPeriod(
          addressMock,
          addressMock2,
          chainNameMock,
          PeriodGranularity.WEEK,
          dateFrom,
          dateTo,
          0,
          0,
        ),
      ).rejects.toThrowError(ValidationException)

      expect(queryBuilderMock.where).toHaveBeenCalledTimes(0)
      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(0)
      expect(queryBuilderMock.orderBy).toHaveBeenCalledTimes(0)
      expect(queryBuilderMock.skip).toHaveBeenCalledTimes(0)
      expect(queryBuilderMock.take).toHaveBeenCalledTimes(0)
      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(0)
    })
  })
})
