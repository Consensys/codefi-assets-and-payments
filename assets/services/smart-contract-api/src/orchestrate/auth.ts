import { logger } from '../logging/logger';
import Redis from 'ioredis';
// eslint-disable-next-line @typescript-eslint/camelcase
import jwt_decode from 'jwt-decode';
import createAxiosClient from '../web/axios';
import execRetry from '../utils/retry';
import {
  AUTH0_URL,
  M2M_TOKEN_REDIS_ENABLE,
  M2M_TOKEN_REDIS_HOST,
  M2M_TOKEN_REDIS_PASS,
} from '../config/constants';

export class IdentityProviderCallService {
  auth0Url: string;
  redisClient: Redis;
  m2mTokenRedisHost: string;
  m2mTokenRedisPass: string;
  enableM2mTokenRedisCache: boolean;

  constructor() {
    this.enableM2mTokenRedisCache = M2M_TOKEN_REDIS_ENABLE === 'true';

    this.auth0Url = AUTH0_URL;

    if (this.enableM2mTokenRedisCache) {
      this.m2mTokenRedisHost = M2M_TOKEN_REDIS_HOST;
      this.m2mTokenRedisPass = M2M_TOKEN_REDIS_PASS;

      if (!this.m2mTokenRedisHost) {
        throw new Error('missing env variable: M2M_TOKEN_REDIS_HOST');
      }

      if (!this.m2mTokenRedisPass) {
        throw new Error('missing env variable: M2M_TOKEN_REDIS_PASS');
      }

      this.redisClient = new Redis({
        host: this.m2mTokenRedisHost, // Redis host
        password: this.m2mTokenRedisPass, // Plain password
        enableReadyCheck: false,
      });
      logger.info(`redis cache from ${this.m2mTokenRedisHost} is enabled`);
    } else {
      logger.info('redis cache is disabled');
    }
  }

  /**
   * [Read cached jwt token from redis]
   */

  async readCachedJwtToken(
    clientId: string,
    audience: string,
  ): Promise<string> {
    if (!this.enableM2mTokenRedisCache) return;
    const key = `${clientId}-${audience}`;
    logger.debug(`Reading jwt token ${key} from redis cache`);
    return this.redisClient.get(key).then((jwt) => {
      if (jwt) {
        const jwtDecoded = jwt_decode(jwt) as any;
        const now = Math.round((new Date() as any) / 1000);
        logger.debug(
          `Checking cached token ${key} exp=${jwtDecoded.exp} now=${now} diff=${
            jwtDecoded.exp - now
          }`,
        );
        if (jwtDecoded.exp > now) return jwt;
        logger.info(`Cached token ${key} is expired!`);
        return;
      }
      logger.info(`No entry for cached token ${key}`);
      return;
    });
  }

  /**
   * [Write cached jwt token to redis]
   */

  async writeJwtTokenToCache(
    clientId: string,
    audience: string,
    token: string,
  ): Promise<string> {
    if (!this.enableM2mTokenRedisCache) return 'OK';
    const key = `${clientId}-${audience}`;
    logger.info(`Writing jwt token ${key} to redis cache`);
    return this.redisClient.set(key, token);
  }

  /**
   * [Create jwt token]
   */
  async createJwtToken(
    clientId: string,
    clientSecret: string,
    audience: string,
  ): Promise<string> {
    try {
      const accessToken = await this.readCachedJwtToken(clientId, audience);
      if (accessToken) return accessToken;

      const body: any = {
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: 'client_credentials',
      };

      const retriedClosure = () => {
        return createAxiosClient().post(`${this.auth0Url}oauth/token`, body);
      };
      const response = await execRetry(retriedClosure, 3, 1500, 1);

      if (!(response && response.data && response.data.length !== 0)) {
        throw new Error('auth0: no request response or empty request response');
      } else if (response.status !== 200) {
        throw new Error(
          `'auth0: status code (${response.status}) is different from 200`,
        );
      } else if (!response.data.access_token) {
        throw new Error('auth0: invalid format, access_token is missing');
      }

      const status = await this.writeJwtTokenToCache(
        clientId,
        audience,
        response.data.access_token,
      );

      if (status !== 'OK') {
        throw new Error('caching error, unable to write access_token in redis');
      }

      return response.data.access_token;
    } catch (error) {
      throw new Error(
        `error creating a jwt token by calling Auth0: ${error?.message}`,
      );
    }
  }
}

const identityProviderCallServiceInstance = new IdentityProviderCallService();

export default identityProviderCallServiceInstance;
