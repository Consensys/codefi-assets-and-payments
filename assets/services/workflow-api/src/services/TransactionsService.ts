import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

import { Transaction } from '../models/TransactionEntity'
import { TransactionDto } from '../models/dto/TransactionDto'
import { checkTenantId, requireTenantId } from '../utils/tenant'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private readonly logger: NestJSPinoLogger,
  ) {}

  async create(tenantId: string, transaction: TransactionDto): Promise<any> {
    // Check if inputs are valid
    await this.checkValidInputs(
      tenantId,
      undefined,
      transaction.identifierOrchestrateId,
    )

    const createdTransaction: Transaction =
      await this.transactionRepository.save({
        ...transaction,
        tenantId,
      })
    return createdTransaction
  }

  async createAll(
    tenantId: string,
    transactions: TransactionDto[],
  ): Promise<any> {
    // Check that transaction with same orchestrate IDs have not already been created
    if (
      !(await this.checkAllValidInputs(
        tenantId,
        transactions.map(
          (transaction: TransactionDto) => transaction.identifierOrchestrateId,
        ),
      ))
    ) {
      const error = 'Invalid inputs.'
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    const createdTransactions: Transaction[] =
      await this.transactionRepository.save(
        transactions.map((transaction: TransactionDto) => {
          return {
            ...transaction,
            tenantId,
          }
        }),
      )
    return createdTransactions
  }

  async find(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<Transaction[]> {
    if (id) {
      return await this.transactionRepository.find({
        where: { tenantId, id },
        order: { createdAt: 'DESC' },
      })
    } else if (field === 'identifierOrchestrateIdBatch' && value) {
      return await this.transactionRepository.find({
        where: { tenantId, ['identifierOrchestrateId']: In(JSON.parse(value)) },
        order: { createdAt: 'DESC' },
      })
    } else if (field && value) {
      return await this.transactionRepository.find({
        where: { tenantId, [field]: value },
        order: { createdAt: 'DESC' },
      })
    } else {
      return await this.transactionRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      })
    }
  }

  async findOne(
    tenantId: string,
    id: number,
    field: string,
    value: string,
  ): Promise<Transaction> {
    const transactionsList: Transaction[] = await this.find(
      tenantId,
      id,
      field,
      value,
    )
    return transactionsList.length > 0 ? transactionsList[0] : undefined
  }

  async update(
    tenantId: string,
    id: number,
    transaction: TransactionDto,
  ): Promise<Transaction> {
    // Find the transaction
    const targetTransaction: Transaction =
      await this.transactionRepository.findOne({ where: { id } })

    // If it exists, update it
    if (targetTransaction) {
      // Test if transaction belongs to the expected tenant
      checkTenantId(tenantId, targetTransaction.tenantId)

      // Check if inputs are valid
      await this.checkValidInputs(
        tenantId,
        id,
        transaction.identifierOrchestrateId,
      )

      try {
        const updatedTransaction: Transaction =
          await this.transactionRepository.save({ ...transaction, id })
        return updatedTransaction
      } catch (error) {
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error,
          },
          HttpStatus.BAD_REQUEST,
        )
      }
    } else {
      const error = `Unable to find the transaction with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async delete(tenantId: string, id: number): Promise<{ message: string }> {
    // Find the transaction
    const targetTransaction: Transaction =
      await this.transactionRepository.findOne({ where: { id } })

    if (targetTransaction) {
      // Test if transaction belongs to the expected tenant
      checkTenantId(tenantId, targetTransaction.tenantId)

      const { affected } = await this.transactionRepository.delete(id)
      if (affected > 0) {
        const message = `${affected} deleted transaction(s).`
        this.logger.info(message)
        return { message }
      } else {
        const error = `Unable to delete the transaction with id=${id}`
        this.logger.error(error)
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error,
          },
          HttpStatus.NOT_FOUND,
        )
      }
    } else {
      const error = `Unable to find the transaction with id=${id}`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  async deleteByTenant(tenantId: string): Promise<{ [key: string]: number }> {
    requireTenantId(tenantId)

    const { affected } = await this.transactionRepository.delete({ tenantId })

    const message = `${affected} deleted transaction(s).`
    this.logger.info(message)
    return { deletedTransactionsTotal: affected }
  }

  async checkValidInputs(
    tenantId: string,
    objectId,
    orchestrateId,
  ): Promise<boolean> {
    const transactionsWithSameOrchestrateId: Array<Transaction> =
      await this.find(
        tenantId,
        undefined,
        'identifierOrchestrateId',
        orchestrateId,
      )

    let problem: boolean
    if (objectId) {
      // If 'objectId', then it means it is an object update
      if (transactionsWithSameOrchestrateId.length > 1) {
        problem = true
      } else if (transactionsWithSameOrchestrateId.length === 1) {
        if (transactionsWithSameOrchestrateId[0].id !== objectId) {
          problem = true
        } else {
          problem = false
        }
      } else {
        problem = false
      }
    } else {
      // If not 'objectId', then it means it is an object creation
      if (transactionsWithSameOrchestrateId.length > 0) {
        problem = true
      } else {
        problem = false
      }
    }

    if (problem) {
      const error = `Transaction with orchestrateId: ${orchestrateId} already exists, please choose another ID`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    } else {
      return true
    }
  }

  async checkAllValidInputs(
    tenantId: string,
    orchestrateIds,
  ): Promise<boolean> {
    const transactionsWithSameOrchestrateIds: Array<Transaction> =
      await this.find(
        tenantId,
        undefined,
        'identifierOrchestrateIdBatch',
        JSON.stringify(orchestrateIds),
      )

    if (transactionsWithSameOrchestrateIds.length) {
      const orchestrateIds = transactionsWithSameOrchestrateIds.map(
        (t) => t.identifierOrchestrateId,
      )
      const error = `Transaction with orchestrateIds: ${orchestrateIds} already exists, please choose another ID(s)`
      this.logger.error(error)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error,
        },
        HttpStatus.BAD_REQUEST,
      )
    }

    return true
  }
}
