import { Commands, ITenantUpdateCommand } from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { TenantService } from '../services/TenantService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class TenantUpdateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.tenantUpdateCommand.getMessageName()
  groupId: string = getGroupId(TenantUpdateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private tenantService: TenantService,
  ) {
    this.logger.setContext(TenantUpdateCommandConsumer.name)
  }

  async onMessage(decodedMessage: ITenantUpdateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.tenantService.update(decodedMessage.tenantId, {
        name: decodedMessage.name,
        products: decodedMessage.products,
        defaultNetworkKey: decodedMessage.defaultNetworkKey,
        metadata: JSON.parse(decodedMessage.metadata),
        stores: decodedMessage.stores,
      })

      this.logger.info(
        `Message processed successfully: ${JSON.stringify(result)}`,
      )
    } catch (error) {
      this.logger.error(
        `Error processing message - Message: ${JSON.stringify(
          decodedMessage,
        )} - Error: ${JSON.stringify(error.message)}`,
      )
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${TenantUpdateCommandConsumer.name}`)
  }
}
