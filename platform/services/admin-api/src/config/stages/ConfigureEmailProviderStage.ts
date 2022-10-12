import { ConfigStageRequest, IConfigStage } from '../types/ConfigStage'
import { ConfigConstants } from '../ConfigConstants'
import cfg from '../../config'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ConfigureEmailProviderStage implements IConfigStage {
  async run(request: ConfigStageRequest) {
    const { managementClient, logger } = request

    logger.info('Retrieving email provider')

    try {
      await managementClient.getEmailProvider()
      logger.info('Email provider already configured')
      return
    } catch (error) {
      if (error.statusCode !== 404) {
        logger.error('Unknown error when retrieving email provider')
        throw error
      }
    }

    logger.info('Configuring email provider')

    await managementClient.configureEmailProvider({
      name: ConfigConstants.EMAIL_PROVIDER_NAME,
      credentials: {
        api_key: cfg().initialConfig.emailProviderApiKey,
      },
    })

    logger.info('Configured email provider')
  }
}
