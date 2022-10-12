import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { DigitalCurrencyEntity } from './data/entities/DigitalCurrencyEntity'
import { EthereumAddressEntity } from './data/entities/EthereumAddressEntity'
import { LegalEntityEntity } from './data/entities/LegalEntityEntity'
import { OperationEntity } from './data/entities/OperationEntity'
import { OperationRequestEntity } from './data/entities/OperationRequestEntity'
import { TenantEntity } from './data/entities/TenantEntity'
import { envBool, envInt, envString } from './utils/config-utils'

import 'dotenv/config'

let configObject

const buildDbHost = () => {
  if (process.env.PIPELINE) {
    const namespace = envString('DB_NAMESPACE', undefined, true)
    return `${envString('DB_HOST')}${namespace ? `.${namespace}` : ''}`
  } else {
    return envString('DB_HOST')
  }
}

function loadConfig() {
  return {
    serverPort: envInt('PORT', 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    m2mToken: {
      redis: {
        enable: envBool('M2M_TOKEN_REDIS_ENABLE', false),
        host: envString('M2M_TOKEN_REDIS_HOST'),
        pass: envString('M2M_TOKEN_REDIS_PASS'),
      },
      client: {
        id: envString('M2M_TOKEN_CLIENT_ID'),
        secret: envString('M2M_TOKEN_CLIENT_SECRET'),
      },
      audience: envString('M2M_TOKEN_AUDIENCE'),
    },
    db: {
      type: 'postgres' as const,
      enabled: envBool('DB_ENABLE', false),
      host: buildDbHost(),
      port: envInt('DB_PORT', 5432),
      username: envString('DB_USERNAME'),
      password: envString('DB_PASSWORD'),
      database: envString('DB_DATABASE_NAME'),
      logging: envBool('DB_LOGGING', false),
      cache: envBool('DB_CACHE', false),
      synchronize: envBool('DB_SYNCHRONIZE', false),
      dropSchema: envBool('DB_DROP_SCHEMA', false),
      // Run migrations automatically,
      // you can disable this if you prefer running migration manually.
      migrationsRun: envBool('DB_AUTO_MIGRATIONS', false),
      migrationsTransactionMode: 'each',
      // Allow both start:prod and start:dev to use migrations
      // __dirname is either dist or src folder, meaning either
      // the compiled js in prod or the ts in dev.
      entities: [
        LegalEntityEntity,
        DigitalCurrencyEntity,
        OperationEntity,
        OperationRequestEntity,
        EthereumAddressEntity,
        TenantEntity,
      ],
      migrations: [__dirname + '/migration/**/*{.ts,.js}'],
      cli: {
        // Location of migration should be inside src folder
        // to be compiled into dist/ folder.
        migrationsDir: 'src/migration',
        entitiesDir: 'data/entities',
      },
    } as TypeOrmModuleOptions,
    kafka: {
      enabled: envBool('KAFKA_ENABLE'),
      groupId: envString('KAFKA_GROUP_ID'),
      clientId: envString('KAFKA_CLIENT_ID'),
      broker: envString('KAFKA_BROKER'),
    },
    docs: {
      exportDocs: envBool('EXPORT_DOCS', false),
      enableSwagger: envBool('ENABLE_SWAGGER', false),
    },
    logPretty: envBool('LOG_PRETTY_PRINT'),
    commitSha: envString('CI_COMMIT_SHORT_SHA', '', true),
    jwtCodefiNamespace:
      process.env.JWT_CODEFI_NAMESPACE || 'https://api.codefi.network',
    // TEMPORAL onboarding stuff
    resetInitialConfiguration: envBool('RESET_INITIAL_CONFIGURATION', false),
    performInitialConfiguration: envBool(
      'PERFORM_INITIAL_CONFIGURATION',
      false,
    ),
    legalEntitiesToOnboard: envString('LEGAL_ENTITIES_TO_ONBOARD', '[]'),
    orchestrate: {
      chainBackoffDuration: envString(
        'ORCHESTRATE_CHAIN_BACKOFF_DURATION',
        '3s',
      ),
      chainEnableExternalTx: envBool(
        'ORCHESTRATE_CHAIN_ENABLE_EXTERNAL_TX',
        false,
      ),
      blockchainUrl: envString('BLOCKCHAIN_URL', '', true),
    },
  }
}

export type ConfigType = ReturnType<typeof loadConfig>

export default function config(): ConfigType {
  if (!configObject) {
    configObject = loadConfig()
  }

  return configObject
}
