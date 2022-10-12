import { KafkaProducer } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  IUserCreatedEvent,
  Events,
  IClientCreatedEvent,
  ITenantCreatedEvent,
  IUserUpdatedEvent,
} from '@codefi-assets-and-payments/messaging-events'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import cfg from '../config'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    logger.setContext(EventsService.name)
  }

  async emitUserCreatedEvent(userCreatedEvent: IUserCreatedEvent) {
    if (cfg().kafka.enabled) {
      this.logger.info(
        `Kafka enabled, send UserCreated event to topic=${Events.userCreatedEvent.getMessageName()}`,
      )
      await this.kafkaProducer.send(Events.userCreatedEvent, userCreatedEvent)
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }

  async emitUserUpdatedEvent(userUpdatedEvent: IUserUpdatedEvent) {
    if (cfg().kafka.enabled) {
      this.logger.info(
        `Kafka enabled, send UserUpdated event to topic=${Events.userUpdatedEvent.getMessageName()}`,
      )
      await this.kafkaProducer.send(Events.userUpdatedEvent, userUpdatedEvent)
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }

  async emitClientCreatedEvent(clientCreatedEvent: IClientCreatedEvent) {
    if (cfg().kafka.enabled) {
      this.logger.info(
        `Kafka enabled, send ClientCreated event to topic=${Events.clientCreatedEvent}`,
      )
      await this.kafkaProducer.send(
        Events.clientCreatedEvent,
        clientCreatedEvent,
      )
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }

  async emitTenantCreatedEvent(tenantCreatedEvent: ITenantCreatedEvent) {
    if (cfg().kafka.enabled) {
      this.logger.info(
        `Kafka enabled, send TenantCreated event to topic=${Events.tenantCreatedEvent}`,
      )
      await this.kafkaProducer.send(
        Events.tenantCreatedEvent,
        tenantCreatedEvent,
      )
    } else {
      this.logger.info(`Kafka disabled, not sending event`)
    }
  }
}
