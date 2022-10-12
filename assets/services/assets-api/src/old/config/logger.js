// import winston from 'winston';
import { createLogger } from '@codefi-assets-and-payments/observability'; // Codefi logger

// Get configured logger instance
const logger = createLogger('oldWinstonLogger');

// const options = {
//   // Use in case of logs in file
//   // file: {
//   //   level: process.env.LOG_LEVEL || 'silly',
//   //   filename: `${appRoot}/logs/app.log`,
//   //   handleExceptions: true,
//   //   json: true,
//   //   maxsize: 5242880, // 5MB
//   //   maxFiles: 5,
//   // },
//   console: {
//     level: process.env.LOG_LEVEL || 'silly',
//     format: winston.format.combine(
//       winston.format.colorize(),
//       winston.format.simple(),
//     ),
//   },
// };

// // instantiate a new Winston Logger with the settings defined above
// const logger = new winston.createLogger({
//   transports: [
//     // Use in case of logs in file
//     // new winston.transports.File(options.file),
//     new winston.transports.Console(options.console),
//   ],
//   exitOnError: false, // do not exit on handled exceptions
// });

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function (message) {
    logger.info(message);
  },
};

logger.rejectError = (message) => {
  logger.error(message);
  const err = new Error(message);
  return Promise.reject(err);
};

logger.handleError = (_functionName, _API_NAME, _error) => {
  const errorMessage = `${_functionName} --> ${_API_NAME} ${
    _error.response
      ? JSON.stringify(_error.response.data)
      : _error.message
      ? _error.message
      : _error
  }`;
  logger.error(`${errorMessage}\n`);
  throw new Error(errorMessage);
};

// /**
//  * Decorator in order to log the name of the called function
//  * @param  {String}  [message='']     additional message that completes the
//  * originam lessage
//  * @param  {Boolean} [override=false] if true, only the message parameter is logged
//  */
// export const withTrace = (message = '', override = false) => target => {
//   const functionName = target.key;
//   const value = target.descriptor.value;
//   const loggerFunction = override
//     ? () => logger.info(message)
//     : () => logger.info(`Called function: ${functionName}. ${message}`);
//   target.descriptor.value = function(...args) {
//     loggerFunction();
//     return value.apply(this, ...args);
//   };
// };
//
// /**
//  * Prettify the log of an object or array in the console
//  * @param  {[object, array]} obj the object or array to display
//  * @return {json}     the prettified object
//  */
// export const prettify = obj => JSON.stringify(obj, null, 2);

export default logger;
