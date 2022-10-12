import { DataSourceOptions } from 'typeorm'
import { envBool, envInt, envString } from 'src/utils/config-utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const config: DataSourceOptions = {
  type: 'postgres',
  host: envString('POSTGRES_HOST', ''),
  port: envInt('POSTGRES_PORT', 5432),
  username: envString('POSTGRES_USER', 'postgres'),
  password: envString('POSTGRES_PASSWORD', 'postgres'),
  database: envString('POSTGRES_DB', ''),
  entities: [__dirname + '/**/*Entity{.ts,.js}'],
  ssl: envBool('POSTGRES_SSL', false),
  // // We are using migrations, synchronize should be set to false.
  synchronize: false,
  // Run migrations automatically,
  // you can disable this if you prefer running migration manually.
  migrationsRun: true,
  logging: process.env.LOG_LEVEL === 'debug',
  logger: 'simple-console',
  // Allow both start:prod and start:dev to use migrations
  // __dirname is either dist or src folder, meaning either
  // the compiled js in prod or the ts in dev.
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
}

export = config
