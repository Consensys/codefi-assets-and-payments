import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { LoggerModule } from '@consensys/observability'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../config'
import {
  ApmClientModule,
  initApm,
  nestjsLoggerModuleConfig,
} from '@consensys/observability'
import { LegalEntityModule } from './LegalEntityModule'
import { PersistentConfigurationModule } from './PersistentConfigurationModule'
import { DigitalCurrencyModule } from './DigitalCurrencyModule'
import {
  KafkaConsumerModule,
  KafkaPreview,
  KafkaProducerModule,
} from '@consensys/nestjs-messaging'
import { ConsumersModule } from './ConsumersModule'
import { AuthGuard } from '@consensys/auth'

const apm = initApm()

const imports = [
  ApmClientModule.forRoot(apm),
  LoggerModule.forRoot(nestjsLoggerModuleConfig()),
  TypeOrmModule.forRoot(config().db),
  KafkaProducerModule,
  KafkaConsumerModule,
  HealthCheckModule,
  PersistentConfigurationModule,
  LegalEntityModule,
  DigitalCurrencyModule,
  ConsumersModule,
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
  ],
})
export class AppModule {}
