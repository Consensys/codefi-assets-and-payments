import { M2mTokenService } from '@consensys/auth'
import { Commands, IMintTokenCommand } from '@consensys/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'

import { OperationEntity } from '../data/entities/OperationEntity'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { getGroupId } from '../utils/kafka'
import { TokenCommandConsumer } from './TokenCommandConsumer'

@Injectable()
export class MintTokenCommandConsumer extends TokenCommandConsumer {
  private tokenManagerService: TokensManagerService

  constructor(
    tokenManagerService: TokensManagerService,
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    logger.setContext(MintTokenCommandConsumer.name)

    super(
      logger,
      m2mTokenService,
      eventsService,
      Commands.tokenMintCommand.getMessageName(),
      getGroupId(MintTokenCommandConsumer.name),
    )

    this.tokenManagerService = tokenManagerService
  }

  async onStopListener() {
    this.logger.info(
      { name: MintTokenCommandConsumer.name },
      'Stopping consumer',
    )
  }

  protected submitTransaction(
    decodedMessage: IMintTokenCommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<OperationEntity> {
    return this.tokenManagerService.mint(
      decodedMessage.type,
      decodedMessage.account,
      decodedMessage.amount || decodedMessage.tokenId,
      decodedMessage.tenantId,
      decodedMessage.subject,
      decodedMessage.txConfig,
      decodedMessage.operationId,
      undefined, // tokenEntityId
      decodedMessage.idempotencyKey,
      authToken,
      headers,
      decodedMessage.entityId,
    )
  }
}
