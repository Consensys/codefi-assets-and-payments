import { Module } from '@nestjs/common'
import { HealthCheckModule } from './HealthCheckModule'
import { APP_GUARD } from '@nestjs/core'
import { ScopesPermissionsGuard } from '../guards/ScopesPermissionsGuard'
import { TerminusModule } from '@nestjs/terminus'
import { ScheduleModule } from '@nestjs/schedule'
import { CodefiLoggerModule } from '@codefi-assets-and-payments/observability'
import { KeysModule } from './KeysModule'

const imports = [
  CodefiLoggerModule.forRoot(),
  TerminusModule,
  HealthCheckModule,
  KeysModule,
  ScheduleModule.forRoot(),
]

@Module({
  imports: imports,
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ScopesPermissionsGuard,
    },
  ],
})
export class AppModule {}
