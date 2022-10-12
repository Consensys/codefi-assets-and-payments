import { Module } from '@nestjs/common';
import { KafkaHealthIndicator } from './KafkaHealthIndicator';
import { KafkaConsumerModule } from './KafkaConsumerModule';

@Module({
  imports: [KafkaConsumerModule],
  providers: [KafkaHealthIndicator],
  exports: [KafkaHealthIndicator],
})
export class KafkaHealthCheckModule {}
