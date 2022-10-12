import { Config, keys as ConfigKeys } from 'src/types/config';
import { IPoll } from 'src/types/UtilsTypes';

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isNil = (val: any) => {
  return val === null || val === undefined;
};

export const poll = async <T>({
  fn,
  fnArg,
  validate,
  interval,
  maxAttempts,
}: IPoll<T>): Promise<any> => {
  let attempts = 0;

  const executePoll = async (resolve, reject) => {
    const result = await fn(fnArg);
    attempts++;

    if (validate(result)) {
      return resolve(result);
    } else if (maxAttempts && attempts === maxAttempts) {
      return reject(new Error('Exceeded max attempts'));
    } else {
      setTimeout(executePoll, interval, resolve, reject);
    }
  };

  return new Promise(executePoll);
};

export const isTokenDiscoveryEnabledCheck = (config: Config) =>
  config[ConfigKeys.DATA][ConfigKeys.DATA__IS_TOKEN_DISCOVERY_ENABLED];
