import { Module } from '@nestjs/common';
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
import { CodefiLoggerModule } from '@consensys/observability';
import { HealthCheckModule } from 'src/modules/HealthCheckModule';
import { ElementModule } from 'src/modules/ElementModule';
import { TemplateModule } from 'src/modules/TemplateModule';
import { ElementInstanceModule } from 'src/modules/ElementInstanceModule';
import { CheckModule } from 'src/modules/CheckModule';
import { UtilsModule } from 'src/modules/UtilsModule';
import { envBool } from 'src/utils/config-utils';

const options: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  autoLoadModels: true,
  logging: false,
};

// Add SSL option if it is set in the environment variable.
if (envBool('POSTGRES_SSL', false)) {
  options.dialectOptions = {
    ssl: {
      require: true,
    },
  };
}

@Module({
  imports: [
    CodefiLoggerModule.forRoot(),
    SequelizeModule.forRoot(options),
    HealthCheckModule,
    ElementModule,
    TemplateModule,
    ElementInstanceModule,
    CheckModule,
    UtilsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
