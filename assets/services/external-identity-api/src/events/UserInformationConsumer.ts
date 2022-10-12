import { KafkaSubscriber } from '@codefi-assets-and-payments/nestjs-messaging'
import { KafkaMessage } from 'kafkajs'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { Events } from '@codefi-assets-and-payments/messaging-events'
import { KYCService } from '../services/KYCService'
import { IUserPersonalInfoUpdated } from '@codefi-assets-and-payments/messaging-events'
import { UserId } from '../data/entities/types'

@Injectable()
export class UserInformationConsumer implements KafkaSubscriber {
  topic: string = Events.userPersonalInfoUpdated.getMessageName()

  constructor(
    private logger: NestJSPinoLogger,
    private readonly kycService: KYCService,
  ) {}

  // TODO: Enable strict null/undefined checks
  async onMessage(
    decodedMessage: IUserPersonalInfoUpdated,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rawMessage: KafkaMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    topic: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    partition: number,
  ): Promise<void> {
    this.logger.info('Received message: ', {
      ...decodedMessage,
    })
    await this.kycService.processUserInfoUpdate({
      ...decodedMessage,
      userId: decodedMessage.userId as UserId,
      // TODO: Return error event if parsing fails
      dateOfBirth: new Date(decodedMessage.dateOfBirth),
    })
  }
}
