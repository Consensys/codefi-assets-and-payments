import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { Commands, IBurnTokenCommand } from '@codefi-assets-and-payments/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { OperationEntity } from '../data/entities/OperationEntity'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { getGroupId } from '../utils/kafka'
import { TokenCommandConsumer } from './TokenCommandConsumer'

@Injectable()
export class BurnTokenCommandConsumer extends TokenCommandConsumer {
  private tokenManagerService: TokensManagerService

  constructor(
    tokenManagerService: TokensManagerService,
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    logger.setContext(BurnTokenCommandConsumer.name)

    super(
      logger,
      m2mTokenService,
      eventsService,
      Commands.burnTokenCommand.getMessageName(),
      getGroupId(BurnTokenCommandConsumer.name),
    )

    this.tokenManagerService = tokenManagerService
  }

  async onStopListener() {
    this.logger.info(
      { name: BurnTokenCommandConsumer.name },
      'Stopping consumer',
    )
  }

  protected submitTransaction(
    decodedMessage: IBurnTokenCommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<OperationEntity> {
    return this.tokenManagerService.burn(
      decodedMessage.amount || decodedMessage.tokenId,
      decodedMessage.txConfig,
      decodedMessage.tenantId,
      decodedMessage.subject,
      decodedMessage.operationId,
      undefined, // tokenEntityId
      decodedMessage.idempotencyKey,
      authToken,
      headers,
      decodedMessage.entityId,
    )
  }
}
