import { forwardRef, Module } from '@nestjs/common';

import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { ApiNetworkCallService } from 'src/modules/v2ApiCall/api.call.service/network';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service';
import { EmailService } from 'src/modules/v2Email/email.service';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ApiWorkflowUtilsService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  ApiMetadataUtilsService,
  ApiMetadataCallService,
} from 'src/modules/v2ApiCall/api.call.service/metadata';
import { ApiKycUtilsService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { UserVehiclesListingService } from 'src/modules/v2User/user.service/listAllUserVehicles';
import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { M2mTokenModule } from '@codefi-assets-and-payments/auth';
import { V2UserModule } from 'src/modules/v2User/user.module';

@Module({
  controllers: [NetworkController],
  providers: [
    NetworkService,
    ApiNetworkCallService,
    ApiCallHelperService,
    EmailService,
    ConfigService,
    ApiWorkflowUtilsService,
    ApiMetadataUtilsService,
    ApiMetadataCallService,
    ApiKycUtilsService,
    KYCTemplateService,
    UserVehiclesListingService,
    LinkService,
    WalletService,
    EthHelperService,
    PartitionService,
  ],
  imports: [M2mTokenModule, V2ApiCallModule, forwardRef(() => V2UserModule)],
  exports: [NetworkService],
})
export class V2NetworkModule {}
