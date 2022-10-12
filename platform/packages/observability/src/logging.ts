import * as pino from 'pino'
import * as ecsFormat from '@elastic/ecs-pino-format'

import config from './config'

const apm = require('elastic-apm-node')

const getCustomFormat = () => {
  const customFormat = ecsFormat()
  const {
    formatters: { log: ecsLog },
  } = customFormat

  customFormat.formatters.log = (object) => {
    // Apply ECS formatting
    object = ecsLog(object)

    // Augment with Tracing id
    if (!apm.currentTransaction) {
      return object
    }
    const transactionIds = apm.currentTransaction.ids
    if (!transactionIds) {
      return object
    }
    object['trace.id'] = transactionIds['trace.id']
    object['transaction.id'] = transactionIds['transaction.id']
    return object
  }

  customFormat.formatters.bindings = () => {
    return {}
  }
  return customFormat
}

const baseLogger = pino.pino({
  ...getCustomFormat(),
  // Set base logger name
  name: config().serviceName,
  // Set minimal level to display
  level: config().logLevel,
  // Only output logs in a human-readable format :
  // - in development when not disabled by explicit "false"
  // - in production when enabled by explicit "true"
  transport: {
    target: 'pino-pretty'
  },
})

/**
 * Create a child logger from the base logger configuration
 *
 * @param loggerName name of a child logger
 */
export function createLogger(loggerName: string): pino.Logger {
  return baseLogger.child({ module: loggerName })
}

/**
 * Create configuration for the Nestjs LoggerModule (Deprecated. Use CodefiLoggerModule when possible)
 */
export function nestjsLoggerModuleConfig() {
  return {
    pinoHttp: {
      logger: createLogger('nestjs'),
      serializers: {
        // Do not log requests
        req: () => undefined,
      },
      autoLogging: false,
    },
  }
}

/**
 * Create a logger for debug messages from NestJs (Deprecated. Use CodefiLoggerModule when possible)
 */
export function nestjsLogger() {
  const { Logger, PinoLogger } = require('nestjs-pino')
  return new Logger(new PinoLogger(nestjsLoggerModuleConfig()), {})
}

/**
 * Create a logger for debug messages from Express
 */
export function expressLogger() {
  const expressPino = require('express-pino-logger')

  return expressPino({
    logger: createLogger('express'),
  })
}

export type PinoLogger = pino.Logger;
