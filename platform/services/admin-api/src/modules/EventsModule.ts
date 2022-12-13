import { Module } from '@nestjs/common'
import { KafkaProducerModule } from '@consensys/nestjs-messaging'
import { EventsService } from '../services/EventsService'

@Module({
  imports: [KafkaProducerModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
