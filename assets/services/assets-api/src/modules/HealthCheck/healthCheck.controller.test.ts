import { HealthCheckController } from './healthCheck.controller';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;

  beforeEach(() => {
    controller = new HealthCheckController();
  });

  it('HealthCheck', async () => {
    const healthResponse = await controller.health();

    await expect(healthResponse).toBe('OK');
  });
});
