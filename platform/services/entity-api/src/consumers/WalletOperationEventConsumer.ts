import { Events, IWalletOperationEvent } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { NestJSPinoLogger } from '@consensys/observability'
import { Injectable } from '@nestjs/common'
import { RecoveryService } from '../services/RecoveryService'
import { EntityNotFoundException } from '@consensys/error-handler'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class WalletOperationEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.walletOperationEvent.getMessageName()
  groupId: string = getGroupId(WalletOperationEventConsumer.name)

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly recoveryService: RecoveryService,
  ) {
    this.logger.setContext(WalletOperationEventConsumer.name)
  }

  async onMessage(decodedMessage: IWalletOperationEvent) {
    try {
      this.logger.info(`Message received: ${JSON.stringify(decodedMessage)}`)
      await this.recoveryService.processWalletOperationEvent(decodedMessage)
      this.logger.info('Message processed successfully')
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        this.logger.error(
          `Retriable error processing message - Message: ${JSON.stringify(
            decodedMessage,
          )} - Error: ${JSON.stringify(error.message)}`,
        )
        throw error
      } else {
        this.logger.error(
          `Error processing message - Message: ${JSON.stringify(
            decodedMessage,
          )} - Error: ${JSON.stringify(error.message)}`,
        )
      }
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${WalletOperationEventConsumer.name}`)
  }
}
