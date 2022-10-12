import { forwardRef, Module } from '@nestjs/common';

import { TransactionController } from './transaction.controller';
import { TransactionHelperService } from './transaction.service';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { V2KycCheckModule } from 'src/modules/v2KYCCheck/kyc.check.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { TokenTxHelperService } from './transaction.service/token';
import { V2WorkflowsGenericModule } from 'src/modules/v2WorkflowTemplate/workflows.template.module';
import { V2BalanceModule } from 'src/modules/v2Balance/balance.module';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/index';
import { V2ConfigModule } from 'src/modules/v2Config/config.module';
import { V2NavModule } from 'src/modules/v2Nav/nav.module';
import { V2ActionModule } from 'src/modules/v2Action/action.module';
import { V2WorkFlowsDigitalAssetModule } from 'src/modules/v2WorkflowsDigitalasset/workflows.digitalasset.module';

@Module({
  controllers: [TransactionController],
  providers: [
    TransactionHelperService,
    TokenTxHelperService,
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowTransactionService,
    ApiCallHelperService,
  ],
  imports: [
    V2BalanceModule,
    V2UserModule,
    V2EthModule,
    V2ApiCallModule,
    V2WalletModule,
    V2PartitionModule,
    V2KycCheckModule,
    V2LinkModule,
    V2WorkflowsGenericModule,
    V2ConfigModule,
    V2NavModule,
    V2ActionModule,
    forwardRef(() => V2WorkFlowsDigitalAssetModule),
  ],
  exports: [TransactionHelperService, TokenTxHelperService],
})
export class V2TransactionModule {}
