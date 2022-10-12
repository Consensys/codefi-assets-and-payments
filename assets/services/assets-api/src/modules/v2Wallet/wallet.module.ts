import { Module } from '@nestjs/common';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [WalletController],
  providers: [WalletService],
  imports: [V2EthModule, V2ApiCallModule],
  exports: [WalletService],
})
export class V2WalletModule {}
