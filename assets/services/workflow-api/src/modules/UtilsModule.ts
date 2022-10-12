import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UtilsController } from '../controllers/UtilsController'

import { TransactionsService } from '../services/TransactionsService'
import { Transaction } from '../models/TransactionEntity'

import { TransitionInstancesService } from '../services/TransitionInstancesService'
import { TransitionInstance } from '../models/TransitionInstanceEntity'

import { WorkflowInstancesService } from '../services/WorkflowInstancesService'
import { WorkflowInstance } from '../models/WorkflowInstanceEntity'

import { WorkflowTemplatesService } from '../services/WorkflowTemplatesService'
import { WorkflowTemplate } from '../models/WorkflowTemplateEntity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    TypeOrmModule.forFeature([TransitionInstance]),
    TypeOrmModule.forFeature([WorkflowInstance]),
    TypeOrmModule.forFeature([WorkflowTemplate]),
  ],
  controllers: [UtilsController],
  providers: [
    TransactionsService,
    TransitionInstancesService,
    WorkflowInstancesService,
    WorkflowTemplatesService,
  ],
})
export class UtilsModule {}
