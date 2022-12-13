import 'reflect-metadata';
import { M2mTokenService } from './M2mTokenService';
import createMockInstance from 'jest-create-mock-instance';
import {
  audienceMock,
  clientIdMock,
  clientSecretMock,
  m2mTokenMock,
  redisHostMock,
  redisPassMock,
} from '../../test/mock';
import jwt_decode from 'jwt-decode';
import Redis from 'ioredis';
import cfg from '../config';
import { createMockLogger } from '../test/mock';
import { HttpService } from '@nestjs/axios';

jest.mock('@consensys/observability', () => ({
  createLogger: () => createMockLogger(),
}));

jest.mock('axios-retry');
jest.mock('jwt-decode', () => jest.fn());
jest.mock('ioredis', () => jest.fn());

describe('M2mTokenService', () => {
  let service: M2mTokenService;
  let httpServiceMock: jest.Mocked<HttpService>;
  let memoryCacheMock: { [cachedKey: string]: string };
  let redisMock;

  const createDecodedToken = (expireDiff: number, iatDiff = -1000) => {
    const now = new Date().getTime() / 1000;

    return {
      exp: now + expireDiff,
      iat: now + iatDiff,
    };
  };

  beforeAll(() => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    Redis.mockReturnValue(redisMock);
  });

  beforeEach(() => {
    cfg().m2mToken.expireThreshold = 100;
    cfg().m2mToken.redis.host = redisHostMock;
    cfg().m2mToken.redis.pass = redisPassMock;

    httpServiceMock = createMockInstance(HttpService);
    memoryCacheMock = {};
    service = new M2mTokenService(httpServiceMock).withMemoryCache(
      memoryCacheMock
    );

    redisMock.get.mockReset();
    redisMock.set.mockReset();
    (jwt_decode as jest.Mocked<any>).mockReset();
  });

  describe('createM2mToken', () => {
    it('retrieves token from memory cache', async () => {
      memoryCacheMock[`${clientIdMock}-${audienceMock}`] = m2mTokenMock;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(60)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
    });

    it('retrieves token from redis cache if not in memory cache', async () => {
      redisMock.get.mockResolvedValueOnce(m2mTokenMock);

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(60)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );
    });

    it('retrieves token from redis cache if token in memory cache is expired', async () => {
      memoryCacheMock[`${clientIdMock}-${audienceMock}`] = 'Not Used';

      redisMock.get.mockResolvedValueOnce(m2mTokenMock);

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(-60)
      );

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(60)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );
    });

    it('retrieves token from redis cache if token in memory cache is expired according to threshold', async () => {
      memoryCacheMock[`${clientIdMock}-${audienceMock}`] = 'Not Used';

      redisMock.get.mockResolvedValueOnce(m2mTokenMock);

      cfg().m2mToken.expireThreshold = 50;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(40, -60)
      );

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(90, -10)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );
    });

    it('ignores expire threshold if token in memory cache has no issue time', async () => {
      memoryCacheMock[`${clientIdMock}-${audienceMock}`] = m2mTokenMock;

      cfg().m2mToken.expireThreshold = 50;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(40, null)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
    });

    it('does not retrieve token from redis cache if token in memory cache has no expiration', async () => {
      memoryCacheMock[`${clientIdMock}-${audienceMock}`] = m2mTokenMock;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(undefined, undefined)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );
    });

    it('retrieves token from auth0 if not in memory or redis caches', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 200,
          }),
      } as any);

      redisMock.set.mockResolvedValueOnce('OK');

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);

      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );

      expect(redisMock.set).toHaveBeenCalledTimes(1);
      expect(redisMock.set).toHaveBeenCalledWith(
        `${clientIdMock}-${audienceMock}`,
        m2mTokenMock
      );
    });

    it('retrieves token from auth0 if token in redis cache expired', async () => {
      redisMock.get.mockResolvedValueOnce('Not Used');

      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 200,
          }),
      } as any);

      redisMock.set.mockResolvedValueOnce('OK');

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(-60)
      );

      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);

      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );

      expect(redisMock.set).toHaveBeenCalledTimes(1);
      expect(redisMock.set).toHaveBeenCalledWith(
        `${clientIdMock}-${audienceMock}`,
        m2mTokenMock
      );
    });

    it('retrieves token from auth0 if token in redis cache is expired according to threshold', async () => {
      redisMock.get.mockResolvedValueOnce('Not Used');

      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 200,
          }),
      } as any);

      redisMock.set.mockResolvedValueOnce('OK');

      cfg().m2mToken.expireThreshold = 50;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(40, -60)
      );
      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);

      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );

      expect(redisMock.set).toHaveBeenCalledTimes(1);
      expect(redisMock.set).toHaveBeenCalledWith(
        `${clientIdMock}-${audienceMock}`,
        m2mTokenMock
      );
    });

    it('ignores expire threshold if token in redis cache has no issue time', async () => {
      redisMock.get.mockResolvedValueOnce(m2mTokenMock);

      cfg().m2mToken.expireThreshold = 50;

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(40, null)
      );
      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);
    });

    it('does not retrieve token from auth0 if token in redis cache has no expiration', async () => {
      redisMock.get.mockResolvedValueOnce(m2mTokenMock);

      (jwt_decode as jest.Mocked<any>).mockReturnValueOnce(
        createDecodedToken(undefined, undefined)
      );
      const token = await service.createM2mToken(
        clientIdMock,
        clientSecretMock,
        audienceMock
      );

      expect(token).toEqual(m2mTokenMock);

      expect(memoryCacheMock[`${clientIdMock}-${audienceMock}`]).toEqual(
        m2mTokenMock
      );
    });

    it('throws if updating redis cache returns failure', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 200,
          }),
      } as any);

      redisMock.set.mockResolvedValueOnce('FAIL');

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError('Error caching m2m token in Redis');
    });

    it('throws if error reading from redis', async () => {
      redisMock.get.mockImplementation(() => {
        throw new Error('Test Error');
      });

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(`Error creating m2m token: Test Error`);
    });

    it('throws if error retrieving token from auth0', async () => {
      httpServiceMock.post.mockImplementation(() => {
        throw new Error('Test Error');
      });

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(`Error creating m2m token: Test Error`);
    });

    it('throws if error writing to redis', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 200,
          }),
      } as any);

      redisMock.set.mockImplementation(() => {
        throw new Error('Test Error');
      });

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(`Error creating m2m token: Test Error`);
    });

    it('throws if empty response from auth0', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            status: 200,
          }),
      } as any);

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(
        `Error creating m2m token: Invalid Auth0 response: no request or undefined response`
      );
    });

    it('throws if bad status code from auth0', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {
              access_token: m2mTokenMock,
            },
            status: 400,
          }),
      } as any);

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(
        `Error creating m2m token: Invalid Auth0 response: status code (400) is different from 200`
      );
    });

    it('throws if no access token from auth0', async () => {
      httpServiceMock.post.mockReturnValueOnce({
        toPromise: () =>
          Promise.resolve({
            data: {},
            status: 200,
          }),
      } as any);

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(
        `Error creating m2m token: Invalid Auth0 response format: access_token is missing`
      );
    });

    it('throws if no redis host env', async () => {
      cfg().m2mToken.redis.host = undefined;

      expect(() => {
        new M2mTokenService(httpServiceMock);
      }).toThrowError(
        `Cannot connect to Redis as no M2M_TOKEN_REDIS_HOST was provided`
      );
    });

    it('throws if no redis pass env', async () => {
      cfg().m2mToken.redis.pass = undefined;

      expect(() => {
        new M2mTokenService(httpServiceMock);
      }).toThrowError(
        `Cannot connect to Redis as no M2M_TOKEN_REDIS_PASS was provided`
      );
    });

    it('throws if no auth0 url env', async () => {
      cfg().auth0Url = undefined;

      await expect(
        service.createM2mToken(clientIdMock, clientSecretMock, audienceMock)
      ).rejects.toThrowError(
        `Cannot request M2M token from Auth0 as no AUTH0_URL was provided`
      );
    });
  });
});
