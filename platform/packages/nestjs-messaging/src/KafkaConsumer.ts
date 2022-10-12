import { Kafka, Consumer, ConsumerConfig } from 'kafkajs';
import { Injectable, Inject } from '@nestjs/common';
import { KafkaSubscriber } from './KafkaSubscriber';
import { KAFKA_CLIENT_PROVIDER } from './KafkaClientModule';
import { SCHEMA_REGISTRY_PROVIDER } from './SchemaRegistryModule';
import cfg from './config';
import { v4 as uuidv4 } from 'uuid';
import {
  ApmService,
  ApmTransactionStarted,
  createLogger,
} from '@codefi-assets-and-payments/observability';

@Injectable()
export class KafkaConsumer {
  client: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private logger = createLogger('messaging');

  constructor(
    @Inject(KAFKA_CLIENT_PROVIDER) client: Kafka,
    @Inject(SCHEMA_REGISTRY_PROVIDER) private schemaRegistry,
    private apmService: ApmService,
  ) {
    if (cfg().consumerHostIp) {
      this.client = new Kafka({
        clientId: cfg().kafkaClientId,
        brokers: [`${cfg().consumerHostIp}:9092`],
      });
    } else {
      this.client = client;
    }
  }

  /*
   * Use this method to add a subscriber
   * Use consumerConfig params for strongly typed configuration
   * Or the KAFKA_CONSUMER_OPTIONS env var for stringified options that match kafja js config object
   */
  async addSubscriber(
    subscriber: KafkaSubscriber,
    groupId?: string,
    subscriberUuid?: string,
    consumerConfig?: ConsumerConfig,
  ): Promise<string> {
    const consumerUuid = subscriberUuid || uuidv4();
    const config = consumerConfig ?? {
      ...cfg().consumerOptions,
      groupId: groupId || cfg().kafkaGroupId,
    };
    const consumer = this.client.consumer(config);
    this.consumers.set(consumerUuid, consumer);
    await consumer.connect();

    consumer.on(consumer.events.CRASH, (event) => {
      this.logger.error(event, 'Kafka consumer crashed');
    });

    await consumer.subscribe({
      topic: subscriber.topic,
      fromBeginning: true,
    });
    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        const decodedMessage = await this.schemaRegistry.decode(message.value);
        let transStarted: ApmTransactionStarted;
        if (decodedMessage.traceParent) {
          const traceParent = decodedMessage.traceParent;
          transStarted = this.apmService.startTransaction(`async-${topic}`, {
            childOf: traceParent,
          });
        }
        await subscriber.onMessage(decodedMessage, message, topic, partition);
        if (transStarted) {
          transStarted.trans.end();
        }
        await consumer.commitOffsets([
          {
            offset: (parseInt(message.offset, 10) + 1).toString(),
            topic,
            partition,
          },
        ]);
      },
    });
    return consumerUuid;
  }

  getConsumer(consumerUuid: string): Consumer {
    return this.consumers.get(consumerUuid);
  }

  getConsumers(): Array<Consumer> {
    return Array.from(this.consumers.values());
  }

  async disconnect(consumerUuid: string): Promise<boolean> {
    const consumer = this.consumers.get(consumerUuid);
    if (consumer) {
      await consumer.disconnect();
      return true;
    }
    this.logger.info(`No consumer found for ${consumerUuid}`);
    return false;
  }

  async disconnectAllConsumers() {
    await Promise.all(
      [...this.consumers.values()].map((consumer) => {
        return consumer.disconnect();
      }),
    );
  }
}
