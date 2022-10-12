import { Module } from '@nestjs/common';

import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2NetworkModule } from 'src/modules/v2Network/network.module';

@Module({
  controllers: [BalanceController],
  providers: [BalanceService],
  imports: [
    V2WalletModule,
    V2EthModule,
    V2PartitionModule,
    V2ApiCallModule,
    V2NetworkModule,
  ],
  exports: [BalanceService],
})
export class V2BalanceModule {}
