import * as opentracing from 'opentracing';
import scopeManager from 'src/old/lib/scopeManager';
import winston from 'src/old/config/logger';

/**
 * Helper method to see if the passed in object is a promise
 * @param obj - To check if promise
 * @returns {boolean} true if promise, false if not
 */
const isPromise = (obj) => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
};

/**
 * Helper to add an error object to a span.
 * @param span Span to add the error information to
 * @param err Error to add to the span
 */
const addErrorToSpan = (span, err) => {
  span.addTags({
    error: true,
    'error.type': err.name,
    'error.msg': err.message,
    'error.stack': err.stack,
    'sampling.priority': 1,
  });
};

/**
 * Takes in a function and wraps it so when executed, a trace span is created for it's entire lifecycle
 * @param func - Function to wrap
 * @param options - Object that possibly contains a tracer or name
 * @returns {Function} Wrapped function with tracing capabilities
 */
export const functionTracer = (func, options = {}) => {
  if (func === undefined || func === null) {
    throw new Error('functionTracer expects a defined function to wrap.');
  }

  if (typeof func !== 'function') {
    throw new Error('functionTracer expects a function as a parameter');
  }

  // Get the tracer.
  const tracer = options.tracer || opentracing.globalTracer();

  if (tracer === undefined || tracer === null) {
    throw new Error(
      'functionTracer expects a defined tracer in options or globally in opentracing',
    );
  }

  // Get the name by either getting from options of the func.name
  let funcName = options.name || func.name;

  // If the name does not exist, throw an error.
  if (funcName === undefined || funcName === null || funcName === '') {
    winston.warn(
      'Function was declared with no name. Defaulting to -no name function-',
    );
    funcName = '-no name function-';
  }

  return (...params) => {
    return scopeManager.runAndReturn(() => {
      // Create a new span
      const currentSpan = scopeManager.startSpan(tracer, funcName);

      // Given the call and return value, we have to handle it separately.
      // If it is async (if its a promise), we return a promise.
      // If it is sync, we return the results, and the error will be handled by the try catch
      // Execute with a try catch for sync functions
      try {
        const callResults = func(...params);

        // Check to see if it is a promise, if it is, we return a promise.
        if (isPromise(callResults) === true) {
          // It is a promise, lets return another promise.
          return callResults
            .then((resultsFromPromise) => {
              // Finish span.
              currentSpan.finish();

              // Return the promise results
              return resultsFromPromise;
            })
            .catch((e) => {
              // Add error information to span
              addErrorToSpan(currentSpan, e);

              // Finished.
              currentSpan.finish();

              // Rethrow the err
              throw e;
            });
        }

        // Now we know it isn't a promise, so its sync.
        // Finish up the span and return the original value.
        currentSpan.finish();

        return callResults;
      } catch (e) {
        // In the sync case, if it errors, then we add error and throw
        addErrorToSpan(currentSpan, e);

        // Finished.
        currentSpan.finish();

        // Rethrow the error.
        throw e;
      }
    });
  };
};

export default functionTracer;
