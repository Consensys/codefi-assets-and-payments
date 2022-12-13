import { Commands, IEntityCreateCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { EntityService } from '../services/EntityService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class EntityCreateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.entityCreateCommand.getMessageName()
  groupId: string = getGroupId(EntityCreateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private entityService: EntityService,
  ) {
    this.logger.setContext(EntityCreateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IEntityCreateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.entityService.create(
        {
          id: decodedMessage.entityId,
          tenantId: decodedMessage.tenantId,
          name: decodedMessage.name,
          metadata: JSON.parse(decodedMessage.metadata),
          initialAdmins: decodedMessage.initialAdmins,
          initialWallets: decodedMessage.initialWallets?.map((wallet) => ({
            address: wallet.address,
            type: wallet.type,
            metadata: JSON.parse(wallet.metadata),
          })),
          defaultWallet: decodedMessage.defaultWallet,
          stores: decodedMessage.stores,
        },
        decodedMessage.createdBy,
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
    this.logger.info(`Stopping ${EntityCreateCommandConsumer.name}`)
  }
}
