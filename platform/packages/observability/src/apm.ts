import { createLogger } from './logging'
import config from './config'
import apm = require('elastic-apm-node')
const logger = createLogger('APM')

/**
 * Initializes Elasticsearch APM integration
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function initApm(overrideOpts?: apm.AgentConfigOptions): apm.Agent {
  logger.info(
    {
      environment: config().envName,
      serverUrl: config().apmServerUrl,
    },
    'Starting APM',
  )
  try {
    return apm.start({
      captureBody: 'errors',
      logUncaughtExceptions: true,
      serviceName: config().serviceName,
      environment: config().envName,
      serverUrl: config().apmServerUrl,
      secretToken: config().apmSecretToken,
      active: !!config().apmServerUrl,
      logLevel: config().logLevel as apm.LogLevel,
      logger,
      ...overrideOpts,
    })
  } catch (e) {
    logger.error('Failed to start APM:', e)
    return apm
  }
}

export function startSpan(...args: any[]) {
  let span: apm.Span
  try {
    span = apm.startSpan(...args)
  } catch (e) {
    logger.error('Failed to start span:', e)
  }
  return span
}

export { apm }
