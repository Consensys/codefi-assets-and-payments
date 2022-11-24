import { Controller, Post, Body, Query } from '@nestjs/common'
import { ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'

import { TransactionsService } from '../services/TransactionsService'
import { TransactionDto } from '../models/dto/TransactionDto'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { transactionsSchema } from '../validation/transactionSchema'
import { IdentityDto } from '../models/dto/IdentityDto'
import { identitySchema } from '../validation/identitySchema'
import { Transaction } from 'src/models/TransactionEntity'

@ApiTags('v2/transactions')
@Controller('v2/transactions')
export class TransactionsControllerV2 {
  constructor(
    private transactionsService: TransactionsService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(TransactionsControllerV2.name)
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: TransactionDto })
  async createAll(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(transactionsSchema))
    transactions: TransactionDto[],
  ): Promise<any> {
    const createdTransactions = await this.transactionsService.createAll(
      identityQuery.tenantId,
      transactions,
    )
    this.logger.info(
      `Batch of ${transactions.length} transactions successfully created`,
      {
        tenantId: createdTransactions.tenantId,
        ids: transactions.map((transaction: Transaction) => transaction.id),
      },
    )
    return createdTransactions
  }
}
