import sleep from './sleep';

const unauthorizedStatusCodes: number[] = [401, 422];

const execRetry = async (func, maxRetry, t0, lambda = 1) => {
  try {
    let err;
    let t = t0;
    for (let i = 0; i < maxRetry; i++) {
      try {
        const result = await func();
        return result;
      } catch (e) {
        err = e;

        if (e?.status && unauthorizedStatusCodes.includes(e?.status)) {
          // In case request in 'unauthorized' (422 status code), we don't need to perform retries,
          // as result will remain a failure.
          break;
        } else {
          // In case request is 'authorized', it means we have a different issue, and it's
          // worth performing a retry
          await sleep(t);
          t *= lambda;
        }
      }
    }

    throw err;
  } catch (error) {
    throw error;
  }
};

export default execRetry;
