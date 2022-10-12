import { Module } from '@nestjs/common';

import { KYCEssentialTemplateController } from './kyc.template.controller';
import { KYCTemplateService } from './kyc.template.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2KYCElementModule } from '../v2KYCElement/kyc.element.module';

@Module({
  controllers: [KYCEssentialTemplateController],
  providers: [KYCTemplateService],
  imports: [V2ApiCallModule, V2KYCElementModule],
  exports: [KYCTemplateService],
})
export class V2KYCTemplateModule {}
