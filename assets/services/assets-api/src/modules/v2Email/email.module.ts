import { Module } from '@nestjs/common';

import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { ApiCallHelperService } from '../v2ApiCall/api.call.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService, ApiCallHelperService],
  imports: [V2ApiCallModule],
  exports: [EmailService],
})
export class V2EmailModule {}
