import { Module } from '@nestjs/common';

import { UtilsController } from './utils.controller';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { IdentityService } from './utils.service/identity';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2ConfigModule } from 'src/modules/v2Config/config.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { TenantService } from './utils.service/tenant';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';
import { V2EmailModule } from 'src/modules/v2Email/email.module';
import { V2TokenModule } from 'src/modules/v2Token/token.module';
import { ApiWorkflowUtilsService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiMetadataUtilsService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { ApiKycUtilsService } from 'src/modules/v2ApiCall/api.call.service/kyc';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { ApiNetworkCallService } from 'src/modules/v2ApiCall/api.call.service/network';
import { M2mTokenModule } from '@codefi-assets-and-payments/auth';
import { V2UsecaseModule } from '../v2Usecase/usecase.module';
import { TenantRoleMigrationService } from './utils.service/tenantRoleMigration';
import { EntityMigrationService } from './utils.service/entityMigration';
import { NestedUserFixService } from './utils.service/nestedUserFix';
import { DevNamespaceUsersFixService } from './utils.service/devNamespaceUsersFix';
import { DemoNamespaceUsersFixService } from './utils.service/demoNamespaceUsersFix';
import { UsageMetricsService } from './utils.service/usageMetrics';
import { NetworkSelectionService } from './utils.service/networkSelection';

@Module({
  controllers: [UtilsController],
  providers: [
    IdentityService,
    TenantService,
    ApiWorkflowUtilsService,
    ApiMetadataUtilsService,
    ApiKycUtilsService,
    ApiCallHelperService,
    NetworkService,
    ApiNetworkCallService,
    TenantRoleMigrationService,
    EntityMigrationService,
    NestedUserFixService,
    DevNamespaceUsersFixService,
    DemoNamespaceUsersFixService,
    UsageMetricsService,
    NetworkSelectionService,
  ],
  imports: [
    V2UserModule,
    V2EthModule,
    V2ApiCallModule,
    V2WalletModule,
    V2ConfigModule,
    V2PartitionModule,
    V2KYCTemplateModule,
    V2EmailModule,
    V2TokenModule,
    M2mTokenModule,
    V2UsecaseModule,
  ],
})
export class V2UtilsModule {}
