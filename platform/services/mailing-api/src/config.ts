import { envBool, envInt, envString } from './utils/config-utils'
import 'dotenv/config'

let configObject

function loadConfig() {
  return {
    serverPort: envInt('PORT', 3000),
    logLevel: envString('LOG_LEVEL', 'debug'),
    logPretty: envBool('LOG_PRETTY_PRINT'),
    docs: {
      exportDocs: envBool('EXPORT_DOCS', false),
      enableSwagger: envBool('ENABLE_SWAGGER', false),
    },
    mailjet: {
      apiKey: envString('MAILJET_API_KEY'),
      apiSecret: envString('MAILJET_API_SECRET'),
      fromAddress: envString('MAIL_FROM_ADDRESS'),
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
