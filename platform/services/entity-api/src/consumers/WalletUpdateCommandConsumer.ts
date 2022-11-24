import { Commands, IWalletUpdateCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { EntityService } from '../services/EntityService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class WalletUpdateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.walletUpdateCommand.getMessageName()
  groupId: string = getGroupId(WalletUpdateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private entityService: EntityService,
  ) {
    this.logger.setContext(WalletUpdateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IWalletUpdateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.entityService.updateWalletForEntity(
        decodedMessage.tenantId,
        decodedMessage.entityId,
        decodedMessage.address,
        {
          metadata: JSON.parse(decodedMessage.metadata),
        },
        decodedMessage.setAsDefault,
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
    this.logger.info(`Stopping ${WalletUpdateCommandConsumer.name}`)
  }
}
