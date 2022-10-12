#!/usr/bin/env node
import { initApm, apm } from '@codefi-assets-and-payments/observability';
initApm({
  transactionSampleRate: 1,
  logLevel: (process.env.APM_LOG_LEVEL || 'info') as apm.LogLevel,
}); // order matters

import http from 'http';
import { logger } from './logging/logger';
import { HTTP_PORT } from './config/constants';
import { initAll } from './app';
import orchestrateInstance from './orchestrate';
import sleep from './utils/sleep';

// Time in MS
const GRACEFULL_SHUTDOWN_TIME = 5000;

const port = normalizePort(HTTP_PORT);
let server: http.Server;

function normalizePort(val) {
  const httpPort = parseInt(val, 10);

  if (isNaN(httpPort)) {
    // named pipe
    return val;
  }

  if (httpPort >= 0) {
    // port number
    return httpPort;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error({}, `${bind} requires elevated privileges`);
      process.exit(1);
    case 'EADDRINUSE':
      logger.error({}, `${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}

async function onUncaughtExceptions(caughtException: any) {
  logger.error(caughtException, 'An uncaught exception has been thrown.');

  await shutdownService('An uncaught exception has been thrown.');
  process.exit(0);
}

async function onSIGTERM() {
  await shutdownService('Received SIGTERM signal.');
  process.exit(0);
}

async function shutdownService(reason: string) {
  try {
    logger.info(`Gracefully shutting down container: ${reason}`);
    await sleep(GRACEFULL_SHUTDOWN_TIME);
    if (server) server.close();
    await orchestrateInstance.close();
  } catch (e) {
    logger.error(e, 'An error occurred while trying to shutdown the server.');
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  logger.info('Listening on ' + bind);
}

const startServer = async () => {
  // Register handlers for process lifecycle events
  process.on('uncaughtException', onUncaughtExceptions);
  process.on('SIGTERM', onSIGTERM);

  const app = await initAll();

  app.set('port', port);

  server = http.createServer(app);

  server.listen(port, onListening);
  server.on('error', onError);
};

startServer();
