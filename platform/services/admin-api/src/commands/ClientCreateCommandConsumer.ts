import { Commands, IClientCreateCommand } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { ClientService } from '../services/ClientService'
import { CreateClientRequest } from '../requests/CreateClientRequest'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class ClientCreateCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Commands.clientCreateCommand.getMessageName()
  groupId: string = getGroupId('clientCreate')

  constructor(
    private logger: NestJSPinoLogger,
    private clientService: ClientService,
  ) {
    this.logger.setContext(ClientCreateCommandConsumer.name)
  }

  async onMessage(decodedMessage: IClientCreateCommand) {
    try {
      this.logger.info(
        `Message received - ClientCreateCommand: ${JSON.stringify(
          decodedMessage,
        )}`,
      )

      const serviceRequest: CreateClientRequest = {
        ...decodedMessage,
        clientMetadata: decodedMessage.clientMetadata
          ? JSON.parse(decodedMessage.clientMetadata)
          : {},
      }

      const result = await this.clientService.createClient(
        serviceRequest,
        decodedMessage.isEmailOnly,
      )

      this.logger.info(`Message processed successfully`, result)
    } catch (error) {
      this.logger.error(`ClientCreateCommandConsumerError`, {
        decodedMessage,
      })
      this.logger.error(error)
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${ClientCreateCommandConsumer.name}`)
  }
}
