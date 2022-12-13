// https://github.com/ConsenSys/orchestrate-node/blob/b73f9644efe0a1c5b4a43118ac59bef5ccd1f28a/src/kafka/consumer/Consumer.ts
import * as KafkaJS from 'kafkajs';
import { KafkaClient } from './KafkaClient';
import { IConsumerOptions, IResponse } from './types';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { createLogger } from '@consensys/observability';
import cfg from '../config';
import { ResponseMessage } from './ResponseMessage';
import { PinoLogger } from '@consensys/observability'
import { sleep } from '../utils/utils';

const DEFAULT_MAX_RECONNECT_ATTEMPTS = 20;
const DEFAULT_INITIAL_RECONNECT_DELAY = 1000; // 1 Second
const DEFAULT_MAX_RECONNECT_DELAY = 1000 * 60 * 5; // 5 Minutes

/**
 * Consumes and decodes messages
 */
export abstract class Consumer extends KafkaClient {
  public readonly schemaRegistry: SchemaRegistry;
  protected readonly consumer: KafkaJS.Consumer;
  protected readonly logger: PinoLogger;

  protected abstract onMessage(message: ResponseMessage);
  protected abstract onPostMessage(
    message: ResponseMessage,
    isSuccess: boolean,
  );

  /**
   * Creates a new instance of the Consumer
   * @param topics - List of topics to consume
   * @param groupId - Group id consume from
   * @param options - (Optional) Optional arguments object that would take precedence over config
   * @param options.schemaRegistry - (Optional) SchemaRegistry to decode messages, if defined will take precedence on the config values
   * @param options.consumerConfig - (Optional) Consumer additional configuration, if defined will take precedence on the config values
   * @param options.kafkaConfig - (Optional) Kafka client additional configuration, if defined will take precedence on the config values
   * @param options.clientId - (Optional) Client id for kafka, if defined will take precedence on the config values
   * @param options.brokers - (Optional) List of brokers to connect to, if defined will take precedence on the config values
   * @param runConfig - (Optional) Optional Consumer run arguments object that would take precedence over config
   */
  constructor(
    private readonly topic: string,
    private readonly groupId: string,
    private readonly options: IConsumerOptions = {},
    private readonly runConfig?: KafkaJS.ConsumerRunConfig,
  ) {
    super({
      clientId: options.clientId ?? cfg().kafkaClientId,
      brokers: options.brokers ?? [cfg().kafkaBroker],
      ...options.kafkaConfig,
    });

    this.logger = createLogger('codefi-messaging').child({ groupId, topic });

    this.schemaRegistry =
      options.schemaRegistry ||
      new SchemaRegistry({
        host: cfg().schemaRegistryHost,
        retry: {
          maxRetryTimeInSecs: parseInt(
            cfg().schemaRegistryMaxRetryTimeInSecs.toString(),
          ),
          initialRetryTimeInSecs: parseFloat(
            cfg().schemaRegistryInitialRetryTimeInSecs.toString(),
          ),
          factor: parseFloat(cfg().schemaRegistryRetryFactor.toString()),
          multiplier: parseInt(cfg().schemaRegistryRetryMultiplier.toString()),
          retries: parseInt(cfg().schemaRegistryRetryRetries.toString()),
        },
      });

    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      ...(options.consumerConfig ?? cfg().consumerOptions),
    });

    this.consumer.on(
      this.consumer.events.CRASH,
      async (event: KafkaJS.ConsumerCrashEvent): Promise<void> =>
        await this.handleCrash(event),
    );
  }

  protected async handleCrash(
    event: KafkaJS.ConsumerCrashEvent,
  ): Promise<void> {
    this.logger.error({ crashEvent: event }, `Kafka consumer crashed`);

    const isRetriableError =
      event?.payload?.error?.name === 'KafkaJSNumberOfRetriesExceeded' ||
      event?.payload?.error['retriable'];

    if (!isRetriableError) {
      try {
        this.logger.info(`Attempting to reconnect consumer after crash`);
        await this.connectConsumer({ consume: true });
      } catch (error) {
        this.logger.fatal(
          `Failed to reconnect consumer after crash, exiting the application`,
        );
        process.exit(1);
      }
    }
  }

  /**
   * Connects to Kafka and subscribes to each topic
   *
   * @returns a Promise that resolves if the connection is successful and rejects otherwise
   */
  public async connectConsumer({
    consume = false,
    attempt = 1,
    reconnectDelay = DEFAULT_INITIAL_RECONNECT_DELAY,
  }: {
    consume?: boolean;
    attempt?: number;
    reconnectDelay?: number;
  } = {}): Promise<void> {
    try {
      await this.consumer.connect();

      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: cfg().consumerConsumesFromTopicBeginning,
      });

      this.logger.info('Consumer subscribed to topic');

      if (consume) {
        await this.consume();
      }

      this.isReady = true;
    } catch (error) {
      const maxReconnectAttempts =
        this.options.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;

      const maxReconnectDelay =
        this.options.maxReconnectDelay || DEFAULT_MAX_RECONNECT_DELAY;

      if (attempt === maxReconnectAttempts) {
        this.logger.error(
          { connectError: error },
          'Failed to connect consumer',
        );

        throw new Error(
          `Failed to connect consumer - Group ID: ${this.groupId} | Topic: ${this.topic}`,
        );
      }

      const finalReconnectDelay =
        attempt == 1
          ? this.options.initialReconnectDelay ||
            DEFAULT_INITIAL_RECONNECT_DELAY
          : reconnectDelay;

      this.logger.warn(
        { attempt, reconnectDelay: finalReconnectDelay },
        'Failed to connect consumer, retrying after delay',
      );

      await sleep(finalReconnectDelay);

      const nextReconnectDelay = Math.min(
        finalReconnectDelay * 2,
        maxReconnectDelay,
      );

      await this.connectConsumer({
        consume: true,
        attempt: attempt + 1,
        reconnectDelay: nextReconnectDelay,
      });
    }
  }

  /**
   * Disconnects from the broker and unsubscribes from the topics
   *
   * @returns a Promise that resolves if the connection is disconnected successfully
   */
  public async disconnect(): Promise<void> {
    this.checkReadiness();
    await this.consumer.disconnect();
    this.isReady = false;
  }

  /**
   * Starts consuming messages
   */
  public async consume(): Promise<void> {
    // Not absolutely necessary but enforces user to call connect() before calling consume()
    this.checkReadiness();

    await this.consumer.run(
      this.runConfig ?? {
        autoCommit: false,
        eachMessage: async (payload) => {
          const { topic, partition, message, heartbeat } = payload;
          const rawValue = message.value;
          let decodedValue: any;
          let decodeError: Error;

          try {
            decodedValue = await this.schemaRegistry.decode(rawValue);
          } catch (error) {
            this.logger.error({ rawValue }, 'Failed to decode message');
            decodeError = error;
          }

          const responseMessage = new ResponseMessage(
            this,
            {
              ...message,
              key: message.key?.toString(),
              value: decodedValue,
              topic,
              partition,
            },
            heartbeat,
          );

          try {
            if (!decodeError) {
              await this.onMessage(responseMessage);
            } else {
              throw decodeError;
            }

            await this.onPostMessage(responseMessage, true);

            this.logger.info(
              { offset: payload.message.offset },
              'Processed Kafka message',
            );
          } catch (error) {
            this.logger.warn(
              { messageError: error },
              'Failed to process message, retrying',
            );

            await this.onPostMessage(responseMessage, false);

            throw error;
          }
        },
      },
    );

    this.logger.info('Consumer joined group');
  }

  /**
   * Commits the offsets specified by the message
   *
   * @param message - Message from which to get the offset
   */
  public async commit(message: IResponse): Promise<void> {
    this.checkReadiness();

    await this.consumer.commitOffsets([
      {
        offset: (parseInt(message.offset, 10) + 1).toString(),
        topic: message.topic,
        partition: message.partition,
      },
    ]);
  }

  private checkReadiness() {
    if (!this.isReady) {
      const errorMessage =
        'Consumer is not currently connected, did you forget to call connect()?';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
