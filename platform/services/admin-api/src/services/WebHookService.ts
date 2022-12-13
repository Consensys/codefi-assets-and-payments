import { Injectable } from '@nestjs/common'
import { AuthHookRegisterRequest } from '../requests/AuthHookRegisterRequest'
import { IUserCreatedEvent } from '@consensys/messaging-events'
import { NestJSPinoLogger } from '@consensys/observability'
import { EventsService } from './EventsService'

@Injectable()
export class WebHookService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly eventsService: EventsService,
  ) {
    logger.setContext(WebHookService.name)
  }

  async processAuthRegisterWebHook(
    authRegisteRequest: AuthHookRegisterRequest,
  ): Promise<boolean> {
    const userCreatedPayload: IUserCreatedEvent = {
      userId: authRegisteRequest.user.user_id,
      email: authRegisteRequest.user.email,
      name: authRegisteRequest.user.name,
      picture: authRegisteRequest.user.picture,
      emailVerified: authRegisteRequest.user.email_verified || false,
      appMetadata: JSON.stringify(authRegisteRequest.user.app_metadata) || '{}',
      userMetadata:
        JSON.stringify(authRegisteRequest.user.user_metadata) || '{}',
    }
    if (
      !userCreatedPayload.userId ||
      !userCreatedPayload.email ||
      !userCreatedPayload.name
    ) {
      this.logger.error(
        'Wrong request, userId, email and name are mandatory: %o',
        authRegisteRequest,
      )
      return false
    }
    try {
      await this.eventsService.emitUserCreatedEvent(userCreatedPayload)
    } catch (error) {
      this.logger.error('Error pushing auth hook into kafka: %o', error)
      return false
    }
    return true
  }
}
