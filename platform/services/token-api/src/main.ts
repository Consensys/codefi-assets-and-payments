import { createLogger } from '@codefi-assets-and-payments/observability'
import config from './config'

import { startServer, startRecoveryMode } from './server'

// when changing the process title, also change:
// integration/utils/server.ts#stopNodeServer()
// be careful with setting a too long name, it will be cut
process.title = 'token-api'

const logger = createLogger('main')
const recoveryMode = config().recoveryMode.enabled

if (recoveryMode) {
  startRecoveryMode().catch((error) => {
    logger.error(error, 'Error during recovery mode')
  })
} else {
  startServer().catch((error) => {
    logger.error(error, 'Failed to start NestJS server')
  })
}
