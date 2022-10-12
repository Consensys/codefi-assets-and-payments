import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ConfigConstants } from '../ConfigConstants'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ConfigureTenantSettingsStage implements IConfigStage {
  async run(request: ConfigStageRequest) {
    const { managementClient, logger } = request

    logger.info('Updating tenant settings')

    await managementClient.updateTenantSettings({
      default_directory: ConfigConstants.CREATE_USERS_CONNECTION_NAME,
    })

    logger.info('Updated tenant settings')
  }
}
