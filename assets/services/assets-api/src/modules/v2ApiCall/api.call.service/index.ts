import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

@Injectable()
export class ApiCallHelperService {
  // constructor() {}

  /**
   * Function used to check response format of external API call
   *  - Response status needs to be 200
   *  - Response data shall not be empty
   */
  checkRequestResponseFormat(
    actionDescription: string,
    response: any,
    allowZeroLengthData?: boolean,
    allowNon200Codes = false,
  ) {
    try {
      this.checkRequestResponseCode(
        actionDescription,
        response,
        allowNon200Codes,
      );

      if (!(response && response.data !== undefined)) {
        // Caution: sometimes "response.data === false" but is still a valid response
        ErrorService.throwError('response contains no data');
      }
      if (!allowZeroLengthData && response.data.length === 0) {
        ErrorService.throwError('response data length is zero');
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        actionDescription,
        'checkRequestResponseFormat',
        false,
        500,
      );
    }
  }

  /**
   * Function used to check response code
   *  - Response status needs to be 200
   */
  checkRequestResponseCode(
    actionDescription: string,
    response: any,
    allowNon200Codes = false,
  ) {
    try {
      if (!response) {
        ErrorService.throwError('no request response');
      }
      if (
        response.status !== 200 &&
        response.status !== 201 &&
        response.status !== 204 &&
        !allowNon200Codes
      ) {
        ErrorService.throwError(
          `status code (${response.status}) is different from 200/201/204`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        actionDescription,
        'checkRequestResponseCode',
        false,
        500,
      );
    }
  }
}
