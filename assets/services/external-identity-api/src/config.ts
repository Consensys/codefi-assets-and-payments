import { envBool, envInt, envString } from './utils/config-utils'

/* eslint-disable */
require('dotenv').config()
let configObject

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function loadConfig() {
  return {
    serverPort: envInt('PORT', 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    db: {
      host: envString('DB_HOST'),
      port: envInt('DB_PORT', 5432),
      username: envString('DB_USERNAME'),
      password: envString('DB_PASSWORD'),
      databaseName: envString('DB_DATABASE_NAME'),
      logging: envBool('DB_LOGGING'),
      ssl: envBool('DB_SSL', false),
    },
    kafka: {
      groupId: envString('GROUP_ID'),
    },
    onfido: {
      apiToken: envString('ONFIDO_API_TOKEN'),
      webhookToken: envString('ONFIDO_WEBHOOK_TOKEN'),
    },
    exportDocs: envBool('EXPORT_DOCS', false),
    logPretty: envBool('LOG_PRETTY_PRINT', false),
  }
}

export type ConfigType = ReturnType<typeof loadConfig>

export default function config(): ConfigType {
  if (!configObject) {
    configObject = loadConfig()
  }

  return configObject
}
