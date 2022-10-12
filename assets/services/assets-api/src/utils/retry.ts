import { HttpException, HttpStatus } from '@nestjs/common';
import winston from 'src/old/config/logger';
import { sleep } from './sleep';

const unauthorizedStatusCodes: number[] = [401, 422];

const extractFuncUrl = (func) => {
  const funcStr = func?.toString();
  let funcUrl;
  if (funcStr && funcStr.indexOf('`') >= 0) {
    funcUrl = funcStr.substring(
      funcStr.indexOf('`') + 1,
      funcStr.lastIndexOf('`'),
    );
  }
  return funcUrl;
};

// Func takes no argument and may return a promise
const execRetry = async (
  func,
  maxRetry,
  t0,
  lambda = 1,
  onlyRequestErrors = false,
) => {
  try {
    let err;
    let t = t0;
    for (let i = 0; i < maxRetry; i++) {
      if (i !== 0) {
        winston.info(`Retry tentative #${i}`);
      }
      try {
        const result = await func();
        return result;
      } catch (e) {
        // If onlyRequestErrors = true, the request is not retried if it was successful
        // (could reach the endpoint) with an http code out from 2xx range
        if (onlyRequestErrors && e.response) {
          err = e;
          // Format error object in line with Codefi error handler error object format
          err.message = e.response.data.message;
          err.status = e.response.data.statusCode;
          break;
        }

        err = e;

        // In case "func" is an http call, we need to manage response.data instead of the error itself
        if (err?.response?.data?.error) {
          err = err?.response?.data?.error;
        } else if (err?.response?.data) {
          err = err?.response?.data;
        }

        if (err?.status && unauthorizedStatusCodes.includes(err?.status)) {
          // In case request in 'unauthorized' (401 or 422 status code), we don't need to
          // perform retries, as result will remain a failure.
          winston.info(`Authentication issuer during retry #${i}`);
          break;
        } else {
          // In case request is 'authorized', it means we have a different issue, and it's
          // worth performing a retry.
          await sleep(t);
          t *= lambda;
          let funcIncludesUrl;
          if (extractFuncUrl(func)) {
            funcIncludesUrl = true;
          }
          winston.info(
            `Retry failure ${
              funcIncludesUrl ? `in call to ${extractFuncUrl(func)}` : ''
            } --> sleep for ${t}ms`,
          );
        }
      }
    }

    throw err;
  } catch (error) {
    let status;
    let message;

    if (error?.message) {
      message = JSON.stringify(error.message);
      status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    } else if (error?.data) {
      message = JSON.stringify(error.data);
      status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    } else if (error?.data) {
      message = JSON.stringify(error.data);
      status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    } else {
      message = error;
      status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    }

    throw new HttpException(
      {
        message,
        status,
      },
      status,
    );
  }
};

export default execRetry;
