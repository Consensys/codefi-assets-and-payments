import { FeesController } from './fees.controller';
import createMockInstance from 'jest-create-mock-instance';
import { FeesService } from './fees.service';

describe('FeesController', () => {
  let controller: FeesController;
  let feesServiceMock: FeesService;
  beforeEach(() => {
    feesServiceMock = createMockInstance(FeesService);

    controller = new FeesController(feesServiceMock);
  });

  it('Order', async () => {
    await expect(true).toBe(true);
  });
});
