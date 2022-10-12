import * as bodyParser from 'body-parser'

import { ApplicationContext } from './context'
import config from './config'

async function startServer(): Promise<void> {
  const app = await ApplicationContext()

  app.enableShutdownHooks()
  app.use(
    bodyParser.json({
      limit: '100kb',
      verify: (req, res, buf) => {
        // Save the original unparsed body so we could use it later if needed
        ;(req as unknown as { rawBody: Buffer }).rawBody = buf

        return true
      },
    }),
  )
  await app.listen(config().serverPort)
}

async function stopServer(): Promise<void> {
  const app = await ApplicationContext()
  app.close()
}

export { startServer, stopServer }
