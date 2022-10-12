import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { TransactionsController } from '../controllers/TransactionsController'
import { TransactionsService } from '../services/TransactionsService'
import { Transaction } from '../models/TransactionEntity'
import { TransactionsControllerV2 } from 'src/controllers/TransactionsControllerV2'

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [TransactionsController, TransactionsControllerV2],
  providers: [TransactionsService],
})
export class TransactionsModule {}
