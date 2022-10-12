import { urlencoded, json } from 'express';
import { ApplicationContext } from './context';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

async function startServer() {
  const app = await ApplicationContext();
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  await app.listen(process.env.PORT || 3000);
}

async function stopServer() {
  const app = await ApplicationContext();
  app.close();
}

export { startServer, stopServer };
