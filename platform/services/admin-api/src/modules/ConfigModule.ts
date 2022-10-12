import { Module } from '@nestjs/common'
import { Auth0Module } from './Auth0Module'
import { ConfigService } from '../config/ConfigService'
import { FileSystemModule } from './FileSystemModule'
import { ClientModule } from './ClientModule'
import { ConfigureEmailProviderStage } from '../config/stages/ConfigureEmailProviderStage'
import { ConfigureTenantSettingsStage } from '../config/stages/ConfigureTenantSettingsStage'
import { CreateActionsStage } from '../config/stages/CreateActionsStage'
import { CreateApisStage } from '../config/stages/CreateApisStage'
import { CreateApplicationsStage } from '../config/stages/CreateApplicationsStage'
import { CreateM2MClientsStage } from '../config/stages/CreateM2MClientsStage'
import { CreateRolesStage } from '../config/stages/CreateRolesStage'
import { CreateStackAdminStage } from '../config/stages/CreateStackAdminStage'

@Module({
  imports: [Auth0Module, ClientModule, FileSystemModule],
  providers: [
    ConfigureEmailProviderStage,
    ConfigureTenantSettingsStage,
    CreateActionsStage,
    CreateApisStage,
    CreateApplicationsStage,
    CreateM2MClientsStage,
    CreateRolesStage,
    CreateStackAdminStage,
    ConfigService,
  ],
})
export class ConfigModule {}
