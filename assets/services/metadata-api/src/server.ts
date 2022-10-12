import { ApplicationContext } from './context';

async function startServer() {
  const app = await ApplicationContext();
  if (app) await app.listen(process.env.PORT || 3000);
}

async function stopServer() {
  const app = await ApplicationContext();
  if (app) app.close();
}

export { startServer, stopServer };
