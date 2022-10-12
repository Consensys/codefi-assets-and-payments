import { HooksController } from './hooks.controller';
import { HooksService } from './hooks.service';

import createMockInstance from 'jest-create-mock-instance';

// Mock Redis client
jest.mock('ioredis');
// Mock Redis cache client
jest.mock('ioredis-cache');

describe('HooksController', () => {
  let controller: HooksController;
  let hooksServiceMock: HooksService;

  beforeEach(() => {
    hooksServiceMock = createMockInstance(HooksService);
    controller = new HooksController(hooksServiceMock);
  });

  it('Hooks', async () => {
    await expect(true).toBe(true);
  });
});
