import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { ClientModule } from './ClientModule'
import { Auth0Module } from './Auth0Module'
import { AuthWebHookModule } from './AuthWebHookModule'
import { ClientGrantModule } from './ClientGrantModule'
import { ResourceServerApiModule } from './ResourceServerApiModule'
import { ConfigModule } from './ConfigModule'
import { ScopesPermissionsGuard } from '../guards/ScopesPermissionsGuard'
import { APP_GUARD } from '@nestjs/core'
import { UserModule } from './UserModule'
import { RoleModule } from './RoleModule'
import {
  ApmClientModule,
  initApm,
  nestjsLoggerModuleConfig,
  LoggerModule,
} from '@codefi-assets-and-payments/observability'
import {
  KafkaConsumerModule,
  KafkaPreview,
  KafkaProducerModule,
} from '@codefi-assets-and-payments/nestjs-messaging'
import { AuthGuard } from '@codefi/auth'

const apm = initApm()

@Module({
  imports: [
    ApmClientModule.forRoot(apm),
    LoggerModule.forRoot(nestjsLoggerModuleConfig()),
    ConfigModule,
    HealthCheckModule,
    ClientModule,
    Auth0Module,
    AuthWebHookModule,
    ClientGrantModule,
    UserModule,
    RoleModule,
    ResourceServerApiModule,
    KafkaConsumerModule,
    KafkaProducerModule,
    KafkaPreview.CodefiConsumerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ScopesPermissionsGuard,
    },
  ],
})
export class AppModule {}
