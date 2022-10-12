import { Module } from '@nestjs/common';

import { AumController } from './aum.controller';
import { AumService } from './aum.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2TokenModule } from '../v2Token/token.module';

@Module({
  controllers: [AumController],
  providers: [AumService],
  imports: [V2ApiCallModule, V2TokenModule],
  exports: [AumService],
})
export class V2AumModule {}
