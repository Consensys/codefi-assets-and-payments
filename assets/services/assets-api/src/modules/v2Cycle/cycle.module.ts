import { Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { CycleController } from './cycle.controller';
import { CycleService } from './cycle.service';

@Module({
  controllers: [CycleController],
  providers: [CycleService],
  imports: [V2ApiCallModule],
  exports: [CycleService],
})
export class V2CycleModule {}
