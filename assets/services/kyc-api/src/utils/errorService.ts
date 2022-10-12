import { HttpException } from '@nestjs/common';

class ErrorService {
  /**
   * [Throw error]
   */
  throwError(message: string, status?: number) {
    const errorStatus: number = status ? status : 500;
    throw new HttpException(
      {
        message: `${message}`,
        status: errorStatus,
      },
      errorStatus,
    );
  }

  /**
   * [Throw error when making an API call]
   */
  throwApiCallError = (
    functionName: string,
    apiName: string,
    error,
    status?: number,
  ) => {
    const errorMessage = `${
      error.message
        ? error.message
        : error.response && error.response.data
        ? JSON.stringify(error.response.data)
        : error
    }`.replace('-->', '->');

    const errorStatus: number = status
      ? status
      : error.status
      ? error.status
      : 500;

    const pathArray: string[] = errorMessage.split(' --> ');

    throw new HttpException(
      {
        message: `${functionName} --> [${apiName}] ${
          pathArray[pathArray.length - 1]
        }`,
        status: errorStatus,
      },
      errorStatus,
    );
  };

  /**
   * [Log error before throwing]
   */
  logAndThrowFunctionError(
    error: any,
    message: string,
    functionName: string,
    isController: boolean,
    status?: number,
  ) {
    const errorStatus: number = status
      ? status
      : error.status
      ? error.status
      : 500;
    const errorMessage = `${functionName} --> ${
      error?.message ? error.message : error
    }`;

    const pathArray: string[] = errorMessage.split(' --> ');

    // Error shall only be printed when this function is called from a controller (ontherwise it would be printed multiple times)
    if (isController) {
      console.error(`Something went wront while ${message}`, {
        error,
      });
    }

    throw new HttpException(
      {
        message: isController
          ? `Something went wront while ${message}: ${
              pathArray[pathArray.length - 1]
            }`
          : errorMessage,
        status: errorStatus,
      },
      errorStatus,
    );
  }
}

const errorService = new ErrorService();

export default errorService;
