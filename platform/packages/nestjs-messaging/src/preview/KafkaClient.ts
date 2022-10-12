// https://github.com/ConsenSys/orchestrate-node/blob/b73f9644efe0a1c5b4a43118ac59bef5ccd1f28a/src/kafka/KafkaClient.ts

import * as KafkaJS from 'kafkajs';

/**
 * @hidden
 * Kafka client abstract class
 */
export abstract class KafkaClient {
  protected readonly kafka: KafkaJS.Kafka;
  protected isReady = false;

  /**
   * Instantiates a new Kafka client
   *
   * @param brokers - List of brokers to connect to
   * @param kafkaConfig - Kafka client configuration
   */
  protected constructor(kafkaConfig: KafkaJS.KafkaConfig) {
    this.kafka = new KafkaJS.Kafka({
      clientId: 'codefi-messaging',
      ...kafkaConfig,
    });
  }

  /**
   * Returns true if the Producer is ready to produce messages
   */
  public ready(): boolean {
    return this.isReady;
  }
}
