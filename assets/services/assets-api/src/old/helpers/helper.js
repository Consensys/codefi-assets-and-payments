/**
 * HELPER FUNCTIONS
 *
 * This file shall contain generic helper functions which are used by multiple helper files.
 *
 */

import traceAllFunctionExports from 'src/old/lib/traceAllFunctionExports';

/**
 * Function used to check response format of external API call
 *  - Response status needs to be 200
 *  - Response data shall not be empty
 */
export const checkRequestResponseFormat = (
  _ctx,
  _actionDescription,
  _response,
) => {
  try {
    if (_response.status !== 200 && _response.status !== 201) {
      throw new Error(
        `error ${_actionDescription} --> status code is different from 200`,
      );
    }
    if (!(_response && _response.data)) {
      throw new Error(
        `error ${_actionDescription} --> response contains no data`,
      );
    }
  } catch (error) {
    throw new Error(`checkRequestResponseFormat --> ${error.message}`);
  }
};

export default traceAllFunctionExports({
  checkRequestResponseFormat,
});
