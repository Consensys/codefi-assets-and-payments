import traceAllFunctionExports from 'src/old/lib/traceAllFunctionExports';
import crypto from 'crypto';

/**
 * [Generate a random Uuid of length 32]
 *
 * This function is used for example to generate firstConnectionCodes for the
 * accounts.
 *
 */
export const generateCode = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * [Generate a simle code of length 8 without characters 0 L l 1]
 *
 * This function is used for example to generate payment identifiers.
 *
 */
export const generateSimpleCode = () => {
  return crypto.randomBytes(4).toString('hex');
};

export default traceAllFunctionExports({
  generateCode,
  generateSimpleCode,
});
