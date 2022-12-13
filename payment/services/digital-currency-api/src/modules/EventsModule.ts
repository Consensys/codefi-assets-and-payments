import { KafkaProducerModule } from '@consensys/nestjs-messaging'
import { Module } from '@nestjs/common'
import { EventsService } from '../services/EventsService'

@Module({
  imports: [KafkaProducerModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
