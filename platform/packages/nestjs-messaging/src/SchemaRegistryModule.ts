import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { Module } from '@nestjs/common';
import cfg from './config';

export const SCHEMA_REGISTRY_PROVIDER = 'Schema Registry Provider';

@Module({
  providers: [
    {
      provide: SCHEMA_REGISTRY_PROVIDER,
      useFactory: () => {
        return new SchemaRegistry({
          host: cfg().schemaRegistryHost,
          retry: {
            maxRetryTimeInSecs: parseInt(
              cfg().schemaRegistryMaxRetryTimeInSecs.toString(),
            ),
            initialRetryTimeInSecs: parseFloat(
              cfg().schemaRegistryInitialRetryTimeInSecs.toString(),
            ),
            factor: parseFloat(cfg().schemaRegistryRetryFactor.toString()),
            multiplier: parseInt(
              cfg().schemaRegistryRetryMultiplier.toString(),
            ),
            retries: parseInt(cfg().schemaRegistryRetryRetries.toString()),
          },
        });
      },
    },
  ],
  exports: [SCHEMA_REGISTRY_PROVIDER],
})
export class SchemaRegistryModule {}
