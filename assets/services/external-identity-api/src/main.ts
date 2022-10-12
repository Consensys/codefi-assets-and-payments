import { createLogger } from '@codefi-assets-and-payments/observability'
import { startServer } from './server'

// when changing the process title, also change:
// integration/utils/server.ts#stopNodeServer()
// be careful with setting a too long name, it will be cut
process.title = 'external-identity-api'

const logger = createLogger('main')

startServer().catch((e) => {
  logger.error(e, 'Failed to start NestJS server: ')
})
