import { IHeaders, KafkaMessage } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import * as KafkaJS from 'kafkajs';

export interface IResponse extends Omit<KafkaMessage, 'key' | 'value'> {
  key: string;
  value: any;
  timestamp: string;
  size: number;
  attributes: number;
  offset: string;
  headers?: IHeaders;
  partition: number;
  topic: string;
}

export enum EventType {
  Response = 'response',
}

export interface IConsumerListener {
  onMessage(content: any): Promise<void>;
  onStopListener(): Promise<void>;
  topic: string;
  groupId: string;
}

export interface IConsumerOptions {
  schemaRegistry?: SchemaRegistry;
  consumerConfig?: KafkaJS.ConsumerConfig;
  kafkaConfig?: Omit<KafkaJS.KafkaConfig, 'brokers' | 'clientId'>;
  brokers?: string[];
  clientId?: string;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
}

export interface CodefiConsumersOptions {
  keepListenersAlive?: boolean;
  consumerOptions?: IConsumerOptions;
  listenerRunConfig?: KafkaJS.ConsumerRunConfig;
}
