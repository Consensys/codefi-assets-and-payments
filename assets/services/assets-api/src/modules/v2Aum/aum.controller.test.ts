import { AumController } from './aum.controller';
import createMockInstance from 'jest-create-mock-instance';
import { AumService } from './aum.service';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

describe('AumController', () => {
  let controller: AumController;
  let aumServiceMock: AumService;
  beforeEach(() => {
    aumServiceMock = createMockInstance(AumService);
    controller = new AumController(aumServiceMock);
  });

  it('Order', async () => {
    await expect(true).toBe(true);
  });
});
