import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { EntityModule } from './EntityModule'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import ormconfig from '../ormconfig'
import {
  ApmClientModule,
  initApm,
  nestjsLoggerModuleConfig,
  LoggerModule
} from '@consensys/observability'
import { AuthGuard } from '@consensys/auth'
import {
  KafkaConsumerModule,
  KafkaPreview,
  KafkaProducerModule,
} from '@consensys/nestjs-messaging'
import { UserCreatedEventConsumer } from '../consumers/UserCreatedEventConsumer'
import { EntityCreateCommandConsumer } from '../consumers/EntityCreateCommandConsumer'
import { EntityUpdateCommandConsumer } from '../consumers/EntityUpdateCommandConsumer'
import { EntityDeleteCommandConsumer } from '../consumers/EntityDeleteCommandConsumer'
import { TenantModule } from './TenantModule'
import { TenantCreateCommandConsumer } from '../consumers/TenantCreateCommandConsumer'
import { TenantDeleteCommandConsumer } from '../consumers/TenantDeleteCommandConsumer'
import { TenantUpdateCommandConsumer } from '../consumers/TenantUpdateCommandConsumer'
import { WalletCreateCommandConsumer } from '../consumers/WalletCreateCommandConsumer'
import { WalletDeleteCommandConsumer } from '../consumers/WalletDeleteCommandConsumer'
import { WalletUpdateCommandConsumer } from '../consumers/WalletUpdateCommandConsumer'
import { PersistentConfigurationModule } from './PersistentConfigurationModule'
import { ClientCreatedEventConsumer } from '../consumers/ClientCreatedEventConsumer'

const apm = initApm()

const imports = [
  ApmClientModule.forRoot(apm),
  LoggerModule.forRoot(nestjsLoggerModuleConfig()),
  TypeOrmModule.forRoot(ormconfig),
  HealthCheckModule,
  TenantModule,
  EntityModule,
  KafkaConsumerModule,
  KafkaProducerModule,
  PersistentConfigurationModule,
  KafkaPreview.CodefiConsumerModule,
]

@Module({
  imports: imports,
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    UserCreatedEventConsumer,
    ClientCreatedEventConsumer,
    TenantCreateCommandConsumer,
    TenantUpdateCommandConsumer,
    TenantDeleteCommandConsumer,
    EntityCreateCommandConsumer,
    EntityUpdateCommandConsumer,
    EntityDeleteCommandConsumer,
    WalletCreateCommandConsumer,
    WalletUpdateCommandConsumer,
    WalletDeleteCommandConsumer,
  ],
})
export class AppModule {}
