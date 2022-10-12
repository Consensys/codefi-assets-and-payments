import { Commands, IWalletCreateCommand } from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { EntityService } from '../services/EntityService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class WalletCreateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.walletCreateCommand.getMessageName()
  groupId: string = getGroupId(WalletCreateCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private entityService: EntityService,
  ) {
    this.logger.setContext(WalletCreateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IWalletCreateCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.entityService.createWalletForEntity(
        decodedMessage.tenantId,
        {
          address: decodedMessage.address,
          type: decodedMessage.type,
          metadata: JSON.parse(decodedMessage.metadata),
          entityId: decodedMessage.entityId,
          createdBy: decodedMessage.createdBy,
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
    this.logger.info(`Stopping ${WalletCreateCommandConsumer.name}`)
  }
}
