import { Module } from '@nestjs/common';

import { EthController } from './eth.controller';
import { EthHelperService } from './eth.service';
import { V2NetworkModule } from 'src/modules/v2Network/network.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [EthController],
  providers: [EthHelperService],
  imports: [V2NetworkModule, V2ApiCallModule],
  exports: [EthHelperService],
})
export class V2EthModule {}
