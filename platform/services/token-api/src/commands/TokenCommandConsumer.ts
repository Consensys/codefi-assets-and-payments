import { M2mTokenService } from '@consensys/auth'
import { ITokenCommand } from '@consensys/messaging-events'
import { OrchestrateUtils } from '@consensys/nestjs-orchestrate'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { NewTokenResponse } from '@consensys/ts-types'

import config from '../config'
import { EventsService } from '../services/EventsService'
import { TokenEntity } from '../data/entities/TokenEntity'
import { OperationEntity } from '../data/entities/OperationEntity'
import { KafkaPreview } from '@consensys/nestjs-messaging'

@Injectable()
export abstract class TokenCommandConsumer
  implements KafkaPreview.IConsumerListener
{
  constructor(
    protected logger: NestJSPinoLogger,
    private m2mTokenService: M2mTokenService,
    private eventsService: EventsService,
    public topic: string,
    public groupId: string,
  ) {}

  async onMessage(decodedMessage: ITokenCommand) {
    try {
      this.logger.info(
        { topic: this.topic, decodedMessage },
        'Command received',
      )

      // We need to create an M2M token to communicate with Orchestrate
      // The M2M token will include "*" as tenantId in its custom claims,
      // allowing it to act on behalf of another tenant.
      const authToken = await this.m2mTokenService.createM2mToken(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )

      const headers = OrchestrateUtils.buildOrchestrateHeadersForTenant(
        decodedMessage.tenantId,
        decodedMessage.entityId,
      )

      const result = await this.submitTransaction(
        decodedMessage,
        authToken,
        headers,
      )

      this.logger.info(
        { topic: this.topic, decodedMessage, result },
        'Command processed successfully',
      )
    } catch (error) {
      const errorMessage = error.message ? error.message : JSON.stringify(error)

      this.logger.error(
        { topic: this.topic, decodedMessage, error },
        'Error processing command',
      )

      await this.eventsService.emitAsyncOperationResultEvent(
        decodedMessage.operationId,
        false,
        decodedMessage.txConfig?.chainName,
        null,
        null,
        errorMessage,
      )
    }
  }

  abstract onStopListener(): Promise<void>

  protected abstract submitTransaction(
    decodedMessage: ITokenCommand,
    authToken: string,
    headers: { [x: string]: string },
  ): Promise<TokenEntity | OperationEntity | NewTokenResponse>
}
