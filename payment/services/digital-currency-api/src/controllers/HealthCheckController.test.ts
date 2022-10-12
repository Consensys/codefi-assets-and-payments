import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus'
import createMockInstance from 'jest-create-mock-instance'
import { PersistentConfigurationService } from '../services/PersistentConfigurationService'
import { HealthCheckController } from './HealthCheckController'

describe('HealthCheckController', () => {
  let controller: HealthCheckController
  let persistentConfigurationServiceMock: jest.Mocked<PersistentConfigurationService>
  let healthCheckServiceMock: jest.Mocked<HealthCheckService>
  let typeOrmHealthIndicatorMock: jest.Mocked<TypeOrmHealthIndicator>

  beforeEach(() => {
    persistentConfigurationServiceMock = createMockInstance(
      PersistentConfigurationService,
    )
    healthCheckServiceMock = createMockInstance(HealthCheckService)
    typeOrmHealthIndicatorMock = createMockInstance(TypeOrmHealthIndicator)
    controller = new HealthCheckController(
      healthCheckServiceMock,
      typeOrmHealthIndicatorMock,
    )
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
