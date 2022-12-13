import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger'
import { NestJSPinoLogger } from '@consensys/observability'

import { TransactionsService } from '../services/TransactionsService'
import { TransactionDto } from '../models/dto/TransactionDto'
import { Transaction } from '../models/TransactionEntity'
import { JoiValidationPipe } from '../validation/JoiValidationPipe'
import { transactionSchema } from '../validation/transactionSchema'
import { IdentityDto } from '../models/dto/IdentityDto'
import { identitySchema } from '../validation/identitySchema'

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private readonly logger: NestJSPinoLogger,
  ) {
    logger.setContext(TransactionsController.name)
  }

  @Post()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiBody({ type: TransactionDto })
  async create(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Body(new JoiValidationPipe(transactionSchema)) transaction: TransactionDto,
  ): Promise<any> {
    const createdTransaction = await this.transactionsService.create(
      identityQuery.tenantId,
      transaction,
    )
    this.logger.info('Transaction successfully created', {
      tenantId: createdTransaction.tenantId,
      id: createdTransaction.id,
    })
    return createdTransaction
  }

  @Get()
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'id', required: false })
  @ApiQuery({ name: 'field', required: false })
  @ApiQuery({ name: 'value', required: false })
  async find(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Query('id') id: number,
    @Query('field') field: string,
    @Query('value') value: string,
  ): Promise<Transaction[]> {
    return await this.transactionsService.find(
      identityQuery.tenantId,
      id,
      field,
      value,
    )
  }

  @Put(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: TransactionDto })
  async update(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
    @Body(new JoiValidationPipe(transactionSchema)) transaction: TransactionDto,
  ): Promise<any> {
    this.logger.info('Transaction updated', { id })
    return await this.transactionsService.update(
      identityQuery.tenantId,
      id,
      transaction,
    )
  }

  @Delete(':id')
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiParam({ name: 'id', required: true })
  async delete(
    @Query(new JoiValidationPipe(identitySchema)) identityQuery: IdentityDto,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.transactionsService.delete(identityQuery.tenantId, id)
  }
}
