import { ApiCallController } from './api.call.controller';

describe('Controller', () => {
  let controller: ApiCallController;

  beforeEach(() => {
    controller = new ApiCallController();
  });

  it('ApiCall', async () => {
    await expect(true).toBe(true);
  });
});
