import { Module } from '@nestjs/common'
import { KafkaProducerModule } from '@codefi-assets-and-payments/nestjs-messaging'
import { KafkaConsumerModule } from '@codefi-assets-and-payments/nestjs-messaging'

@Module({
  imports: [KafkaProducerModule, KafkaConsumerModule],
  exports: [KafkaProducerModule, KafkaConsumerModule],
})
export class KafkaModule {}
