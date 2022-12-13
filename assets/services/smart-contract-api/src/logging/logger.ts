import { createLogger, PinoLogger } from '@consensys/observability';

// Get configured logger instance
export const logger: PinoLogger = createLogger('smart-contract-api');
