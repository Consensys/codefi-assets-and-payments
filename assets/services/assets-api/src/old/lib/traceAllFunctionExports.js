import functionTracer from 'src/old/lib/functionTracer';

/**
 * Helper method to see if the passed in func is a function.
 * @param func
 * @returns {boolean}
 */
const isFunction = (func) => {
  return typeof func === 'function';
};

/**
 * Assists in wrapping all function exports that are passed in. Returns a new object with wrapped functions
 *
 * Important: This should be ran after all exports were set.
 * Important: This will mutate the passed in object.
 * @param fileExports Exports to wrap
 * @returns New object with wrapped exports.
 */
const traceAllFunctionExports = (fileExports) => {
  if (fileExports === undefined || fileExports === null) {
    throw new Error(
      'traceAllFunctionExports requires an object to be passed in',
    );
  }

  // eslint-disable-next-line no-unused-vars
  for (const exportKey in fileExports) {
    // Get the original export
    const originalExport = fileExports[exportKey];

    // If the export is a function lets wrap it with our tracer and provide
    // it with the key as the name for the function.
    if (isFunction(originalExport) === true) {
      fileExports[exportKey] = functionTracer(originalExport, {
        name: exportKey,
      });
    }
  }

  // Return the exports in the case its needed.
  return fileExports;
};

export default traceAllFunctionExports;
