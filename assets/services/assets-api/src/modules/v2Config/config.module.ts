import { Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService],
  imports: [V2ApiCallModule],
  exports: [ConfigService],
})
export class V2ConfigModule {}
