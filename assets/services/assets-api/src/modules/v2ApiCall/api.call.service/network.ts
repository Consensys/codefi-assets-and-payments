import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import { ApiCallHelperService } from '.';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import execRetry from 'src/utils/retry';
import { NetworkBodyInput } from 'src/modules/v2Network/network.dto';
import config from 'src/config';
import { IHeaders } from 'pegasys-orchestrate';

const NETWORK_HOST: string = config().networkApi.url;
const API_NAME = 'Network-Api';

@Injectable()
export class ApiNetworkCallService {
  private network: AxiosInstance;

  constructor(private readonly apiCallHelperService: ApiCallHelperService) {
    this.network = axios.create({
      baseURL: NETWORK_HOST,
    });
  }

  /**
   * [List networks]
   *
   */
  async listAllNetworks(authToken: string, key?: string) {
    let requestQuery = '/networks';
    const httpRequestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
    };

    if (key) {
      requestQuery += `&key=${key}`;
    }

    try {
      const retriedClosure = () => {
        return this.network.get(requestQuery, httpRequestConfig);
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1, true);

      this.apiCallHelperService.checkRequestResponseFormat(
        'getting networks',
        response,
        null,
        true,
      );

      return response.data;
    } catch (error) {
      error.message = `${error.message}`;
      ErrorService.throwApiCallError(
        'registerNetwork',
        API_NAME,
        error,
        500,
        error.status,
      );
    }
  }

  /**
   * [Retrieve network]
   *
   */
  async retrieveNetwork(authToken: string, key: string) {
    const requestQuery = `/networks/${key}`;
    const httpRequestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
    };

    try {
      const retriedClosure = () => {
        return this.network.get(requestQuery, httpRequestConfig);
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1, true);

      this.apiCallHelperService.checkRequestResponseFormat(
        'retrieving networks',
        response,
        null,
        true,
      );

      return response.data;
    } catch (error) {
      error.message = `${error.message}`;
      ErrorService.throwApiCallError(
        'retrieveNetwork',
        API_NAME,
        error,
        500,
        error.status,
      );
    }
  }

  /**
   * [Delete network]
   *
   */
  async deleteNetwork(
    key: string,
    authToken: string,
  ): Promise<{
    message: string;
  }> {
    const httpRequestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
    };

    try {
      const retriedClosure = () => {
        return this.network.delete(`/networks/${key}`, httpRequestConfig);
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1, true);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting network',
        response,
        null,
        true,
      );

      return response.data;
    } catch (error) {
      error.message = `${error.message}`;
      ErrorService.throwApiCallError(
        'deleteNetwork',
        API_NAME,
        error,
        500,
        error.status,
      );
    }
  }

  /**
   * [Create a network]
   *
   */
  async createNetwork(
    networkDetails: NetworkBodyInput,
    authToken: string,
    multiTenantHeaders: IHeaders,
  ) {
    try {
      const httpRequestConfig: AxiosRequestConfig = {
        headers: {
          Authorization: 'Bearer ' + authToken,
          'x-tenant-id': multiTenantHeaders['X-Tenant-ID'],
        },
      };

      const retriedClosure = () => {
        return this.network.post(
          '/networks',
          networkDetails,
          httpRequestConfig,
        );
      };

      const response = await execRetry(retriedClosure, 3, 1500, 1, true);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating network',
        response,
        null,
        true,
      );

      return response.data;
    } catch (error) {
      error.message = `${error.message}`;
      ErrorService.throwApiCallError(
        'createNetwork',
        API_NAME,
        error,
        500,
        error.status,
      );
    }
  }
}
