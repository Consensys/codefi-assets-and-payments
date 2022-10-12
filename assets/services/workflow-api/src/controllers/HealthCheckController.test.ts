import {
  HealthCheckController,
  HEALTHCHECK_MESSAGE,
} from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController

  beforeEach(() => {
    controller = new HealthCheckController()
  })

  it('health', async () => {
    await expect(controller.health()).toBe(HEALTHCHECK_MESSAGE)
  })
})
