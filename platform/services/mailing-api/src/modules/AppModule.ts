import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AuthGuard } from '@consensys/auth'
import { CodefiLoggerModule } from '@consensys/observability'
import { MailingModule } from './MailingModule'
import { HealthCheckModule } from './HealthCheckModule'

const imports = [CodefiLoggerModule.forRoot(), HealthCheckModule, MailingModule]

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
