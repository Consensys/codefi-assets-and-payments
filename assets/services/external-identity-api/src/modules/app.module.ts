import { Module } from '@nestjs/common'
import { HealthCheckModule } from './health-check.module'
import { APP_GUARD } from '@nestjs/core'
import { ScopesPermissionsGuard } from '../guards/ScopesPermissionsGuard'
import { TerminusModule } from '@nestjs/terminus'
import { TypeOrmModule } from '@nestjs/typeorm'
import config from '../config'
import { OnfidoModule } from './onfido.module'
import { UserEntity } from '../data/entities/UserEntity'
import { KafkaModule } from './kafka.module'
import { ScheduleModule } from '@nestjs/schedule'
import { CodefiLoggerModule } from '@codefi-assets-and-payments/observability'
import { ReportResultEntity } from '../data/entities/ReportResultEntity'

@Module({
  imports: [
    CodefiLoggerModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: config().db.host,
      port: config().db.port,
      username: config().db.username,
      password: config().db.password,
      database: config().db.databaseName,
      synchronize: false,
      ssl: config().db.ssl,
      logging: config().db.logging,
      entities: [UserEntity, ReportResultEntity],
    }),
    TerminusModule,
    HealthCheckModule,
    OnfidoModule,
    ScheduleModule.forRoot(),
    KafkaModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ScopesPermissionsGuard,
    },
  ],
})
export class AppModule {}
