import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { LoggerModule } from '@codefi-assets-and-payments/observability'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../config'
import {
  ApmClientModule,
  initApm,
  nestjsLoggerModuleConfig,
} from '@codefi-assets-and-payments/observability'
import { LegalEntityModule } from './LegalEntityModule'
import { PersistentConfigurationModule } from './PersistentConfigurationModule'
import { DigitalCurrencyModule } from './DigitalCurrencyModule'
import {
  KafkaConsumerModule,
  KafkaPreview,
  KafkaProducerModule,
} from '@codefi-assets-and-payments/nestjs-messaging'
import { ConsumersModule } from './ConsumersModule'
import { AuthGuard } from '@codefi-assets-and-payments/auth'

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
