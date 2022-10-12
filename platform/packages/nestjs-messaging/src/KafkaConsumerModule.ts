import { Module } from '@nestjs/common';
import { KafkaClientModule } from './KafkaClientModule';
import { KafkaConsumer } from './KafkaConsumer';
import { SchemaRegistryModule } from './SchemaRegistryModule';
import { ApmModule, nestjsLoggerModuleConfig } from '@codefi-assets-and-payments/observability';
import { LoggerModule } from '@codefi-assets-and-payments/observability';

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
