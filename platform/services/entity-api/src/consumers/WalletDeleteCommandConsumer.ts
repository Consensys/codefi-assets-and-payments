import { Commands, IWalletDeleteCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { WalletService } from '../services/WalletService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class WalletDeleteCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.walletDeleteCommand.getMessageName()
  groupId: string = getGroupId(WalletDeleteCommandConsumer.name)

  constructor(
    private logger: NestJSPinoLogger,
    private walletService: WalletService,
  ) {
    this.logger.setContext(WalletDeleteCommandConsumer.name)
  }

  async onMessage(decodedMessage: IWalletDeleteCommand) {
    try {
      this.logger.info(`Message received ${JSON.stringify(decodedMessage)}`)

      const result = await this.walletService.delete(
        decodedMessage.tenantId,
        decodedMessage.entityId,
        decodedMessage.address,
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
    this.logger.info(`Stopping ${WalletDeleteCommandConsumer.name}`)
  }
}
