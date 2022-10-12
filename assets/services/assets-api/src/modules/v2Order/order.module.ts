import { forwardRef, Module } from '@nestjs/common';

import { OrderHelperService } from './order.service/helper';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { OrderController } from './order.controller';
import { V2WorkflowInstanceModule } from 'src/modules/v2WorkflowInstance/workflow.instance.module';
import { OrderService } from './order.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2LinkModule } from '../v2Link/link.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderHelperService],
  imports: [
    V2WorkflowInstanceModule,
    forwardRef(() => V2TransactionModule),
    V2ApiCallModule,
    V2EntityModule,
    V2LinkModule,
  ],
  exports: [OrderService, OrderHelperService],
})
export class V2OrderModule {}
