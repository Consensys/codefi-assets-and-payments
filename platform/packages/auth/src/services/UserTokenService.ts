import AxiosRetry from 'axios-retry';
import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@consensys/error-handler';

import cfg from '../config';
import { createLogger } from '@consensys/observability';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserTokenService {
  private logger = createLogger('authentication');
  constructor(private readonly httpService: HttpService) {
    AxiosRetry(this.httpService.axiosRef, {
      retries: 3,
      retryDelay: (retryCount) => {
        // Retry... ${retryCount} * 1000 ms
        return retryCount * 1000;
      },
      retryCondition: (request) => {
        return (
          request.isAxiosError &&
          request.response?.status !== 200 && // In case of successful request, we don't want to retry
          request.response?.status !== 400 && // In case of bad request (malformed payload), we don't want to retry
          request.response?.status !== 401 && // In case of unauthenticated request, we don't want to retry
          request.response?.status !== 404 // In case of ressource not found, we don't want to retry
        );
      },
    });
  }

  /**
   * [Create user token]
   */
  async createUserToken(
    clientId: string,
    clientSecret: string,
    audience: string,
    username: string,
    password: string
  ): Promise<string> {
    try {
      const body: any = {
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: 'password',
        scope: 'openid profile email',
        username: username,
        password: password,
      };

      if (!cfg().auth0Url) {
        throw new UnauthorizedException(
          'No Auth0 URL',
          `Cannot request user token from Auth0 as no AUTH0_URL was provided`,
          {}
        );
      }

      const url = `${cfg().auth0Url}oauth/token`;

      this.logger.info(
        `Create user token at url ${url} with body ${JSON.stringify(body)}`
      );

      const response = await this.httpService.post(url, body).toPromise();

      if (!(response && response.data && response.data.length !== 0)) {
        throw new UnauthorizedException(
          'Auth0 Error',
          `Invalid Auth0 response: no request or undefined response`,
          {
            response,
          }
        );
      } else if (response?.status !== 200) {
        throw new UnauthorizedException(
          'Auth0 Error',
          `Invalid Auth0 response: status code (${response?.status}) is different from 200`,
          {
            responseStatus: response?.status,
            response,
          }
        );
      } else if (!response.data.access_token) {
        throw new UnauthorizedException(
          'Auth0 Error',
          `Invalid Auth0 response format: access_token is missing`,
          {
            responseData: response.data,
          }
        );
      }

      const userToken = response.data.access_token;

      return userToken;
    } catch (error) {
      throw new UnauthorizedException(
        'Token Creation Error',
        `Error creating user token: ${error?.message}`,
        {
          error,
        }
      );
    }
  }
}
