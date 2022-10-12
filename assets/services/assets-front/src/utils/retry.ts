const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getErrorMessage = (error: any) => {
  // eslint-disable-next-line no-nested-ternary
  return error.message
    ? error.message
    : error.response && error.response.data
    ? JSON.stringify(error.response.data)
    : error;
};

// Func takes no argument and may return a promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const execRetry = async (
  func: any,
  maxRetry: number,
  t0: number,
  lambda = 2,
) => {
  try {
    let err;
    let t = t0;
    for (let i = 0; i < maxRetry; i += 1) {
      err = undefined;
      if (i !== 0) {
        console.log(`Retry tentative #${i}`);
      }
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await func();
        return result;
      } catch (e: any) {
        let timeToWait = t;
        if (e.message) {
          // Error status equal 502, 503 or 429 means the API is overloaded. In such cases, we decide to wait for 30s
          if (
            e.message.includes('502') ||
            e.message.includes('503') ||
            e.message.includes('429') ||
            e.message.includes('socket hang up')
          ) {
            timeToWait = 30 * 1000;
          }
        }
        console.log(`Retry failure --> sleep for ${timeToWait}ms`);
        console.log(`Error message: ${getErrorMessage(e)}`);
        err = e;
        // eslint-disable-next-line no-await-in-loop
        await sleep(timeToWait);
        t *= lambda;
      }
    }

    if (err && err.response && err.response.data && err.response.data.message) {
      console.log('Error with message of type 1');
      throw new Error(JSON.stringify(err.response.data.message));
    } else if (
      err &&
      err.response &&
      err.response.data &&
      err.response.data.error
    ) {
      console.log('Error with message of type 2');
      throw new Error(err.response.data.error);
    } else {
      console.log('Error with message of type 3');
      throw new Error(err);
    }
  } catch (error: any) {
    throw new Error(error);
  }
};
