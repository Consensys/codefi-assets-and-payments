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
