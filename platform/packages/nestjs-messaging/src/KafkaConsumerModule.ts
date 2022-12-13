import { Module } from '@nestjs/common';
import { KafkaClientModule } from './KafkaClientModule';
import { KafkaConsumer } from './KafkaConsumer';
import { SchemaRegistryModule } from './SchemaRegistryModule';
import { ApmModule, nestjsLoggerModuleConfig } from '@consensys/observability';
import { LoggerModule } from '@consensys/observability';

@Module({
  imports: [
    LoggerModule.forRoot(nestjsLoggerModuleConfig()),
    ApmModule,
    KafkaClientModule,
    SchemaRegistryModule,
  ],
  providers: [KafkaConsumer],
  exports: [KafkaConsumer],
})
export class KafkaConsumerModule {}
