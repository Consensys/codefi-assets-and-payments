import { Module } from '@nestjs/common';

import { KYCEssentialElementController } from './kyc.element.controller';
import { KYCElementService } from './kyc.element.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';

@Module({
  controllers: [KYCEssentialElementController],
  providers: [KYCElementService],
  imports: [V2ApiCallModule],
})
export class V2KYCElementModule {}
