import { Module } from '@nestjs/common';

import { KYCWorkflowPlatformRelatedController } from './kyc.workflow.platform.controller';
import { KYCWorkflowPlatformRelatedService } from './kyc.workflow.platform.service';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2KycCheckModule } from 'src/modules/v2KYCCheck/kyc.check.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2KYCWorkflowModule } from 'src/modules/v2KYCWorkflow/kyc.workflow.module';

@Module({
  controllers: [KYCWorkflowPlatformRelatedController],
  providers: [KYCWorkflowPlatformRelatedService],
  imports: [
    V2KYCWorkflowModule,
    V2WalletModule,
    V2LinkModule,
    V2KycCheckModule,
    V2ApiCallModule,
  ],
})
export class V2KYCWorkflowPlatformRelatedModule {}
