import { UserController } from './UserController'
import { KYCService } from '../services/KYCService'
import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import Mocked = jest.Mocked
import { userPersonalInformation } from '../utils/test-data'

describe('HealthCheckController', () => {
  let logger: Mocked<NestJSPinoLogger>
  let service: Mocked<KYCService>
  let controller: UserController

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    service = createMockInstance(KYCService)
    controller = new UserController(logger, service)
  })

  it('get jwt token', async () => {
    await controller.getJwtToken(userPersonalInformation().userId)
    expect(service.generateJwtToken).toHaveBeenCalledWith(
      userPersonalInformation().userId,
      undefined,
    )
  })

  it('submit check', async () => {
    await controller.submitCheck(userPersonalInformation().userId)
    expect(service.submitCheck).toHaveBeenCalledWith(
      userPersonalInformation().userId,
      undefined,
    )
  })

  it('submit user information', async () => {
    await controller.createApplicant({
      ...userPersonalInformation(),
      dateOfBirth: '1990-01-01',
    })
    expect(service.processUserInfoUpdate).toHaveBeenCalledWith(
      {
        ...userPersonalInformation(),
      },
      undefined,
    )
  })
})
