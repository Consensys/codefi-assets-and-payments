import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import cfg from './config';

export const KAFKA_CLIENT_PROVIDER = 'Kafka Client Provider';

@Module({
  providers: [
    {
      provide: KAFKA_CLIENT_PROVIDER,
      useFactory: () => {
        return new Kafka({
          clientId: cfg().kafkaClientId,
          brokers: [cfg().kafkaBroker],
        });
      },
    },
  ],
  exports: [KAFKA_CLIENT_PROVIDER],
})
export class KafkaClientModule {}
