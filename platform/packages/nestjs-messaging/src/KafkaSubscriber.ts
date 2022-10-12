import { KafkaMessage } from 'kafkajs';

export interface KafkaSubscriber {
  topic: string;
  onMessage(
    decodedMessage: any,
    rawMessage: KafkaMessage,
    topic: string,
    partition: number,
  );
}
