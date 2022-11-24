import { Module } from '@nestjs/common';

// Controller
import { UserController } from './user.controller';

// Providers
import { UserHelperService } from './user.service';
import { UserCreationService } from './user.service/createUser';
import { UserRetrievalService } from './user.service/retrieveUser';
import { UserUpdateService } from './user.service/updateUser';
import { UserDeletionService } from './user.service/deleteUser';
import { UserListingService } from './user.service/listAllUsers';

// Imported modules
import { V2BalanceModule } from 'src/modules/v2Balance/balance.module';
import { V2EthModule } from 'src/modules/v2Eth/eth.module';
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2NetworkModule } from 'src/modules/v2Network/network.module';
import { V2PartitionModule } from 'src/modules/v2Partition/partition.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2KYCDataModule } from 'src/modules/v2KYCData/kyc.data.module';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';
import { UserVehiclesListingService } from './user.service/listAllUserVehicles';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiCallHelperService } from 'src/modules/v2ApiCall/api.call.service/index';
import { V2RoleModule } from 'src/modules/v2Role/role.module';
import { V2EmailModule } from 'src/modules/v2Email/email.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2ConfigModule } from 'src/modules/v2Config/config.module';
import { WorkflowInstanceService } from '../v2WorkflowInstance/workflow.instance.service';
import { M2mTokenModule } from '@consensys/auth';

@Module({
  controllers: [UserController],
  providers: [
    UserListingService,
    UserVehiclesListingService,
    UserCreationService,
    UserRetrievalService,
    UserUpdateService,
    UserDeletionService,
    UserHelperService,
    ApiWorkflowWorkflowInstanceService,
    ApiCallHelperService,
    WorkflowInstanceService,
  ],
  imports: [
    M2mTokenModule,
    V2BalanceModule,
    V2EntityModule,
    V2EthModule,
    V2KYCDataModule,
    V2LinkModule,
    V2NetworkModule,
    V2PartitionModule,
    V2WalletModule,
    V2ApiCallModule,
    V2KYCTemplateModule,
    V2RoleModule,
    V2EmailModule,
    V2ConfigModule,
  ],
  exports: [
    UserCreationService,
    UserListingService,
    UserRetrievalService,
    UserHelperService,
  ],
})
export class V2UserModule {}
