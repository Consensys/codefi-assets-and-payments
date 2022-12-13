import { Events, IClientCreatedEvent } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { NestJSPinoLogger } from '@consensys/observability'
import { Injectable } from '@nestjs/common'
import { ClientService } from '../services/ClientService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class ClientCreatedEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.clientCreatedEvent.getMessageName()
  groupId: string = getGroupId(ClientCreatedEventConsumer.name)

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly clientService: ClientService,
  ) {
    this.logger.setContext(ClientCreatedEventConsumer.name)
  }

  async onMessage(decodedMessage: IClientCreatedEvent) {
    try {
      this.logger.info(`Message received: ${JSON.stringify(decodedMessage)}`)

      const { tenantId, entityId, name, clientId } = decodedMessage

      await this.clientService.updateStatus(tenantId, entityId, name, clientId)

      this.logger.info('Message processed successfully')
    } catch (error) {
      this.logger.error(
        `Error processing message - Message: ${JSON.stringify(
          decodedMessage,
        )} - Error: ${JSON.stringify(error.message)}`,
      )
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${ClientCreatedEventConsumer.name}`)
  }
}
