import { envBool, envInt, envString } from './utils/config-utils'
import { EntityEntity } from './data/entities/EntityEntity'
import { TenantEntity } from './data/entities/TenantEntity'
import { WalletEntity } from './data/entities/WalletEntity'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { TenantStoreEntity } from './data/entities/TenantStoreEntity'
import { EntityStoreEntity } from './data/entities/EntityStoreEntity'
import { ClientEntity } from './data/entities/ClientEntity'
import 'dotenv/config'

let configObject

const buildDbHost = () => {
  if (process.env.PIPELINE) {
    return `${envString('DB_HOST')}.${envString('DB_NAMESPACE')}`
  } else {
    return envString('DB_HOST')
  }
}

function loadConfig() {
  return {
    m2mToken: {
      redis: {
        enable: envBool('M2M_TOKEN_REDIS_ENABLE', true),
        host: envString('M2M_TOKEN_REDIS_HOST'),
        pass: envString('M2M_TOKEN_REDIS_PASS'),
      },
      client: {
        id: envString('M2M_TOKEN_CLIENT_ID'),
        secret: envString('M2M_TOKEN_CLIENT_SECRET'),
      },
      audience: envString('M2M_TOKEN_AUDIENCE'),
    },
    serverPort: envInt('PORT', 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    db: {
      type: 'postgres' as const,
      enabled: envBool('DB_ENABLE', false),
      host: buildDbHost(),
      port: envInt('DB_PORT', 5432),
      username: envString('DB_USERNAME', 'postgres'),
      password: envString('DB_PASSWORD', 'postgres'),
      database: envString('DB_DATABASE_NAME'),
      logging: envBool('DB_LOGGING', false),
      cache: envBool('DB_CACHE', false),
      synchronize: envBool('DB_SYNCHRONIZE', false),
      dropSchema: envBool('DB_DROP_SCHEMA', false),
      entities: [
        TenantEntity,
        EntityEntity,
        WalletEntity,
        TenantStoreEntity,
        EntityStoreEntity,
        ClientEntity,
      ],
      // Run migrations automatically,
      // you can disable this if you prefer running migration manually.
      migrationsRun: envBool('DB_AUTO_MIGRATIONS', true),
      migrationsTransactionMode: 'each',
      // Allow both start:prod and start:dev to use migrations
      // __dirname is either dist or src folder, meaning either
      // the compiled js in prod or the ts in dev.
      migrations: [__dirname + '/migration/**/*{.ts,.js}'],
      cli: {
        // Location of migration should be inside src folder
        // to be compiled into dist/ folder.
        migrationsDir: 'src/migration',
        entitiesDir: 'data/entities',
      },
    } as TypeOrmModuleOptions,
    kafka: {
      enabled: envBool('KAFKA_ENABLE', false),
      groupId: envString('KAFKA_GROUP_ID', 'entity-api'),
      clientId: envString('KAFKA_CLIENT_ID', 'entity-api'),
      broker: envString('KAFKA_BROKER', 'kafka:9092'),
    },
    docs: {
      exportDocs: envBool('EXPORT_DOCS', false),
      enableSwagger: envBool('ENABLE_SWAGGER', false),
    },
    logPretty: envBool('LOG_PRETTY_PRINT', true),
    orchestrate: {
      orchestrateUrl: envString('ORCHESTRATE_URL', 'http://api:8081'),
      orchestrateKafkaUrl: envString('ORCHESTRATE_KAFKA_URL', 'kafka:9092'),
      chainName: envString('ORCHESTRATE_CHAIN_NAME', 'dev'),
      schemaRegistryHost: envString(
        'SCHEMA_REGISTRY_HOST',
        'http://schema-registry:8081',
      ),
      blockchainUrl: envString('BLOCKCHAIN_URL', '', true),
      keyManagerUrl: envString('KEY_MANAGER_URL', '', true),
    },
    commitSha: envString('CI_COMMIT_SHORT_SHA', ''),
    performInitialConfiguration: envBool(
      'PERFORM_INITIAL_CONFIGURATION',
      false,
    ),
    initialTenantsToCreate: envString('INITIAL_TENANTS_TO_CREATE', '[]'),
    initialEntitiesToCreate: envString('INITIAL_ENTITIES_TO_CREATE', '[]'),
    initialWalletsToCreate: envString('INITIAL_WALLETS_TO_CREATE', '[]'),
    stores: envString('STORES', ''),
    storesFile: envString('STORES_FILE', './config/stores.json'),
    recoveryMode: {
      enabled: envBool('RECOVERY_MODE', false),
      timestamp: envInt('RECOVERY_MODE_TIMESTAMP', 0),
    },
    cors: {
      enabled: envBool('CORS_ENABLED', false),
      origin: envString('CORS_ORIGIN', undefined, true),
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
