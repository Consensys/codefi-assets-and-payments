import { Commands, ITenantDeleteCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { TenantService } from '../services/TenantService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class TenantDeleteCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.tenantDeleteCommand.getMessageName()
  groupId: string = getGroupId(TenantDeleteCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private tenantService: TenantService,
  ) {
    this.logger.setContext(TenantDeleteCommandConsumer.name)
  }

  async onMessage(decodedMessage: ITenantDeleteCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.tenantService.delete(decodedMessage.tenantId)

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
    this.logger.info(`Stopping ${TenantDeleteCommandConsumer.name}`)
  }
}
