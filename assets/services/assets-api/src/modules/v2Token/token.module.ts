import { forwardRef, Module } from '@nestjs/common';

import { TokenController } from './token.controller';
import { TokenHelperService } from './token.service';
import { TokenListingService } from './token.service/listAllTokens';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { TokenRetrievalService } from './token.service/retrieveToken';
import { TokenCreationService } from './token.service/createToken';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { TokenUpdateService } from './token.service/updateToken';
import { TokenDeletionService } from './token.service/deleteToken';
import { V2KYCDataModule } from 'src/modules/v2KYCData/kyc.data.module';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/index';
import { V2RoleModule } from 'src/modules/v2Role/role.module';
import { V2WorkflowsGenericModule } from 'src/modules/v2WorkflowTemplate/workflows.template.module';
import { V2NavModule } from 'src/modules/v2Nav/nav.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2CycleModule } from 'src/modules/v2Cycle/cycle.module';
import { V2BalanceModule } from 'src/modules/v2Balance/balance.module';
import { V2AssetDataModule } from 'src/modules/v2AssetData/asset.data.module';
import { V2ConfigModule } from 'src/modules/v2Config/config.module';
import { V2NetworkModule } from 'src/modules/v2Network/network.module';
import { ApiReferenceDataCallService } from '../v2ApiCall/api.call.service/referencedata';
import { V2WorkflowInstanceModule } from '../v2WorkflowInstance/workflow.instance.module';
import { M2mTokenModule } from '@consensys/auth';

@Module({
  controllers: [TokenController],
  providers: [
    TokenListingService,
    TokenCreationService,
    TokenRetrievalService,
    TokenUpdateService,
    TokenDeletionService,
    TokenHelperService,
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowWorkflowTemplateService,
    ApiWorkflowTransactionService,
    ApiReferenceDataCallService,
    ApiCallHelperService,
  ],
  imports: [
    M2mTokenModule,
    V2UserModule,
    V2LinkModule,
    V2WalletModule,
    V2EthModule,
    V2PartitionModule,
    forwardRef(() => V2TransactionModule),
    V2ApiCallModule,
    V2KYCDataModule,
    V2KYCTemplateModule,
    V2RoleModule,
    V2WorkflowsGenericModule,
    V2NavModule,
    V2EntityModule,
    V2CycleModule,
    V2BalanceModule,
    V2AssetDataModule,
    V2ConfigModule,
    V2NetworkModule,
    V2WorkflowInstanceModule,
  ],
  exports: [
    TokenListingService,
    TokenCreationService,
    TokenRetrievalService,
    TokenUpdateService,
    TokenDeletionService,
    TokenHelperService,
  ],
})
export class V2TokenModule {}
