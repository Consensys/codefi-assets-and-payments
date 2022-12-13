import { Commands, IEntityDeleteCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { EntityService } from '../services/EntityService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class EntityDeleteCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.entityDeleteCommand.getMessageName()
  groupId: string = getGroupId(EntityDeleteCommandConsumer.name)

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly entityService: EntityService,
  ) {
    this.logger.setContext(EntityDeleteCommandConsumer.name)
  }

  async onMessage(decodedMessage: IEntityDeleteCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.entityService.delete(
        decodedMessage.tenantId,
        decodedMessage.entityId,
      )

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
    this.logger.info(`Stopping ${EntityDeleteCommandConsumer.name}`)
  }
}
