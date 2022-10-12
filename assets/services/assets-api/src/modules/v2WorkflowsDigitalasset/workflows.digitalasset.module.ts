import { forwardRef, Module } from '@nestjs/common';

import { WorkFlowsDigitalAssetController } from './workflows.digitalasset.controller';
import { WorkFlowsDirectIssuanceService } from './workflows.digitalasset.service/directIssuance';
import { WorkFlowsIndirectIssuanceService } from './workflows.digitalasset.service/indirectIssuance';
import { WorkFlowsPreIssuanceService } from './workflows.digitalasset.service/preIssuance';
import { V2WorkflowsGenericModule } from 'src/modules/v2WorkflowTemplate/workflows.template.module';
import { V2TransactionModule } from 'src/modules/v2Transaction/transaction.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2BalanceModule } from 'src/modules/v2Balance/balance.module';
import { WorkFlowsFundCreationService } from './workflows.digitalasset.service/assetCreation';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { V2NetworkModule } from 'src/modules/v2Network/network.module';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/index';
import { WorkFlowsPrimaryTradeService } from './workflows.digitalasset.service/primaryTrade';
import { WorkFlowsNavManagementService } from './workflows.digitalasset.service/navManagement';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2NavModule } from 'src/modules/v2Nav/nav.module';
import { V2CycleModule } from 'src/modules/v2Cycle/cycle.module';
import { V2AssetDataModule } from 'src/modules/v2AssetData/asset.data.module';
import { OrderHelperService } from 'src/modules/v2Order/order.service/helper';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';
import { V2FeesModule } from 'src/modules/v2Fees/fees.module';
import { WorkFlowsSecondaryTradeService } from './workflows.digitalasset.service/secondaryTrade';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { WorkFlowsOfferService } from './workflows.digitalasset.service/offer';
import { V2ActionModule } from 'src/modules/v2Action/action.module';
import { V2OfferModule } from 'src/modules/v2Offer/offer.module';
import { V2KYCWorkflowModule } from '../v2KYCWorkflow/kyc.workflow.module';
import { V2ConfigModule } from '../v2Config/config.module';
import { ApiReferenceDataCallService } from '../v2ApiCall/api.call.service/referencedata';
import { WorkFlowsEventService } from './workflows.digitalasset.service/event';
import { M2mTokenModule } from '@codefi-assets-and-payments/auth';
import { V2OrderModule } from 'src/modules/v2Order/order.module';

@Module({
  controllers: [WorkFlowsDigitalAssetController],
  providers: [
    WorkFlowsPrimaryTradeService,
    WorkFlowsSecondaryTradeService,
    WorkFlowsFundCreationService,
    WorkFlowsDirectIssuanceService,
    WorkFlowsIndirectIssuanceService,
    WorkFlowsNavManagementService,
    WorkFlowsPreIssuanceService,
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowTransactionService,
    ApiReferenceDataCallService,
    ApiCallHelperService,
    OrderHelperService,
    WorkFlowsOfferService,
    WorkFlowsEventService,
  ],
  imports: [
    M2mTokenModule,
    V2TokenModule,
    V2WorkflowsGenericModule,
    forwardRef(() => V2TransactionModule),
    V2LinkModule,
    V2NetworkModule,
    V2WalletModule,
    V2EthModule,
    V2BalanceModule,
    V2ApiCallModule,
    V2EntityModule,
    V2NavModule,
    V2CycleModule,
    V2AssetDataModule,
    V2KYCTemplateModule,
    V2FeesModule,
    V2PartitionModule,
    V2KYCWorkflowModule,
    V2UserModule,
    V2ConfigModule,
    V2ActionModule,
    V2OfferModule,
    V2OrderModule,
  ],
  exports: [
    WorkFlowsPreIssuanceService,
    WorkFlowsFundCreationService,
    WorkFlowsSecondaryTradeService,
  ],
})
export class V2WorkFlowsDigitalAssetModule {}
