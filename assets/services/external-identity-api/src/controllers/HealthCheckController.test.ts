import {
  HealthCheckService,
  HealthCheckStatus,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import createMockInstance from 'jest-create-mock-instance'
import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController
  let healthCheckServiceMock: jest.Mocked<HealthCheckService>
  let db: jest.Mocked<TypeOrmHealthIndicator>

  beforeEach(() => {
    healthCheckServiceMock = createMockInstance(HealthCheckService)
    db = createMockInstance(TypeOrmHealthIndicator)
    controller = new HealthCheckController(healthCheckServiceMock, db)
  })

  it('healt check', () => {
    expect(controller.heathCheck()).toBe('ok')
  })

  it('check', async () => {
    const expected = {
      status: 'ok' as HealthCheckStatus,
      details: {},
    }
    healthCheckServiceMock.check.mockResolvedValueOnce(expected)

    const result = await controller.readiness()

    expect(healthCheckServiceMock.check).toHaveBeenCalledTimes(1)
    expect(result).toBe(expected)
  })
})
