import { createLogger } from '@codefi-assets-and-payments/observability'

import { startServer } from './server'

process.title = 'digital-curr'

const logger = createLogger('main')

startServer().catch((e) => {
  logger.error(`Failed to start NestJS server: ${e.message}`)
})
