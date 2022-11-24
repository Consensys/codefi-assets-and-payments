import { Events, IUserCreatedEvent } from '@consensys/messaging-events'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import { NestJSPinoLogger } from '@consensys/observability'
import { Injectable } from '@nestjs/common'
import { EntityService } from '../services/EntityService'
import { TenantService } from '../services/TenantService'
import { getGroupId } from '../utils/kafka'

@Injectable()
export class UserCreatedEventConsumer
  implements KafkaPreview.IConsumerListener
{
  topic: string = Events.userCreatedEvent.getMessageName()
  groupId: string = getGroupId(UserCreatedEventConsumer.name)

  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tenantService: TenantService,
    private readonly entityService: EntityService,
  ) {
    this.logger.setContext(UserCreatedEventConsumer.name)
  }

  async onMessage(decodedMessage: IUserCreatedEvent) {
    try {
      this.logger.info(`Message received: ${JSON.stringify(decodedMessage)}`)
      const { tenantId, entityId, name, email } = decodedMessage

      await Promise.all([
        await this.tenantService.updateAdminStatus(tenantId, email, name),
        await this.entityService.updateAdminStatus(
          tenantId,
          entityId,
          email,
          name,
        ),
      ])

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
    this.logger.info(`Stopping ${UserCreatedEventConsumer.name}`)
  }
}
