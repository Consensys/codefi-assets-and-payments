import { Events, ITenantOperationEvent } from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Injectable } from '@nestjs/common'
import { RecoveryService } from '../services/RecoveryService'
import { EntityNotFoundException } from '@codefi-assets-and-payments/error-handler'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class TenantOperationEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.tenantOperationEvent.getMessageName()
  groupId: string = getGroupId(TenantOperationEventConsumer.name)

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly recoveryService: RecoveryService,
  ) {
    this.logger.setContext(TenantOperationEventConsumer.name)
  }

  async onMessage(decodedMessage: ITenantOperationEvent) {
    try {
      this.logger.info(`Message received: ${JSON.stringify(decodedMessage)}`)
      await this.recoveryService.processTenantOperationEvent(decodedMessage)
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
    this.logger.info(`Stopping ${TenantOperationEventConsumer.name}`)
  }
}
