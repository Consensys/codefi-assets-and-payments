import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CodefiLoggerModule } from '@codefi-assets-and-payments/observability'

import * as ormconfig from 'src/ormconfig'
import { HealthCheckModule } from './HealthCheckModule'
import { HealthModule } from './HealthModule'
import { TransactionsModule } from './TransactionsModule'
import { TransitionInstancesModule } from './TransitionInstancesModule'
import { WorkflowInstancesModule } from './WorkflowInstancesModule'
import { WorkflowTemplatesModule } from './WorkflowTemplatesModule'
import { UtilsModule } from './UtilsModule'

@Module({
  imports: [
    ConfigModule.forRoot(),
    CodefiLoggerModule.forRoot(),
    HealthModule,
    TypeOrmModule.forRoot(ormconfig),
    TransactionsModule,
    WorkflowInstancesModule,
    TransitionInstancesModule,
    WorkflowTemplatesModule,
    HealthCheckModule,
    UtilsModule,
  ],
  controllers: [],
})
export class AppModule {}
