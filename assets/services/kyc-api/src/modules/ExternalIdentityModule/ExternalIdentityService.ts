import { Injectable, HttpStatus } from '@nestjs/common';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { isEmail } from 'class-validator';

import ErrorService from 'src/utils/errorService';
import { UserInformationRequest } from './constants';
import { AxiosInstance } from 'src/services/instances/AxiosInstance';
import execRetry from 'src/utils/retry';
import { RequestUserInfo } from '../ElementInstanceModule/RequestUserInfo';
import { ElementInstanceModel } from '../ElementInstanceModule/ElementInstanceModel';

const API_NAME = '[External-Identity-API]';
const EXTERNAL_IDENTITY_HOST = process.env.EXTERNAL_IDENTITY_API;

function validateEmail(email: string): boolean {
  return isEmail(email);
}

@Injectable()
export class ApiExternalIdentityService {
  constructor(
    // private readonly apiCallHelperService: ApiCallHelperService,
    private readonly axios: AxiosInstance,
    private readonly logger: NestJSPinoLogger,
  ) {}

  extractUserInfo(
    user: RequestUserInfo,
    fetchedElementInstances: ElementInstanceModel[],
  ): UserInformationRequest {
    const userInfo = fetchedElementInstances.reduce(
      (
        userDetails: UserInformationRequest,
        { elementKey, value }: ElementInstanceModel,
      ) => {
        if (elementKey.startsWith('firstName_personalInformation')) {
          return {
            ...userDetails,
            firstName: value[0],
          };
        } else if (elementKey.startsWith('lastName_personalInformation')) {
          return {
            ...userDetails,
            lastName: value[0],
          };
        } else if (elementKey.startsWith('dateOfBirth_personalInformation')) {
          return {
            ...userDetails,
            dateOfBirth: value[0],
          };
        } else if (
          elementKey === 'us_state_personalInformation_naturalPersonSection' ||
          elementKey === 'us_state_entity_legalPersonSection'
        ) {
          return {
            ...userDetails,
            state: value[0],
          };
        } else if (
          elementKey.startsWith('country_personalInformation') ||
          elementKey.startsWith('country_entity')
        ) {
          return {
            ...userDetails,
            country: value[0],
          };
        } else if (
          elementKey.startsWith('domicileAddressLine1_personalInformation') ||
          elementKey.startsWith('domicileAddressLine1_entity')
        ) {
          return {
            ...userDetails,
            street: value[0],
          };
        } else if (
          elementKey.startsWith('city_personalInformation') ||
          elementKey.startsWith('city_entity')
        ) {
          return {
            ...userDetails,
            city: value[0],
          };
        } else if (
          elementKey.startsWith('postalCode_personalInformation') ||
          elementKey.startsWith('postalCode_entity')
        ) {
          return {
            ...userDetails,
            postalCode: value[0],
          };
        }
        return userDetails;
      },
      {
        email: user.email,
        userId: user.id,
        firstName: null,
        lastName: null,
        dateOfBirth: null,
        country: null,
        buildingNumber: '',
        street: null,
        city: null,
        state: null,
        postalCode: null,
      },
    );

    if (userInfo.email && !validateEmail(userInfo.email)) {
      ErrorService.throwError(
        `Please ensure user email follows the right format. Current value is ${userInfo.email}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return userInfo;
  }

  async createApplicantOnOnfido(
    request: UserInformationRequest,
    apiToken: string,
  ): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.axios
          .instance()
          .post(
            `${EXTERNAL_IDENTITY_HOST}/kyc-provider/onfido/create-applicant`,
            request,
            {
              params: {
                apiToken,
              },
            },
          );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.logger.info(
        { userId: request.userId },
        'Applicant has just been created on Onfido.',
      );
      return response.data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getJwtToken(userId: string, apiToken: string): Promise<string> {
    try {
      const retriedClosure = () => {
        return this.axios
          .instance()
          .get(
            `${EXTERNAL_IDENTITY_HOST}/kyc-provider/onfido/jwt-token/userId=${userId}`,
            {
              params: {
                apiToken,
              },
            },
          );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.logger.info(
        { userId },
        'Onfido JWT token has just been created for the user.',
      );
      return response.data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async submitOnfidoCheck(userId: string, apiToken: string): Promise<string> {
    try {
      const response = await this.axios
        .instance()
        .get(
          `${EXTERNAL_IDENTITY_HOST}/kyc-provider/onfido/submit-check/${userId}`,
          {
            params: {
              apiToken,
            },
          },
        );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'submitOnfidoCheck',
        API_NAME,
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
