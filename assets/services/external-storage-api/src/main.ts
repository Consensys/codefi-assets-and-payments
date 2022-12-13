import { createLogger, initApm } from "@consensys/observability";

import { startServer } from "./server";

initApm();

const logger = createLogger("main");

startServer().catch((e) => {
  logger.error(`Failed to start NestJS server: ${e.message}`);
});
