import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { APP_GUARD } from '@nestjs/core'
import { TokensManagerModule } from './TokensManagerModule'
import { AuthGuard } from '@consensys/auth'
import {
  KafkaConsumerModule,
  KafkaProducerModule,
} from '@consensys/nestjs-messaging'
import { PersistentConfigurationModule } from './PersistentConfigurationModule'
import { ChainModule } from './ChainModule'
import { AccountsModule } from './AccountsModule'
import { OperationsModule } from './OperationsModule'
import { RecoveryModule } from './RecoveryModule'
import { KafkaPreview } from '@consensys/nestjs-messaging'
import {
  ApmClientModule,
  initApm,
  LoggerModule,
  nestjsLoggerModuleConfig,
} from '@consensys/observability'

const apm = initApm()

const imports = [
  ApmClientModule.forRoot(apm),
  LoggerModule.forRoot(nestjsLoggerModuleConfig()),
  HealthCheckModule,
  TokensManagerModule,
  AccountsModule,
  OperationsModule,
  KafkaConsumerModule,
  KafkaProducerModule,
  PersistentConfigurationModule,
  ChainModule,
  RecoveryModule,
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
