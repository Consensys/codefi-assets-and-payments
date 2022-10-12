import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus'
import createMockInstance from 'jest-create-mock-instance'
import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController
  let healthCheckServiceMock: jest.Mocked<HealthCheckService>
  let typeOrmHealthIndicatorMock: jest.Mocked<TypeOrmHealthIndicator>

  beforeEach(() => {
    healthCheckServiceMock = createMockInstance(HealthCheckService)
    typeOrmHealthIndicatorMock = createMockInstance(TypeOrmHealthIndicator)
    controller = new HealthCheckController(
      healthCheckServiceMock,
      typeOrmHealthIndicatorMock,
    )
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
    expect(healthCheckServiceMock.check).toHaveBeenCalledWith([
      expect.anything(),
    ])
    expect(result).toBe(expected)
  })
})
