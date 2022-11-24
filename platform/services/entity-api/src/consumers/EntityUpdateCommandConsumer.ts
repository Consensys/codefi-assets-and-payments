import { Commands, IEntityUpdateCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { EntityService } from '../services/EntityService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class EntityUpdateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.entityUpdateCommand.getMessageName()
  groupId: string = getGroupId(EntityUpdateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private entityService: EntityService,
  ) {
    this.logger.setContext(EntityUpdateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IEntityUpdateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.entityService.update(
        decodedMessage.tenantId,
        decodedMessage.entityId,
        {
          name: decodedMessage.name,
          metadata: JSON.parse(decodedMessage.metadata),
          defaultWallet: decodedMessage.defaultWallet,
          stores: decodedMessage.stores,
        },
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
    this.logger.info(`Stopping ${EntityUpdateCommandConsumer.name}`)
  }
}
