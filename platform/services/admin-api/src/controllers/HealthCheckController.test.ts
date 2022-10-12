import { HealthCheckService } from '@nestjs/terminus'
import createMockInstance from 'jest-create-mock-instance'
import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController
  let healthCheckServiceMock: jest.Mocked<HealthCheckService>

  beforeEach(() => {
    healthCheckServiceMock = createMockInstance(HealthCheckService)
    controller = new HealthCheckController(healthCheckServiceMock)
  })

  it('health', async () => {
    await expect(controller.health()).toBe('OK')
  })

  it('check', async () => {
    const expected = {
      status: 'ok' as any,
      details: {},
    }
    healthCheckServiceMock.check.mockResolvedValueOnce(expected)

    const result = await controller.check()

    expect(healthCheckServiceMock.check).toHaveBeenCalledTimes(1)
    expect(healthCheckServiceMock.check).toHaveBeenCalledWith([])
    expect(result).toBe(expected)
  })
})
