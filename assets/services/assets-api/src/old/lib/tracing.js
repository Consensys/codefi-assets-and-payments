import winston from 'src/old/config/logger';
import * as opentracing from 'opentracing';
import { initTracerFromEnv } from 'jaeger-client';

export const initTracer = (serviceName) => {
  const config = {
    serviceName: serviceName,
    sampler: {
      type: 'const',
      param: 1,
    },
    reporter: {
      logSpans: true,
    },
  };
  const options = {
    logger: {
      info(/*msg*/) {
        // winston.info(`JG-INFO: ${msg}\n`);
      },
      error(msg) {
        winston.info(`JG-ERROR: ${msg}\n`);
      },
    },
  };

  const tracer = initTracerFromEnv(config, options);
  opentracing.initGlobalTracer(tracer);

  return tracer;
};
