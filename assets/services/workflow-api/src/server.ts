import { ApplicationContext } from './context'

async function startServer() {
  const app = await ApplicationContext()
  await app.listen(process.env.PORT || 3000)
}

async function stopServer() {
  const app = await ApplicationContext()
  app.close()
}

export { startServer, stopServer }
