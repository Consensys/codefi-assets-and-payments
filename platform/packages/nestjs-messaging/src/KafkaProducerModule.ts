import { Module } from '@nestjs/common';
import { KafkaProducer } from './KafkaProducer';
import { SchemaRegistryModule } from './SchemaRegistryModule';
import { KafkaClientModule } from './KafkaClientModule';
import { ApmModule, nestjsLoggerModuleConfig } from '@consensys/observability';
import { LoggerModule } from '@consensys/observability';

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
