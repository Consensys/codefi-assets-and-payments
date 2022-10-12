import { envBool, envInt } from './utils/config-utils'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

let configObject

function loadConfig() {
  return {
    serverPort: envInt('PORT', 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    exportDocs: envBool('EXPORT_DOCS', false),
    logPretty: envBool('LOG_PRETTY_PRINT'),
  }
}

export type ConfigType = ReturnType<typeof loadConfig>

export default function config(): ConfigType {
  if (!configObject) {
    configObject = loadConfig()
  }

  return configObject
}
