import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import createMockInstance from 'jest-create-mock-instance';
import { M2mTokenService } from '@consensys/auth';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

describe('NetworkController', () => {
  let controller: NetworkController;
  let networkServiceMock: NetworkService;
  let m2mTokenServiceMock: M2mTokenService;

  beforeEach(() => {
    networkServiceMock = createMockInstance(NetworkService);
    controller = new NetworkController(networkServiceMock, m2mTokenServiceMock);
  });

  it('Network', async () => {
    await expect(true).toBe(true);
  });
});
