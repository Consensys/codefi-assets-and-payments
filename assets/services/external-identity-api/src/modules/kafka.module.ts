import { Module } from '@nestjs/common'
import { KafkaProducerModule } from '@consensys/nestjs-messaging'
import { KafkaConsumerModule } from '@consensys/nestjs-messaging'

@Module({
  imports: [KafkaProducerModule, KafkaConsumerModule],
  exports: [KafkaProducerModule, KafkaConsumerModule],
})
export class KafkaModule {}
