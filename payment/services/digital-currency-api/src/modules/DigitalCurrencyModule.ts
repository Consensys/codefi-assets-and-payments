import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationRequestEntity } from '../data/entities/OperationRequestEntity'
import { OperationRequestService } from '../services/OperationRequestService'
import { DigitalCurrencyController } from '../controllers/DigitalCurrencyController'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import { DigitalCurrencyService } from '../services/DigitalCurrencyService'
import { EventsModule } from './EventsModule'
import { LegalEntityModule } from './LegalEntityModule'
import { OperationsModule } from './OperationsModule'
import { OperationsRequestController } from '../controllers/OperationRequestController'
import { KafkaProducerModule } from '@consensys/nestjs-messaging'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DigitalCurrencyEntity,
      OperationRequestEntity,
      OperationEntity,
    ]),
    LegalEntityModule,
    EventsModule,
    OperationsModule,
    KafkaProducerModule,
  ],
  providers: [DigitalCurrencyService, OperationRequestService],
  controllers: [DigitalCurrencyController, OperationsRequestController],
  exports: [DigitalCurrencyService, OperationRequestService],
})
export class DigitalCurrencyModule {}
