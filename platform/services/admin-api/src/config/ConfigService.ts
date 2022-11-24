import { Auth0Service } from '../services/Auth0Service'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import cfg from '../config'
import { FileSystemInstance } from '../services/instances/FileSystemInstance'
import { ClientService } from '../services/ClientService'
import { ManagementClientExtended } from '../types/Auth0ManagementClientExtended'
import { CreateApisStage } from './stages/CreateApisStage'
import { ConfigureEmailProviderStage } from './stages/ConfigureEmailProviderStage'
import { ConfigStageRequest, IConfigStage } from './types/ConfigStage'
import { CreateActionsStage } from './stages/CreateActionsStage'
import { CreateRolesStage } from './stages/CreateRolesStage'
import { CreateApplicationsStage } from './stages/CreateApplicationsStage'
import { CreateStackAdminStage } from './stages/CreateStackAdminStage'
import { CreateM2MClientsStage } from './stages/CreateM2MClientsStage'
import { ConfigureTenantSettingsStage } from './stages/ConfigureTenantSettingsStage'

@Injectable()
export class ConfigService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly fs: FileSystemInstance,
    private auth0Service: Auth0Service,
    private clientsService: ClientService,
    private configureEmailProviderStage: ConfigureEmailProviderStage,
    private configureTenantSettingsStage: ConfigureTenantSettingsStage,
    private createActionsStage: CreateActionsStage,
    private createApisStage: CreateApisStage,
    private createApplicationsStage: CreateApplicationsStage,
    private createM2MClientsStage: CreateM2MClientsStage,
    private createRolesStage: CreateRolesStage,
    private createStackAdminStage: CreateStackAdminStage,
  ) {
    logger.setContext(ConfigService.name)
  }

  async performConfiguration() {
    const isEnabled = cfg().initialConfig.enabled

    if (isEnabled) {
      this.logger.info('Performing initial configuration')
    } else {
      this.logger.info('Skipping initial configuration')
    }

    const stages: IConfigStage[] = isEnabled
      ? [
          this.createApisStage,
          this.configureEmailProviderStage,
          this.createM2MClientsStage,
          this.createActionsStage,
          this.createRolesStage,
          this.createApplicationsStage,
          this.createStackAdminStage,
          this.configureTenantSettingsStage,
        ]
      : [this.createStackAdminStage]

    const managementClient =
      (await this.auth0Service.getManagementClient()) as ManagementClientExtended

    const request: ConfigStageRequest = {
      managementClient,
      clientService: this.clientsService,
      fs: this.fs,
      logger: this.logger,
    }

    for (const stage of stages) {
      const stageName = stage.constructor.name
      this.logger.info(`Started config stage - ${stageName}`)

      await stage.run(request)

      this.logger.info(`Completed config stage - ${stageName}`)
    }
  }
}
