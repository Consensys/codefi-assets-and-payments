import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from '.';

import execRetry from 'src/utils/retry';
import axios, { AxiosInstance } from 'axios';
import { M2mTokenService } from '@consensys/auth';

import config from 'src/config';

const M2M_TOKEN_CLIENT_ID = config().m2mToken.client.id;
const M2M_TOKEN_CLIENT_SECRET = config().m2mToken.client.secret;
const M2M_TOKEN_AUDIENCE = config().m2mToken.audience;

const REFERENCE_DATA_HOST: string = process.env.REFERENCE_DATA_API;
const API_NAME = 'Reference-Data-Api';

@Injectable()
export class ApiReferenceDataCallService {
  private referenceData: AxiosInstance;

  constructor(
    private readonly apiCallHelperService: ApiCallHelperService,
    private m2mTokenService: M2mTokenService,
  ) {
    this.referenceData = axios.create({
      baseURL: REFERENCE_DATA_HOST,
    });
  }

  async createReferenceDataInDB(referenceData: any) {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_CLIENT_ID,
        M2M_TOKEN_CLIENT_SECRET,
        M2M_TOKEN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.referenceData.post(
          '/reference-data',
          referenceData,
          config,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'create reference data in DB',
        response,
      );

      return response.data.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'createReferenceDataInDB',
        API_NAME,
        error,
        500,
      );
    }
  }

  async updateReferenceDataInDB(referenceData: any, referenceDataId: string) {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_CLIENT_ID,
        M2M_TOKEN_CLIENT_SECRET,
        M2M_TOKEN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.referenceData.put(
          `/reference-data/${referenceDataId}`,
          referenceData,
          config,
        );
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'update reference data in DB',
        response,
      );

      return response.data.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'updateReferenceDataInDB',
        API_NAME,
        error,
        500,
      );
    }
  }

  async retrieveReferenceDataFromDB(key: string, value: string) {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_CLIENT_ID,
        M2M_TOKEN_CLIENT_SECRET,
        M2M_TOKEN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
        params: {
          query: {
            queries: [
              {
                operator: 'and',
                condition: 'equals',
                searchCase: 'sensitive',
                key,
                value,
              },
            ],
          },
        },
      };

      const retriedClosure = () => {
        return this.referenceData.get('/reference-data', config);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieve reference data from DB',
        response,
      );

      return response.data.items;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveReferenceDataFromDB',
        API_NAME,
        error,
        500,
      );
    }
  }

  async retrieveReferenceDataByTypeFromDB(type: string) {
    try {
      const accessToken = await this.m2mTokenService.createM2mToken(
        M2M_TOKEN_CLIENT_ID,
        M2M_TOKEN_CLIENT_SECRET,
        M2M_TOKEN_AUDIENCE,
      );

      const config = {
        headers: {
          Authorization: 'Bearer '.concat(accessToken),
        },
      };

      const retriedClosure = () => {
        return this.referenceData.get(`/reference-data/type/${type}`, config);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieve reference data by type from DB',
        response,
      );

      return response.data.items;
    } catch (error) {
      ErrorService.throwApiCallError(
        'retrieveReferenceDataByTypeFromDB',
        API_NAME,
        error,
        500,
      );
    }
  }
}
