import { HealthCheckController } from './HealthCheckController';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;

  beforeEach(() => {
    controller = new HealthCheckController();
  });

  it('health', async () => {
    await expect(controller.health()).toBe(
      'Codefi API KYC4. Check the swagger file to learn more about it',
    );
  });
});
