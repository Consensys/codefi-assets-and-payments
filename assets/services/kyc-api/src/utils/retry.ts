import { sleep } from './sleep';

// Func takes no argument and may return a promise
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
        await sleep(t);
        t *= lambda;
      }
    }

    if (err?.response?.data?.message) {
      throw new Error(JSON.stringify(err.response.data.message));
    } else if (err?.response?.data?.error) {
      throw new Error(err.response.data.error);
    } else {
      throw new Error(err);
    }
  } catch (error) {
    throw new Error(error);
  }
};

export default execRetry;
