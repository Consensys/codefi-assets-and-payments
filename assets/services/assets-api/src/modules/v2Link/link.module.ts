import { forwardRef, Module } from '@nestjs/common';

import { LinkService } from './link.service';
import { V2WorkflowsGenericModule } from 'src/modules/v2WorkflowTemplate/workflows.template.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { V2BalanceModule } from 'src/modules/v2Balance/balance.module';
import { LinkController } from './link.controller';
import { V2EntityModule } from '../v2Entity/entity.module';

@Module({
  controllers: [LinkController],
  providers: [LinkService],
  imports: [
    V2WalletModule,
    V2WorkflowsGenericModule,
    V2ApiCallModule,
    V2PartitionModule,
    V2BalanceModule,
    forwardRef(() => V2EntityModule),
  ],
  exports: [LinkService],
})
export class V2LinkModule {}
