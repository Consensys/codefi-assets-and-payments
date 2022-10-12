import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController

  beforeEach(() => {
    controller = new HealthCheckController()
  })

  it('healt check', () => {
    expect(controller.heathCheck()).toBe('ok')
  })

  it('check', async () => {
    expect(controller.readiness()).toBe('ok')
  })
})
