import { Kafka, Producer, RecordMetadata } from 'kafkajs';
import { MicroserviceMessage } from '@codefi-assets-and-payments/messaging-events';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { KAFKA_CLIENT_PROVIDER } from './KafkaClientModule';
import { SCHEMA_REGISTRY_PROVIDER } from './SchemaRegistryModule';
import { ApmService, createLogger } from '@codefi-assets-and-payments/observability';
import cfg from './config';

@Injectable()
export class KafkaProducer {
  connected: boolean;
  producer: Producer;
  eventsSchemas: Map<string, number>;
  private logger = createLogger('messaging');

  /*
   * Constructor used in the Kafka Producer Module
   * to do : we may want to add strongly typed producer config options here
   * Or the KAFKA_CONSUMER_OPTIONS env var for stringified options that match kafja js config object
   */
  constructor(
    @Inject(KAFKA_CLIENT_PROVIDER) client: Kafka,
    @Inject(SCHEMA_REGISTRY_PROVIDER) private schemaRegistry,
    @Optional() private apmService: ApmService,
  ) {
    this.producer = client.producer(cfg().producerOptions);
    this.eventsSchemas = new Map();
  }

  async init() {
    await this.producer.connect();
    this.connected = true;
  }

  async registerProducerEvents(events: MicroserviceMessage<any>[]) {
    for (const event of events) {
      const registerResult = await this.schemaRegistry.register(
        event.messageSchema,
      );
      this.eventsSchemas.set(event.fullyQualifiedName(), registerResult.id);
    }
  }

  async send<T>(
    message: MicroserviceMessage<T>,
    payload: T,
  ): Promise<RecordMetadata[]> {
    if (!this.connected) {
      await this.init();
    }
    const registryId = this.eventsSchemas.get(message.fullyQualifiedName());
    if (!registryId) {
      throw new Error('Provided event has no registered schema');
    }

    let payloadWithTraceParent = payload;

    if (this.apmService) {
      try {
        const traceParent = this.apmService.getCurrentTraceparent();
        this.logger.info(
          { traceParent },
          'Sending kafka message with traceparent',
        );
        if (traceParent) {
          payloadWithTraceParent = {
            ...payload,
            traceParent,
          };
        }
      } catch (error) {
        this.logger.warn(
          { payloadWithTraceParent, error },
          'Failed to add traceParent to apm transaction',
        );
      }
    }

    const encodedValue = await this.schemaRegistry.encode(
      registryId,
      payloadWithTraceParent,
    );
    const result = await this.producer.send({
      topic: message.getMessageName(),
      messages: [
        {
          value: encodedValue,
        },
      ],
    });
    return result;
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
