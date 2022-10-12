import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';

import { DOCKER_LAUNCH } from './config/constants';
import healthCheckRouter from './routes/healthcheck';
import networksRouter from './routes/networks';
import walletRouter from './routes/wallet';
import contractRouter from './routes/contract';
import genericRouter from './routes/generic';
import RoutesCreator from './routers/routesCreator';
import chainsInstance from './ethereum/chains';
import hooksRouter from './routes/hookTrigger';
import orchestrateInstance from './orchestrate';
import { logger } from './logging/logger';

const initOrchestrate = async () => {
  logger.info('Connecting to Orchestrate');
  if (DOCKER_LAUNCH) {
    try {
      await orchestrateInstance.init();
    } catch (error) {
      logger.error(
        {
          error,
        },
        'something went wront while initializing Orchestrate',
      );
      process.exit(10); // Exit code 10 means connection to Orchestrate and pod needs to be restarted
    }
  } else {
    logger.info('Local launch --> Skip Orchestrate initialisation\n');
  }
};

const initRoutes = async () => {
  try {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/wallet', walletRouter);
    app.use('/contract', contractRouter);
    app.use('/generic', genericRouter);
    app.use('/healthcheck', healthCheckRouter);
    app.use('/networks', networksRouter);
    app.use('/hooks', hooksRouter);

    const routesCreator = new RoutesCreator();
    routesCreator.registerRouters(app);

    // deploy contracts and contracts routes
    logger.info('Deploying smart contracts');
    await chainsInstance.init();
    routesCreator.createContractsRoutes();

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(404));
    });

    // error handler
    app.use(function (req, res) {
      // set locals, only providing error in development
      res.locals.message = req.statusMessage;
      res.locals.error = req.app.get('env') === 'development' ? req : {};

      // render the error page
      res.status(req.statusCode || 500);
      res.render('error');
    });

    return app;
  } catch (e) {
    logger.error({ e }, 'Unable to init routes');
  }
};

export const initAll = async () => {
  try {
    await initOrchestrate();
    const app = await initRoutes();

    return app;
  } catch (err) {
    logger.error(
      {
        err,
      },
      'Could not start Api-Smart-Contract',
    );
  }
};
