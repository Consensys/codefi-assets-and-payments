require('dotenv').config()

const configObject = {
  apmServerUrl: process.env.ELASTIC_APM_SERVER_URL,
  apmSecretToken: process.env.ELASTIC_APM_SERVER_TOKEN,
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME,
  envName: process.env.APP_ENV || process.env.NODE_ENV,
  logLevel: process.env.LOG_LEVEL || 'info',
  logPretty: process.env.LOG_PRETTY_PRINT === 'true',
}

export type ConfigType = typeof configObject

export default function config(): ConfigType {
  return configObject
}
