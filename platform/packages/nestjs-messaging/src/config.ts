import { envBool } from './utils/config-utils';

require('dotenv').config();

const configObject = {
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  kafkaGroupId: process.env.KAFKA_GROUP_ID,
  kafkaClientId: process.env.KAFKA_CLIENT_ID,
  schemaRegistryHost:
    process.env.SCHEMA_REGISTRY_HOST || 'http://localhost:8081',
  schemaRegistryMaxRetryTimeInSecs:
    process.env.SCHEMA_REGISTRY_MAX_RETRY_TIME_IN_SECS || 5,
  schemaRegistryInitialRetryTimeInSecs:
    process.env.SCHEMA_REGISTRY_INITIAL_RETRY_TIME_IN_SECS || 0.1,
  schemaRegistryRetryFactor: process.env.SCHEMA_REGISTRY_RETRY_FACTOR || 0.2,
  schemaRegistryRetryMultiplier:
    process.env.SCHEMA_REGISTRY_RETRY_MULTIPLIER || 2,
  schemaRegistryRetryRetries: process.env.SCHEMA_REGISTRY_RETRY_RETRIES || 5,
  consumerHostIp: process.env.CONSUMER_HOST_IP,
  consumerConsumesFromTopicBeginning: envBool(
    'KAFKA_CONSUMER_SUBSCRIBE_FROM_BEGINNING',
    false,
  ),
  consumerOptions: JSON.parse(process.env.KAFKA_CONSUMER_OPTIONS || '{}'),
  producerOptions: JSON.parse(process.env.KAFKA_PRODUCER_OPTIONS || '{}'),
};

export type ConfigType = typeof configObject;

export default function cfg(): ConfigType {
  return configObject;
}
