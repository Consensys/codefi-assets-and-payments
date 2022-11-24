import OnFidoClient from '../services/onfido/OnFidoClient'
import { Module, Type } from '@nestjs/common'
import { UserController } from '../controllers/UserController'
import { OnFidoController } from '../controllers/OnFidoController'
import { KYCService } from '../services/KYCService'
import UserDataAccess from '../repositories/UserDataAccess'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Onfido, Region } from '@onfido/api'
import { UserEntity } from '../data/entities/UserEntity'
import KYCEventsProducer from '../events/KYCEventsProducer'
import { KafkaModule } from './kafka.module'
import config from '../config'
import { UserInformationConsumer } from '../events/UserInformationConsumer'
import KafkaLifecycleService, {
  ALL_KAFKA_CONSUMERS,
  ALL_KAFKA_EVENTS,
} from '../services/KafkaLifecycleService'
import { MicroserviceMessage } from '@consensys/messaging-events/src/messages/MicroserviceMessage'
import { KafkaSubscriber } from '@consensys/nestjs-messaging'
import { Events } from '@consensys/messaging-events'
import KYCResultsService from '../services/KYCResultsService'
import ReportResultDataAccess from '../repositories/ReportResultDataAccess'
import { ReportResultEntity } from '../data/entities/ReportResultEntity'

@Module({
  controllers: [UserController, OnFidoController],
  imports: [
    TypeOrmModule.forFeature([UserEntity, ReportResultEntity]),
    KafkaModule,
  ],
  providers: [
    OnFidoClient,
    {
      provide: Onfido,
      useValue: new Onfido({
        apiToken: config().onfido.apiToken,
        region: Region.EU,
        // Defaults to EU region (api.onfido.com)
        // region: Region.US
      }),
    },
    {
      provide: 'Config',
      useValue: config(),
    },
    registerEventTypes(
      Events.userPersonalInfoUpdated,
      Events.externalKYCResultEvent,
    ),
    ...registerConsumers(UserInformationConsumer),
    KafkaLifecycleService,
    UserDataAccess,
    ReportResultDataAccess,
    KYCService,
    KYCResultsService,
    KYCEventsProducer,
  ],
  exports: [KYCService],
})
export class OnfidoModule {}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function registerConsumers(...consumerTypes: Type<KafkaSubscriber>[]) {
  return [
    ...consumerTypes,
    {
      provide: ALL_KAFKA_CONSUMERS,
      useFactory: (...consumers) => consumers,
      inject: [...consumerTypes],
    },
  ]
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function registerEventTypes(...eventTypes: MicroserviceMessage<any>[]) {
  return {
    provide: ALL_KAFKA_EVENTS,
    useValue: eventTypes,
  }
}
