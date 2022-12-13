import { apiMetricMiddlewares } from '@consensys/observability'

import { ApplicationContext } from './context'
import config from './config'

async function startServer() {
  const app = await ApplicationContext()

  app.use(apiMetricMiddlewares())

  app.enableShutdownHooks()

  await app.listen(config().serverPort)
}

async function stopServer() {
  const app = await ApplicationContext()
  app.close()
}

export { startServer, stopServer }
