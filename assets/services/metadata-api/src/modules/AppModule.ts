import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LoggerModule,
  nestjsLoggerModuleConfig,
} from '@consensys/observability';

import * as ormconfig from 'src/ormconfig';
import { HealthCheckModule } from './HealthCheckModule';
import { TokensModule } from './TokensModule';
import { AssetTemplatesModule } from './AssetTemplatesModule';
import { AssetInstancesModule } from './AssetInstancesModule';
import { AssetElementsModule } from './AssetElementsModule';
import { AssetCycleInstancesModule } from './AssetCycleInstancesModule';
import { ConfigsModule } from './ConfigsModule';
import { ProjectsModule } from './ProjectsModule';
import { UtilsModule } from './UtilsModule';
import { MailsModule } from './MailsModule';
import { ConfigModule } from '@nestjs/config';
import { UseCaseModule } from './UseCaseModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(nestjsLoggerModuleConfig()),
    TypeOrmModule.forRoot(ormconfig),
    HealthCheckModule,
    TokensModule,
    AssetElementsModule,
    AssetInstancesModule,
    AssetTemplatesModule,
    AssetCycleInstancesModule,
    ConfigsModule,
    ProjectsModule,
    UtilsModule,
    MailsModule,
    UseCaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
