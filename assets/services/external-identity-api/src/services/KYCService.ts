import { Injectable, NotFoundException } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import OnFidoClient from './onfido/OnFidoClient'
import UserDataAccess from '../repositories/UserDataAccess'
import { UserPersonalInfo } from './PersonalInformation'
import KYCEventsProducer from '../events/KYCEventsProducer'
import { userId } from '../utils/test-data'
import { UserId } from '../data/entities/types'

@Injectable()
export class KYCService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly onFidoClient: OnFidoClient,
    private readonly userRepository: UserDataAccess,
    private readonly kycEventsProducer: KYCEventsProducer,
  ) {}

  async processUserInfoUpdate(
    userInformation: UserPersonalInfo,
    apiToken?: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getByUserId(userInformation.userId)
      if (user) {
        this.logger.info('Received personal information for an existing user', {
          userId: userInformation.userId,
        })
        await this.onFidoClient.updateApplicant(
          user.onfidoApplicationId,
          userInformation,
          apiToken,
        )
        return
      }

      this.logger.info('Received personal information for a new user', {
        userId: userInformation.userId,
      })
      const applicantId = await this.onFidoClient.createApplicant(
        userInformation,
        apiToken,
      )
      await this.userRepository.create({
        userId: userInformation.userId as UserId,
        onfidoApplicationId: applicantId,
      })
    } catch (error) {
      this.logger.error(
        {
          userId,
          error,
        },
        'Failed to submit personal information to Onfido',
      )
      throw error
    }
  }

  async generateJwtToken(userId: UserId, apiToken?: string): Promise<string> {
    const user = await this.userRepository.getByUserId(userId)
    if (user) {
      const token = await this.onFidoClient.generateJwtToken(
        user.onfidoApplicationId,
        apiToken,
      )
      this.logger.info('Onfido JWT token successfully generated')
      return token
    } else {
      this.logger.error(
        `Failed to generate a JWT Token for OnFido applicant. User ${userId} does not exist.`,
      )
      throw new NotFoundException(
        `Failed to generate a JWT Token for OnFido applicant. User ${userId} does not exist.`,
      )
    }
  }

  async submitCheck(userId: UserId, apiToken?: string): Promise<string> {
    const user = await this.userRepository.getByUserId(userId)
    if (!user) {
      this.logger.error(
        { userId },
        `Failed to submit a check for OnFido applicant. User does not exist.`,
      )
      throw new NotFoundException(
        `Failed to submit a check for OnFido applicant. User ${userId} does not exist.`,
      )
    }
    const applicantId = user.onfidoApplicationId
    const checkId = await this.onFidoClient.initializeCheckForApplicantId(
      applicantId,
      apiToken,
    )
    this.logger.info(
      { userId, checkId },
      'Check has been successfully submitted on Onfido.',
    )
    return checkId
  }
}
