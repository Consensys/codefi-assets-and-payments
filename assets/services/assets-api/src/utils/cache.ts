import crypto from 'crypto';
import ErrorService from 'src/utils/errorService';

// LOCAL SETUP
// Use "node-cache" for caching (Redis is not available for local development).
import NodeCache from 'node-cache';

// PROD SETUP
// Use Redis for caching.
import Redis from 'ioredis';
import RedisCache from 'ioredis-cache';

const ttlSecs = 100;
const commoncache = 'commoncache';

const localDev = process.env.LOCAL_DEV || false;

class Cache {
  redisCache: RedisCache;
  nodeCache: NodeCache;

  local;

  constructor() {
    // LOCAL SETUP
    if (localDev) {
      this.nodeCache = new NodeCache({ stdTTL: ttlSecs, checkperiod: 120 });
    } else {
      // PROD SETUP
      if (!process.env.REDIS_HOST) {
        throw new Error('missing env variable: REDIS_HOST');
      }

      if (!process.env.REDIS_PASS) {
        throw new Error('missing env variable: REDIS_PASS');
      }
      this.redisCache = new RedisCache(
        new Redis({
          host: process.env.REDIS_HOST,
          password: process.env.REDIS_PASS,
          enableReadyCheck: false,
        }),
      );
    }
  }

  craftCacheKey(params: object, functionName?: string): string {
    return crypto
      .createHash('md5')
      .update(`${functionName}${JSON.stringify(params)}`)
      .digest('hex');
  }

  getUserId(userId: string): string {
    return userId ? userId : commoncache;
  }

  async getDataFromCache(param: object, dataName: string, userId: string) {
    try {
      const valueObject = await this.getValue(
        this.craftCacheKey(param, dataName),
        userId,
      );
      return valueObject ? valueObject.value : null;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'getting data from cache',
        'getDataFromCache',
        false,
        500,
      );
    }
  }

  async setDataInCache(
    param: object,
    dataName: string,
    userId: string,
    value: any,
  ) {
    try {
      // We need to store a value object (and not directly the value), because of
      // the edge case when value 0 is stored.
      // When value 0 is stored, we retrieve 'null' when retrieving data from cache.
      const valueObject = { value };
      return this.setValue(
        this.craftCacheKey(param, dataName),
        valueObject,
        userId,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'setting data in cache',
        'setDataInCache',
        false,
        500,
      );
    }
  }

  async getValue(key: string, userId: string) {
    const _userId: string = this.getUserId(userId);
    let storedValues;
    if (localDev) {
      // LOCAL SETUP
      storedValues = await this.nodeCache.get(_userId);
    } else {
      // PROD SETUP
      storedValues = await this.redisCache.getCache(_userId);
    }
    if (storedValues && storedValues[key]) return storedValues[key];
    return null;
  }

  async setValue(key: string, value: any, userId: string) {
    const _userId: string = this.getUserId(userId);
    let storedValues;
    if (localDev) {
      // LOCAL SETUP
      storedValues = await this.nodeCache.get(_userId);
    } else {
      // PROD SETUP
      storedValues = await this.redisCache.getCache(_userId);
    }

    if (!storedValues) {
      storedValues = {};
    }
    storedValues[key] = value;

    if (localDev) {
      // LOCAL SETUP
      return this.nodeCache.set(_userId, storedValues);
    } else {
      // PROD SETUP
      return this.redisCache.setCache(_userId, storedValues, ttlSecs);
    }
  }

  async clearCacheForUser(userId: string) {
    if (localDev) {
      // LOCAL SETUP
      return this.nodeCache.del(userId);
    } else {
      // PROD SETUP
      return this.redisCache.deleteCache(userId);
    }
  }
}

const myCache = new Cache();

export default myCache;
