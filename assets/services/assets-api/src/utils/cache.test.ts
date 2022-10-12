import RedisCache from 'ioredis-cache';
import CacheService from 'src/utils/cache';
import crypto from 'crypto';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

const RedisCacheMock = RedisCache as jest.Mocked<typeof RedisCache>;

describe('Cache', () => {
  const ttlSecs = 100;
  const userId = 'user1';
  const value = 'value';
  const value2 = 'value2';
  const funcName = 'function';
  const funcName2 = 'function2';
  const params: object = { param: 'param' };
  const params2: object = { param2: 'param2' };
  const key = crypto
    .createHash('md5')
    .update(`${funcName}${JSON.stringify(params)}`)
    .digest('hex');
  const key2 = crypto
    .createHash('md5')
    .update(`${funcName2}${JSON.stringify(params2)}`)
    .digest('hex');
  const storedValues: object = {
    [key]: {
      value: value,
    },
  };
  const storedValues2: object = {
    [key2]: {
      value: value2,
    },
  };
  const storedValuesUnion: object = { ...storedValues, ...storedValues2 };

  it('is defined', async () => {
    await expect(CacheService).toBeDefined();
  });
  it('returns null', async () => {
    (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
      Promise.resolve(),
    );
    await expect(CacheService.getDataFromCache(params, funcName, userId))
      .resolves.toBeUndefined;
    expect(CacheService.redisCache.getCache).toHaveBeenCalledWith(userId);
  });
  it('returns a value', async () => {
    (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
      Promise.resolve(storedValues),
    );
    await expect(
      CacheService.getDataFromCache(params, funcName, userId),
    ).resolves.toEqual(storedValues[key].value);
    expect(CacheService.redisCache.getCache).toHaveBeenCalledWith(userId);
  });
  it('sets value', async () => {
    (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
      Promise.resolve(),
    );
    (RedisCacheMock.prototype.setCache as jest.Mock).mockImplementation(() =>
      Promise.resolve('OK'),
    );
    await expect(
      CacheService.setDataInCache(params, funcName, userId, value),
    ).resolves.toEqual('OK');
    expect(CacheService.redisCache.getCache).toHaveBeenCalledWith(userId);
    expect(CacheService.redisCache.setCache).toHaveBeenCalledWith(
      userId,
      storedValues,
      ttlSecs,
    );
  });
  it('overrides value', async () => {
    (RedisCacheMock.prototype.setCache as jest.Mock).mockImplementation(() =>
      Promise.resolve('OK'),
    );
    (RedisCacheMock.prototype.getCache as jest.Mock).mockImplementation(() =>
      Promise.resolve(storedValues),
    );
    await expect(
      CacheService.setDataInCache(params2, funcName2, userId, value2),
    ).resolves.toEqual('OK');
    expect(CacheService.redisCache.getCache).toHaveBeenCalledWith(userId);
    expect(CacheService.redisCache.setCache).toHaveBeenCalledWith(
      userId,
      storedValuesUnion,
      ttlSecs,
    );
  });
  it('deletes a key', async () => {
    (RedisCacheMock.prototype.deleteCache as jest.Mock).mockImplementation(() =>
      Promise.resolve('OK'),
    );
    await expect(CacheService.clearCacheForUser(userId)).resolves.toStrictEqual(
      'OK',
    );
    expect(CacheService.redisCache.deleteCache).toHaveBeenCalledWith(userId);
  });
});
