import { Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { NestJSPinoLogger } from '@consensys/observability'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'
import {
  hexToString,
  stringToBigNumber,
  stringToHex,
} from '../utils/bignumberUtils'
import {
  BalanceHistoryQuotes,
  EntityStatus,
  PeriodGranularity,
  OperationType,
} from '@consensys/ts-types'
import BigNumber from 'bignumber.js'
import { getDateRangeByPeriod } from '../utils/dateUtils'
import {
  EntityNotFoundException,
  ValidationException,
} from '@consensys/error-handler'
import { Counted } from './types'
import { LocalErrorName } from '../LocalErrorNameEnum'

@Injectable()
export class OperationService {
  constructor(
    private logger: NestJSPinoLogger,
    @InjectRepository(OperationEntity)
    private readonly operationRepository: Repository<OperationEntity>,
  ) {
    this.logger.setContext(OperationService.name)
  }

  async create(
    operationType: OperationType,
    status: EntityStatus,
    chainName: string,
    operationAmount: string,
    operationTriggeredByAddress: string,
    id?: string,
    tenantId?: string,
    entityId?: string,
    createdBy?: string,
    operationSourceAddress?: string,
    operationTargetAddress?: string,
    digitalCurrencyAddress?: string,
    transactionHash?: string,
  ): Promise<OperationEntity> {
    this.logger.info(
      `Creating operation, operationType=${operationType}, status=${status}, id=${id}, tenantId=${tenantId}, createdBy=${createdBy}, operationTriggeredByAddress=${operationTriggeredByAddress}, operationTargetAddress=${operationTargetAddress}, digitalCurrencyAddress=${digitalCurrencyAddress}, transactionHash=${transactionHash}`,
    )
    const entityToSave: OperationEntity = {
      id: id || uuidv4(),
      status,
      chainName,
      operationType,
      operationAmount: hexToString(operationAmount),
      tenantId,
      entityId,
      createdBy,
      operationTriggeredByAddress,
      operationSourceAddress,
      operationTargetAddress,
      digitalCurrencyAddress,
      createdAt: new Date(),
      transactionHash,
    }
    const result = await this.operationRepository.save(entityToSave)
    return { ...result, operationAmount: stringToHex(result.operationAmount) }
  }

  async update(
    params: Partial<OperationEntity>,
    update: Partial<OperationEntity>,
  ): Promise<number> {
    const result = await this.operationRepository.update(params, update)
    return result.affected
  }

  async find(
    params: Partial<OperationEntity>,
    skip?: number,
    limit?: number,
  ): Promise<Counted<OperationEntity>> {
    this.logger.info(
      `Operations find ${JSON.stringify(
        params,
      )} with skip=${skip}, limit=${limit}`,
    )
    const [operations, count] = await this.operationRepository.findAndCount({
      where: params,
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limit,
    })
    const result = operations.map((op) => ({
      ...op,
      operationAmount: stringToHex(op.operationAmount),
    }))
    return {
      result,
      count,
    }
  }
  async findOne(params: Partial<OperationEntity>): Promise<OperationEntity> {
    this.logger.info(
      `Operation find by operationId=${params.id} and tenantId=${params.tenantId}.`,
    )
    const result = await this.operationRepository.findOne(params)

    if (!result) {
      this.logger.warn(
        `OperationId=${params.id} does not exists or is not part of tenantId=${params.tenantId}.`,
      )
      throw new EntityNotFoundException(
        LocalErrorName.OperationNotFoundException,
        'Operation does not exist or it is not part of the tenant',
        { operationId: params.id, tenantId: params.tenantId },
      )
    }

    return {
      ...result,
      operationAmount: stringToHex(result.operationAmount),
    }
  }

  async findBalanceHistoryByPeriod(
    holderAddress?: string,
    digitalCurrencyAddress?: string,
    chainName?: string,
    periodGranularity?: PeriodGranularity,
    from?: Date,
    to?: Date,
    skip?: number,
    limit?: number,
  ): Promise<BalanceHistoryQuotes[]> {
    this.logger.info(
      `find balance history holder: ${holderAddress}, digitalCurrency: ${digitalCurrencyAddress},
       period: ${periodGranularity}, dateFrom: ${from.getTime()}, dateTo: ${to.getTime()}`,
    )

    // set the hours to consider the whole period
    // and remove the timezone offset
    const dateFrom = new Date(from.setUTCHours(0, 0, 0, 0))
    dateFrom.setMinutes(dateFrom.getMinutes() + dateFrom.getTimezoneOffset())
    const dateTo = new Date(to.setUTCHours(23, 59, 59, 0))
    dateTo.setMinutes(dateTo.getMinutes() + dateTo.getTimezoneOffset())

    if (dateFrom >= dateTo) {
      throw new ValidationException(
        'ValidationException',
        `dateFrom: ${dateFrom} is grater or equals dateTo: ${dateTo}`,
        { dateFrom, dateTo },
      )
    }

    const operationsBalanceHistoryResult: BalanceHistoryQuotes[] = []
    const queryBuilder = this.operationRepository.createQueryBuilder()

    // find all operations up to dateFrom to calculate the initial balance
    const operationsDateFrom: OperationEntity[] = await queryBuilder
      .where(
        'OperationEntity.digitalCurrencyAddress = :digitalCurrencyAddress',
        {
          digitalCurrencyAddress,
        },
      )
      .andWhere('OperationEntity.chainName = :chainName', { chainName })
      .andWhere('OperationEntity.status = :status', {
        status: EntityStatus.Confirmed,
      })
      .andWhere('OperationEntity.createdAt < :dateFrom', { dateFrom })
      .orderBy('OperationEntity.createdAt')
      .getMany()

    this.logger.info(
      `operations before ${dateFrom.toISOString()} : ${
        operationsDateFrom.length
      }`,
    )

    let initialBalance = new BigNumber(0)
    operationsDateFrom.forEach(async (op) => {
      if (
        op.operationSourceAddress === holderAddress &&
        (op.operationType === OperationType.Transfer ||
          op.operationType === OperationType.Burn)
      ) {
        initialBalance = initialBalance.minus(
          stringToBigNumber(op.operationAmount),
        )
      } else if (
        op.operationTargetAddress === holderAddress &&
        (op.operationType === OperationType.Transfer ||
          op.operationType === OperationType.Mint)
      ) {
        initialBalance = initialBalance.plus(
          stringToBigNumber(op.operationAmount),
        )
      }
    })
    this.logger.info(`initial balance: ${initialBalance}`)

    let balance = initialBalance
    // find all the operations between dateFrom and dateTo
    const operationsFromAndTo = await queryBuilder
      .where(
        'OperationEntity.digitalCurrencyAddress = :digitalCurrencyAddress',
        {
          digitalCurrencyAddress,
        },
      )
      .andWhere('OperationEntity.chainName = :chainName', { chainName })
      .andWhere('OperationEntity.status = :status', {
        status: EntityStatus.Confirmed,
      })
      .andWhere('OperationEntity.createdAt >= :dateFrom', { dateFrom })
      .andWhere('OperationEntity.createdAt <= :dateTo', { dateTo })
      .orderBy('OperationEntity.createdAt')
      .skip(skip)
      .take(limit)
      .getMany()

    this.logger.info(
      `operations between ${dateFrom.getTime()} and ${dateTo.getTime()}: ${
        operationsFromAndTo.length
      }`,
    )

    // retrieve the range od date between dateFrom and dateTo by DAY/WEEK/MONTH/YEAR
    const dateRange: Date[] = await getDateRangeByPeriod(
      dateFrom,
      dateTo,
      periodGranularity,
    )

    // calculate balance by period and push to $operationsBalanceHistoryResult
    dateRange.forEach((date, i) => {
      const dateBefore = dateRange[i - 1] ? dateRange[i - 1] : date
      operationsFromAndTo.forEach(async (op) => {
        if (
          op.createdAt.setHours(0, 0, 0, 0) <= date.setHours(0, 0, 0, 0) &&
          (op.createdAt > dateBefore || !dateRange[i - 1]) &&
          op.operationSourceAddress === holderAddress &&
          (op.operationType === OperationType.Transfer ||
            op.operationType === OperationType.Burn)
        ) {
          balance = balance.minus(stringToBigNumber(op.operationAmount))
        } else if (
          op.createdAt.setHours(0, 0, 0, 0) <= date.setHours(0, 0, 0, 0) &&
          (op.createdAt > dateBefore || !dateRange[i - 1]) &&
          op.operationTargetAddress === holderAddress &&
          (op.operationType === OperationType.Transfer ||
            op.operationType === OperationType.Mint)
        ) {
          balance = balance.plus(stringToBigNumber(op.operationAmount))
        }
      })
      operationsBalanceHistoryResult.push({
        v: balance.toString(),
        t: date.toString(),
      })
    })

    return operationsBalanceHistoryResult
  }
}
