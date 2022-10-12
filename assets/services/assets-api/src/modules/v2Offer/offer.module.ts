import { forwardRef, Module } from '@nestjs/common';

import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { OfferController } from './offer.controller';
import { V2WorkflowInstanceModule } from 'src/modules/v2WorkflowInstance/workflow.instance.module';
import { OfferService } from './offer.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2OrderModule } from 'src/modules/v2Order/order.module';

@Module({
  controllers: [OfferController],
  providers: [OfferService],
  imports: [
    V2WorkflowInstanceModule,
    forwardRef(() => V2TransactionModule),
    V2ApiCallModule,
    V2EntityModule,
    V2OrderModule,
  ],
  exports: [OfferService],
})
export class V2OfferModule {}
