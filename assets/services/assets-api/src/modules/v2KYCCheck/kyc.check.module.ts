import { forwardRef, Module } from '@nestjs/common';

import { KycCheckController } from './kyc.check.controller';
import { KycCheckService } from './kyc.check.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';

@Module({
  controllers: [KycCheckController],
  providers: [KycCheckService],
  imports: [
    forwardRef(() => V2LinkModule),
    V2ApiCallModule,
    V2KYCTemplateModule,
  ],
  exports: [KycCheckService],
})
export class V2KycCheckModule {}
