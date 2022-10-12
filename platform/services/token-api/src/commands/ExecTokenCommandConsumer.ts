import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { Commands, IExecTokenCommand } from '@codefi-assets-and-payments/messaging-events'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'

import { OperationEntity } from '../data/entities/OperationEntity'
import { EventsService } from '../services/EventsService'
import { TokensManagerService } from '../services/TokensManagerService'
import { getGroupId } from '../utils/kafka'
import { TokenCommandConsumer } from './TokenCommandConsumer'

@Injectable()
export class ExecTokenCommandConsumer extends TokenCommandConsumer {
  private tokenManagerService: TokensManagerService

  constructor(
    tokenManagerService: TokensManagerService,
    logger: NestJSPinoLogger,
    m2mTokenService: M2mTokenService,
    eventsService: EventsService,
  ) {
    logger.setContext(ExecTokenCommandConsumer.name)

    super(
      logger,
      m2mTokenService,
      eventsService,
      Commands.execTokenCommand.getMessageName(),
      getGroupId(ExecTokenCommandConsumer.name),
    )

    this.tokenManagerService = tokenManagerService
  }

  async onStopListener() {
    this.logger.info(
      { name: ExecTokenCommandConsumer.name },
      'Stopping consumer',
    )
  }

  protected submitTransaction(
    decodedMessage: IExecTokenCommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<OperationEntity> {
    return this.tokenManagerService.exec(
      decodedMessage.functionName,
      decodedMessage.params,
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
