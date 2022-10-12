import { Module } from '@nestjs/common';

import { KYCEssentialDataController } from './kyc.data.controller';
import { KYCDataService } from './kyc.data.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2KycCheckModule } from 'src/modules/v2KYCCheck/kyc.check.module';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';

@Module({
  controllers: [KYCEssentialDataController],
  providers: [KYCDataService],
  imports: [
    V2KycCheckModule,
    V2KYCTemplateModule,
    V2LinkModule,
    V2ApiCallModule,
    V2EntityModule,
  ],
  exports: [KYCDataService],
})
export class V2KYCDataModule {}
