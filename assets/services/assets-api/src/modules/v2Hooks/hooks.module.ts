import { Module } from '@nestjs/common';

import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { V2WorkFlowsDigitalAssetModule } from 'src/modules/v2WorkflowsDigitalasset/workflows.digitalasset.module';
import { V2OrderModule } from 'src/modules/v2Order/order.module';
import { V2ApiCallModule } from '../v2ApiCall/api.call.module';

@Module({
  controllers: [HooksController],
  providers: [HooksService],
  imports: [
    V2TransactionModule,
    V2TokenModule,
    V2WorkFlowsDigitalAssetModule,
    V2OrderModule,
    V2ApiCallModule,
  ],
})
export class V2HooksModule {}
