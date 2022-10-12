import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { ApiCallController } from './api.call.controller';
import { ApiCallHelperService } from './api.call.service';
import { ApiSCCallService } from './api.call.service/sc';
import { ApiKycCallService, ApiKycUtilsService } from './api.call.service/kyc';
import {
  ApiMetadataCallService,
  ApiMetadataUtilsService,
} from './api.call.service/metadata';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
  ApiWorkflowUtilsService,
} from './api.call.service/workflow';
import { ApiDocumentCallService } from './api.call.service/document';
import { ApiMailingCallService } from './api.call.service/mailing';
import { ApiDataFeedService } from './api.call.service/datafeed';
import { ApiAdminCallService } from './api.call.service/admin';
import { ConfigService } from '../v2Config/config.service';
import { AssetDataService } from '../v2AssetData/asset.data.service';
import { CycleService } from '../v2Cycle/cycle.service';
import { LinkService } from '../v2Link/link.service';
import { WalletService } from '../v2Wallet/wallet.service';
import { PartitionService } from '../v2Partition/partition.service';
import { EthHelperService } from '../v2Eth/eth.service';
import { NetworkService } from '../v2Network/network.service';
import { ApiNetworkCallService } from 'src/modules/v2ApiCall/api.call.service/network';
import { M2mTokenModule } from '@codefi-assets-and-payments/auth';
import { ApiEntityCallService } from './api.call.service/entity';
import { ApiExternalStorageCallService } from './api.call.service/externalStorage';
import { ApiWorkflowTransactionService } from './api.call.service/transactions';

@Module({
  controllers: [ApiCallController],
  providers: [
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowWorkflowTemplateService,
    ApiDataFeedService,
    ApiCallHelperService,
    ApiMetadataCallService,
    ApiSCCallService,
    ApiKycCallService,
    ApiDocumentCallService,
    ApiMailingCallService,
    ApiAdminCallService,
    ConfigService,
    ApiWorkflowUtilsService,
    ApiMetadataUtilsService,
    ApiKycUtilsService,
    AssetDataService,
    CycleService,
    LinkService,
    WalletService,
    PartitionService,
    EthHelperService,
    NetworkService,
    ApiNetworkCallService,
    ApiEntityCallService,
    ApiExternalStorageCallService,
    ApiWorkflowTransactionService,
  ],
  imports: [HttpModule, M2mTokenModule],
  exports: [
    ApiWorkflowWorkflowInstanceService,
    ApiWorkflowWorkflowTemplateService,
    ApiDataFeedService,
    ApiMetadataCallService,
    ApiSCCallService,
    ApiKycCallService,
    ApiDocumentCallService,
    ApiMailingCallService,
    ApiAdminCallService,
    LinkService,
    ApiEntityCallService,
    ApiExternalStorageCallService,
    ApiWorkflowTransactionService,
  ],
})
export class V2ApiCallModule {}
