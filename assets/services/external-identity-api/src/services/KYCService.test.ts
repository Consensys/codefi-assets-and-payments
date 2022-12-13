import createMockInstance from 'jest-create-mock-instance'
import { NestJSPinoLogger } from '@consensys/observability'
import OnFidoClient from './onfido/OnFidoClient'
import { KYCService } from './KYCService'
import UserDataAccess from '../repositories/UserDataAccess'
import Mocked = jest.Mocked
import { userId, userPersonalInformation } from '../utils/test-data'
import InvalidPersonalInfoError from './onfido/InvalidPersonalInfoError'
import KYCEventsProducer from '../events/KYCEventsProducer'
import { UserEntity } from '../data/entities/UserEntity'
import { OnfidoApplicantId, UserId } from '../data/entities/types'

const user: UserEntity = {
  userId: 'userId' as UserId,
  onfidoApplicationId: 'applicantId' as OnfidoApplicantId,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('KYCService', () => {
  let logger: NestJSPinoLogger
  let onFidoClient: Mocked<OnFidoClient>
  let userRepository: Mocked<UserDataAccess>
  let kycEventsProducer: Mocked<KYCEventsProducer>
  let service: KYCService

  beforeEach(() => {
    logger = createMockInstance(NestJSPinoLogger)
    onFidoClient = createMockInstance(OnFidoClient)
    userRepository = createMockInstance(UserDataAccess)
    kycEventsProducer = createMockInstance(KYCEventsProducer)
    service = new KYCService(
      logger,
      onFidoClient,
      userRepository,
      kycEventsProducer,
    )
  })

  it('create an applicant and checks if received a new user', async () => {
    userRepository.getByUserId.mockResolvedValue(undefined)
    onFidoClient.createApplicant.mockResolvedValue(
      'applicantId' as OnfidoApplicantId,
    )

    await service.processUserInfoUpdate(userPersonalInformation())
    expect(userRepository.create).toHaveBeenCalledWith({
      userId,
      onfidoApplicationId: 'applicantId',
    })
    expect(onFidoClient.createApplicant).toHaveBeenCalledWith(
      userPersonalInformation(),
      undefined,
    )
  })

  it('update an applicant and checks if received an existing user', async () => {
    userRepository.getByUserId.mockResolvedValue(user)

    await service.processUserInfoUpdate(userPersonalInformation())
    expect(onFidoClient.createApplicant).not.toBeCalled()
    expect(onFidoClient.updateApplicant).toHaveBeenCalledWith(
      'applicantId',
      userPersonalInformation(),
      undefined,
    )
  })

  it('successfully generate a jwt token when user exists', async () => {
    userRepository.getByUserId.mockResolvedValue(user)
    await service.generateJwtToken(userPersonalInformation().userId)
    expect(onFidoClient.generateJwtToken).toBeCalled()
    expect(logger.info).toBeCalled()
    expect(onFidoClient.generateJwtToken).toHaveBeenCalledWith(
      user.onfidoApplicationId,
      undefined,
    )
  })

  it('successful submission of check to onfido', async () => {
    userRepository.getByUserId.mockResolvedValue(user)
    await service.submitCheck(userPersonalInformation().userId)
    expect(onFidoClient.initializeCheckForApplicantId).toBeCalled()
    expect(onFidoClient.initializeCheckForApplicantId).toHaveBeenCalledWith(
      user.onfidoApplicationId,
      undefined,
    )
    expect(logger.info).toBeCalled()
  })

  it('throw an unexpected error', async () => {
    const error = new Error('test-error')
    userRepository.getByUserId.mockResolvedValue(undefined)
    onFidoClient.createApplicant.mockRejectedValue(error)

    await expect(
      service.processUserInfoUpdate(userPersonalInformation()),
    ).rejects.toThrow(error)
  })

  it('fails at generating a jwt token when user does not exist', async () => {
    const userId = userPersonalInformation().userId
    await expect(service.generateJwtToken(userId)).rejects.toThrowError(
      `Failed to generate a JWT Token for OnFido applicant. User ${userId} does not exist.`,
    )
  })
})
