import { createLogger } from '@consensys/observability'
import config from './config'

import { startRecoveryMode, startServer } from './server'

process.title = 'entity-api'

// initApm()

const logger = createLogger('main')
const isRecoveryModeEanbled = config().recoveryMode.enabled

if (isRecoveryModeEanbled) {
  startRecoveryMode().catch((e) => {
    logger.error(`Error during recovery mode: ${e.message}`)
  })
} else {
  startServer().catch((e) => {
    logger.error(`Failed to start NestJS server: ${e.message}`)
  })
}
