import { Module } from '@nestjs/common';
import { KafkaProducer } from './KafkaProducer';
import { SchemaRegistryModule } from './SchemaRegistryModule';
import { KafkaClientModule } from './KafkaClientModule';
import { ApmModule, nestjsLoggerModuleConfig } from '@codefi-assets-and-payments/observability';
import { LoggerModule } from '@codefi-assets-and-payments/observability';

@Module({
  imports: [
    LoggerModule.forRoot(nestjsLoggerModuleConfig()),
    ApmModule,
    KafkaClientModule,
    SchemaRegistryModule,
  ],
  providers: [KafkaProducer],
  exports: [KafkaProducer, ApmModule],
})
export class KafkaProducerModule {}
