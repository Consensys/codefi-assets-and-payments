import { M2mTokenService } from '@consensys/auth'
import { Commands, ITransferTokenCommand } from '@consensys/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'

import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { getGroupId } from '../utils/kafka'
import { TokenCommandConsumer } from './TokenCommandConsumer'
import { OperationEntity } from '../data/entities/OperationEntity'

@Injectable()
export class TransferTokenCommandConsumer extends TokenCommandConsumer {
  private tokenManagerService: TokensManagerService

  constructor(
    tokenManagerService: TokensManagerService,
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    logger.setContext(TransferTokenCommandConsumer.name)

    super(
      logger,
      m2mTokenService,
      eventsService,
      Commands.transferTokenCommand.getMessageName(),
      getGroupId(TransferTokenCommandConsumer.name),
    )

    this.tokenManagerService = tokenManagerService
  }

  async onStopListener() {
    this.logger.info(
      { name: TransferTokenCommandConsumer.name },
      'Stopping consumer',
    )
  }

  protected submitTransaction(
    decodedMessage: ITransferTokenCommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<OperationEntity> {
    return this.tokenManagerService.transfer(
      decodedMessage.type,
      decodedMessage.amount || decodedMessage.tokenId,
      decodedMessage.recipient,
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
