import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common'
import {
  KafkaProducer,
  KafkaConsumer,
  KafkaSubscriber,
} from '@codefi-assets-and-payments/nestjs-messaging'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { MicroserviceMessage } from '@codefi-assets-and-payments/messaging-events'
import { ConfigType } from '../config'

export const ALL_KAFKA_EVENTS = 'AllKafkaEvents'
export const ALL_KAFKA_CONSUMERS = 'AllKafkaConsumers'

/**
 * Controls lifecycle of Kafka related objects. Registers event schemas.
 */
@Injectable()
export default class KafkaLifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private readonly logger: NestJSPinoLogger,
    @Inject('Config')
    private readonly config: ConfigType,
    private readonly kafkaProducer: KafkaProducer,
    private readonly kafkaConsumer: KafkaConsumer,
    @Inject(ALL_KAFKA_EVENTS)
    private readonly eventTypes: MicroserviceMessage<any>[],
    @Inject(ALL_KAFKA_CONSUMERS)
    private readonly allSubscribers: KafkaSubscriber[],
  ) {}
  async onApplicationBootstrap(): Promise<any> {
    await this.initProducer()
    await this.initConsumer()
  }

  private async initProducer(): Promise<void> {
    try {
      this.logger.info(
        {
          eventTypes: this.eventTypes,
        },
        'Registering producer events',
      )
      await this.kafkaProducer.registerProducerEvents(this.eventTypes)
    } catch (e) {
      this.logger.error(e, 'Failed to register producer: ')
      throw new Error(`Failed to init producer: ${e.message}`)
    }
  }

  private async initConsumer(): Promise<void> {
    try {
      const groupId = this.config.kafka.groupId
      this.logger.info(
        {
          subscribersNum: this.allSubscribers.length,
        },
        `Registering subscribers, kafkaGroupId=${groupId}`,
      )

      for (const subscriber of this.allSubscribers) {
        this.logger.info(
          {
            topic: subscriber.topic,
          },
          `Registering subscriber, kafkaGroupId=${groupId}`,
        )
        await this.kafkaConsumer.addSubscriber(subscriber, groupId)
      }
    } catch (e) {
      this.logger.error(e, 'Failed to register consumers: ')
      throw new Error(`Failed to init consumer: ${e.message}`)
    }
  }

  async onApplicationShutdown(signal: string): Promise<void> {
    this.logger.info(
      {
        signal,
      },
      'Shutdown Kafka producer and consumer',
    )

    await this.tryToShutdownProducer()
    await this.tryToShutdownConsumer()
  }

  private async tryToShutdownProducer(): Promise<void> {
    this.logger.info('Shutting down Kafka producer')
    try {
      await this.kafkaProducer.disconnect()
    } catch (e) {
      this.logger.error(e, 'Failed to stop Kafka producer')
    }
  }

  private async tryToShutdownConsumer(): Promise<void> {
    this.logger.info('Shutting down Kafka consumer')
    try {
      await this.kafkaConsumer.disconnectAllConsumers()
    } catch (e) {
      this.logger.error(e, 'Failed to stop Kafka consumer')
    }
  }
}
