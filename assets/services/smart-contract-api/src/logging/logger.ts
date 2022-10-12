import { createLogger, PinoLogger } from '@codefi-assets-and-payments/observability';

// Get configured logger instance
export const logger: PinoLogger = createLogger('smart-contract-api');
