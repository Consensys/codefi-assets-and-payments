import { ApplicationContext } from 'src/context';
import { apiMetrics } from '@codefi-assets-and-payments/observability';
import { urlencoded, json } from 'express';

async function startServer() {
  const app = await ApplicationContext();
  app.enableCors();
  app.use(apiMetrics());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  await app.listen(process.env.PORT || 3000);
}

async function stopServer() {
  const app = await ApplicationContext();
  app.close();
}

export { startServer, stopServer };
