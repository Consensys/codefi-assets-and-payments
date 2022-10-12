import winston from 'src/old/config/logger';
import { sleep } from './sleep';

import CacheService from 'src/utils/cache';

const FAKE_CALLER_ID = 'api_race_condition_checker';

export const protectAgainstRaceCondition = async (
  funcName,
  funcParams,
  maxRetry,
  t0,
  lambda = 1,
) => {
  try {
    let functionAlreadyBeingExecuted: boolean;
    let t = t0;
    for (let i = 0; i < maxRetry; i++) {
      if (i !== 0) {
        winston.info(`Execution tentative #${i}`);
      }

      functionAlreadyBeingExecuted = await CacheService.getDataFromCache(
        funcParams,
        funcName,
        FAKE_CALLER_ID,
      );

      if (functionAlreadyBeingExecuted) {
        // A random offset is required to make sure all retries don't occur at the same time
        const randomOffset = Math.random() * t0;
        winston.info(
          `Execution of ${funcName} function already in progress with identical parameters --> sleep for ${
            t + randomOffset
          }ms`,
        );
        await sleep(t + randomOffset);
        t *= lambda;
      } else {
        await CacheService.setDataInCache(
          funcParams,
          funcName,
          FAKE_CALLER_ID,
          true,
        );
        return;
      }
    }

    throw new Error(
      `function ${funcName} was stopped due to protection against race condition`,
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const endProtectionAgainstRaceCondition = async (
  funcName,
  funcParams,
) => {
  try {
    await CacheService.setDataInCache(
      funcParams,
      funcName,
      FAKE_CALLER_ID,
      false,
    );
  } catch (error) {
    throw new Error(error);
  }
};
