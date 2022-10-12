import Redis from 'ioredis';
import AxiosRetry from 'axios-retry';
import { Injectable } from '@nestjs/common';
import jwt_decode from 'jwt-decode';
import { UnauthorizedException } from '@codefi-assets-and-payments/error-handler';

import cfg from '../config';
import { createLogger } from '@codefi-assets-and-payments/observability';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class M2mTokenService {
  redisClient: Redis;
  private logger = createLogger('authentication');
  private memoryCache: { [cacheKey: string]: string };

  constructor(private readonly httpService: HttpService) {
    this.memoryCache = {};

    if (cfg().m2mToken.redis.enable) {
      const redisHost = cfg().m2mToken.redis.host;
      const redisPass = cfg().m2mToken.redis.pass;

      if (!redisHost) {
        throw new UnauthorizedException(
          'No Redis Host',
          `Cannot connect to Redis as no M2M_TOKEN_REDIS_HOST was provided`,
          {}
        );
      }

      if (!redisPass) {
        throw new UnauthorizedException(
          'No Redis Pass',
          `Cannot connect to Redis as no M2M_TOKEN_REDIS_PASS was provided`,
          {}
        );
      }

      this.redisClient = new Redis({
        host: redisHost, // Redis host
        password: redisPass, // Plain password
        enableReadyCheck: false,
      });
      this.logger.info(
        `redis cache is enabled with host ${redisHost} for m2m tokens`
      );
    } else {
      this.logger.info('redis cache is disabled for m2m tokens');
    }

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

  withMemoryCache(memoryCache: { [cacheKey: string]: string }): M2mTokenService {
    this.memoryCache = memoryCache;
    return this;
  }

  /**
   * [Create m2m token]
   */
  async createM2mToken(
    clientId: string,
    clientSecret: string,
    audience: string
  ): Promise<string> {
    try {
      const memoryCacheToken = await this.readMemoryCache(clientId, audience);
      if (memoryCacheToken) return memoryCacheToken;

      const redisCacheToken = await this.readCachedM2mToken(clientId, audience);

      if (redisCacheToken) {
        await this.writeToMemoryCache(clientId, audience, redisCacheToken);
        return redisCacheToken;
      }

      const m2mToken = await this.requestFreshToken(
        clientId,
        clientSecret,
        audience
      );

      await this.writeToMemoryCache(clientId, audience, m2mToken);

      const status = await this.writeM2mTokenToCache(
        clientId,
        audience,
        m2mToken
      );

      if (status !== 'OK') {
        throw new UnauthorizedException(
          'Token Creation Error',
          `Error caching m2m token in Redis`,
          {
            m2mToken,
            status,
          }
        );
      }

      return m2mToken;
    } catch (error) {
      throw new UnauthorizedException(
        'Token Creation Error',
        `Error creating m2m token: ${error?.message}`,
        {
          error,
        }
      );
    }
  }

  /**
   * [Read m2m token from redis cache]
   */
  async readCachedM2mToken(
    clientId: string,
    audience: string
  ): Promise<string> {
    if (!cfg().m2mToken.redis.enable) return;

    const cachingKey = this.craftM2mTokenCachingKey(clientId, audience);
    this.logger.debug(`Reading m2m token ${cachingKey} from redis cache`);

    const m2mToken = await this.redisClient.get(cachingKey);

    if (!m2mToken) {
      this.logger.info(`No entry for cached m2m token ${cachingKey}`);
      return;
    }

    if (this.isTokenExpired(m2mToken, cachingKey)) return;

    return m2mToken;
  }

  /**
   * [Write m2m token to redis cache]
   */
  async writeM2mTokenToCache(
    clientId: string,
    audience: string,
    m2mToken: string
  ): Promise<string> {
    if (!cfg().m2mToken.redis.enable) return 'OK';

    const cachingKey = this.craftM2mTokenCachingKey(clientId, audience);
    this.logger.info(`Writing m2m token ${cachingKey} to redis cache`);

    return this.redisClient.set(cachingKey, m2mToken);
  }

  /**
   * [Craft key that will be used to set m2m token in cache]
   */
  craftM2mTokenCachingKey(clientId: string, audience: string): string {
    return `${clientId}-${audience}`;
  }

  private async writeToMemoryCache(
    clientId: string,
    audience: string,
    m2mToken: string
  ) {
    const cachingKey = this.craftM2mTokenCachingKey(clientId, audience);
    this.logger.info(`Writing m2m token to memory cache: ${cachingKey}`);
    this.memoryCache[cachingKey] = m2mToken;
  }

  private async readMemoryCache(
    clientId: string,
    audience: string
  ): Promise<string> {
    const cachingKey = this.craftM2mTokenCachingKey(clientId, audience);

    this.logger.debug(
      `Checking memory cache for m2m token with key: ${cachingKey}`
    );

    const cachedToken = this.memoryCache[cachingKey];

    if (!cachedToken) {
      this.logger.info(
        `No entry in memory cache for m2m token with key: ${cachingKey}`
      );
      return;
    }

    if (this.isTokenExpired(cachedToken, cachingKey)) return;

    return cachedToken;
  }

  private isTokenExpired(token: string, cachingKey: string): boolean {
    const m2mTokenDecoded = jwt_decode(token) as any;
    let expireTime = m2mTokenDecoded.exp;

    if (!expireTime) return false;

    let logger = this.logger.child({
      cachingKey,
      expireTime,
    });

    const issueTime = m2mTokenDecoded.iat;

    if (issueTime) {
      const lifetime = expireTime - issueTime;
      const expireThreshold = cfg().m2mToken.expireThreshold;

      const expireTimeAfterThreshold =
        lifetime * (expireThreshold / 100) + issueTime;

      expireTime = expireTimeAfterThreshold;

      logger = logger.child({
        issueTime,
        lifetime,
        expireThreshold,
        expireTimeAfterThreshold,
      });
    }

    const now = Math.round((new Date() as any) / 1000);

    logger = logger.child({
      now,
      remaining: expireTime - now,
    });

    logger.debug('Checking cached M2M token expiry');

    if (expireTime > now) return false;

    logger.info('Cached M2M token is expired');

    return true;
  }

  private async requestFreshToken(
    clientId: string,
    clientSecret: string,
    audience: string
  ): Promise<string> {
    const body: any = {
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      grant_type: 'client_credentials',
    };

    if (!cfg().auth0Url) {
      throw new UnauthorizedException(
        'No Auth0 URL',
        `Cannot request M2M token from Auth0 as no AUTH0_URL was provided`,
        {}
      );
    }

    const url = `${cfg().auth0Url}oauth/token`;
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

    return response.data.access_token;
  }
}
