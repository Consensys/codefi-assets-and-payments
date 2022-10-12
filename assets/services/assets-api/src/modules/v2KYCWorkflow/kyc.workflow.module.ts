import { Module } from '@nestjs/common';

import { KYCWorkflowHelperService } from './kyc.workflow.service';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2KycCheckModule } from 'src/modules/v2KYCCheck/kyc.check.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2WorkflowsGenericModule } from 'src/modules/v2WorkflowTemplate/workflows.template.module';
import { V2KYCDataModule } from 'src/modules/v2KYCData/kyc.data.module';
import { KYCWorkflowGenericService } from './kyc.workflow.service/workflow';
import { KYCWorkflowAllowListService } from './kyc.workflow.service/allowList';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2BalanceModule } from '../v2Balance/balance.module';
import { V2ConfigModule } from '../v2Config/config.module';

@Module({
  providers: [
    KYCWorkflowHelperService,
    KYCWorkflowGenericService,
    KYCWorkflowAllowListService,
  ],
  imports: [
    V2WorkflowsGenericModule,
    V2KYCDataModule,
    V2WalletModule,
    V2LinkModule,
    V2KycCheckModule,
    V2ApiCallModule,
    V2EntityModule,
    V2UserModule,
    V2BalanceModule,
    V2ConfigModule,
  ],
  exports: [
    KYCWorkflowHelperService,
    KYCWorkflowGenericService,
    KYCWorkflowAllowListService,
  ],
})
export class V2KYCWorkflowModule {}
