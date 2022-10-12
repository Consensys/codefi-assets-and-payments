import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse, AxiosInstance } from 'axios';

import { ApiCallHelperService } from '.';
import ErrorService from 'src/utils/errorService';
import execRetry from 'src/utils/retry';
import { Subscription } from 'src/types/subscription';

const API_NAME = 'DataFeed-API';
const datafeedHost = process.env.DATAFEED_API;

@Injectable()
export class ApiDataFeedService {
  private dataFeed: AxiosInstance;

  constructor(private readonly apiCallHelperService: ApiCallHelperService) {
    this.dataFeed = axios.create({
      baseURL: datafeedHost,
    });
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const retriedClosure = () => {
        return this.dataFeed.get('/subscriptions/');
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'fetching all subscriptions',
        response,
        true,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'getAllSubscriptions',
        API_NAME,
        error,
        500,
      );
    }
  }

  async createSubscription(subscription: Subscription): Promise<Subscription> {
    try {
      const retriedClosure = () => {
        return this.dataFeed.post('/subscriptions/', subscription);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'creating a subscription',
        response,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'createSubscription',
        API_NAME,
        error,
        500,
      );
    }
  }

  async deleteSubscription(id: string): Promise<AxiosResponse<string>> {
    try {
      const retriedClosure = () => {
        return this.dataFeed.delete(`/subscriptions/${id}`);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      this.apiCallHelperService.checkRequestResponseFormat(
        'deleting a subscription',
        response,
        true,
      );
      return response.data;
    } catch (error) {
      ErrorService.throwApiCallError(
        'deleteSubscription',
        API_NAME,
        error,
        500,
      );
    }
  }
}
