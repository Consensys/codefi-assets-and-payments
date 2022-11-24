import { M2mTokenService } from '@consensys/auth'
import { Commands, ISetTokenURICommand } from '@consensys/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'

import { OperationEntity } from '../data/entities/OperationEntity'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { getGroupId } from '../utils/kafka'
import { TokenCommandConsumer } from './TokenCommandConsumer'

@Injectable()
export class SetTokenURICommandConsumer extends TokenCommandConsumer {
  private tokenManagerService: TokensManagerService

  constructor(
    tokenManagerService: TokensManagerService,
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    logger.setContext(SetTokenURICommandConsumer.name)

    super(
      logger,
      m2mTokenService,
      eventsService,
      Commands.setTokenURICommand.getMessageName(),
      getGroupId(SetTokenURICommandConsumer.name),
    )

    this.tokenManagerService = tokenManagerService
  }

  async onStopListener() {
    this.logger.info(
      { name: SetTokenURICommandConsumer.name },
      'Stopping consumer',
    )
  }

  protected submitTransaction(
    decodedMessage: ISetTokenURICommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<OperationEntity> {
    return this.tokenManagerService.setTokenURI(
      decodedMessage.tokenId,
      decodedMessage.uri,
      decodedMessage.txConfig,
      decodedMessage.tenantId,
      decodedMessage.subject,
      decodedMessage.tokenEntityId,
      decodedMessage.operationId,
      decodedMessage.idempotencyKey,
      authToken,
      headers,
      decodedMessage.entityId,
    )
  }
}
