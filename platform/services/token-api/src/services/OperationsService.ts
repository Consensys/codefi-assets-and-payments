import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { FindManyOptions, Repository } from 'typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'
import { EntityStatus, TokenOperationType } from '@consensys/ts-types'
import { IReceipt } from '@consensys/nestjs-orchestrate'

@Injectable()
export class OperationsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    @InjectRepository(OperationEntity)
    private operationRepository: Repository<OperationEntity>,
  ) {
    logger.setContext(OperationsService.name)
  }

  getAll(filter?: FindManyOptions<OperationEntity>) {
    return this.operationRepository.findAndCount(filter)
  }

  async findOperationByTransactionId(
    transactionId: string,
  ): Promise<OperationEntity> {
    if (!transactionId) {
      return
    }
    const result = await this.operationRepository.findOne({
      transactionId,
    })
    return result
  }

  async create({
    operationType,
    chainName,
    createdBy,
    operationId,
    transactionId,
    status = EntityStatus.Pending,
    tenantId,
    entityId,
    decodedEvent,
    receipt,
  }: {
    operationType: TokenOperationType
    chainName: string
    createdBy?: string
    operationId?: string
    transactionId?: string
    status?: EntityStatus
    tenantId?: string
    entityId?: string
    decodedEvent?: any
    receipt?: IReceipt
  }): Promise<OperationEntity> {
    const id = operationId || uuidv4()

    const operation: OperationEntity = {
      id,
      operation: operationType,
      status,
      transactionId,
      tenantId,
      entityId,
      createdBy,
      createdAt: new Date(),
      chainName,
      decodedEvent,
      receipt,
    }

    this.logger.info({ operation }, `Saving operation`)

    // Insert rather than save so we throw an error if an operation already exists
    // as we don't want to unknowingly overwrite existing data.
    await this.operationRepository.insert(operation)

    return this.operationRepository.findOneOrFail(operation.id)
  }

  async update(
    operationParams: Partial<OperationEntity>,
    operation: Partial<OperationEntity>,
  ): Promise<number> {
    const result = await this.operationRepository.update(
      operationParams,
      operation,
    )
    return result.affected
  }
}
