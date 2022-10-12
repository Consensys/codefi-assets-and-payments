import { Module } from '@nestjs/common';

// Controller
import { ProjectController } from './project.controller';

// Providers
import { ProjectListingService } from './project.service/listAllProjects';
import { ProjectCreationService } from './project.service/createProject';
import { ProjectRetrievalService } from './project.service/retrieveProject';
import { ProjectUpdateService } from './project.service/updateProject';
import { ProjectDeletionService } from './project.service/deleteProject';
import { ProjectHelperService } from './project.service';

// Imported modules
import { V2LinkModule } from 'src/modules/v2Link/link.module';
import { V2WalletModule } from 'src/modules/v2Wallet/wallet.module';
import { V2ApiCallModule } from 'src/modules/v2ApiCall/api.call.module';
import { V2KYCDataModule } from 'src/modules/v2KYCData/kyc.data.module';
import { V2EntityModule } from 'src/modules/v2Entity/entity.module';
import { V2UserModule } from 'src/modules/v2User/user.module';
import { V2KYCTemplateModule } from 'src/modules/v2KYCTemplate/kyc.template.module';

@Module({
  controllers: [ProjectController],
  providers: [
    ProjectListingService,
    ProjectCreationService,
    ProjectRetrievalService,
    ProjectUpdateService,
    ProjectDeletionService,
    ProjectHelperService,
  ],
  imports: [
    V2KYCTemplateModule,
    V2ApiCallModule,
    V2LinkModule,
    V2WalletModule,
    V2EntityModule,
    V2KYCDataModule,
    V2UserModule,
    V2LinkModule,
  ],
  exports: [
    ProjectCreationService,
    ProjectListingService,
    ProjectRetrievalService,
  ],
})
export class V2ProjectModule {}
