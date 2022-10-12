import { IReceipt, ITransactionContext } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationsService } from '../services/OperationsService'
import { TokensService } from '../services/TokensService'
import { EventsService } from '../services/EventsService'
import { IBlockchainEventProcessor } from './IBlockchainEventProcessor'
import { TokenEntity } from 'src/data/entities/TokenEntity'
import { EntityStatus, TokenOperationType } from '@codefi-assets-and-payments/ts-types'
import { ChainService } from '../services/ChainService'
import { toHex } from '../utils/bignumberUtils'
import config from '../config'

@Injectable()
export class TokenTransferListener implements IBlockchainEventProcessor {
  constructor(
    private logger: NestJSPinoLogger,
    private tokensService: TokensService,
    private operationsService: OperationsService,
    private eventsService: EventsService,
    private chainService: ChainService,
    private m2mTokenService: M2mTokenService,
  ) {
    this.logger.setContext(TokenTransferListener.name)
  }

  eventName(): string {
    return 'Transfer(address,address,uint256)'
  }

  async onEvent(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chainName: string,
    event: any,
  ) {
    // search in the db for operation by transactionId
    const operation = await this.operationsService.findOperationByTransactionId(
      transactionId,
    )

    if (operation) {
      await this.onOwnNodeEvent(operation, receipt, event, chainName)
      return
    }

    await this.onExternalNodeEvent(
      transactionId,
      operation,
      receipt,
      event,
      chainName,
      txContext,
    )
  }

  // TODO Use an abstract class to avoid empty methods
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  async onError(transactionId: string, error: any) {}

  private async onOwnNodeEvent(
    operation: OperationEntity,
    receipt: IReceipt,
    event: any,
    chainName: string,
  ) {
    const logger = this.logger.logger.child({
      chainName,
      operationId: operation.id,
      operationType: operation.operation,
      transactionHash: receipt.txHash,
      contractAddress: receipt.contractAddress,
    })

    logger.info('Found operation matching transfer event')

    logger.info(
      { newOperationStatus: EntityStatus.Confirmed },
      'Updating operation matching transfer event',
    )

    const operationResult = await this.operationsService.update(
      {
        id: operation.id,
      },
      {
        decodedEvent: event,
      },
    )

    logger.info({ operationResult }, 'Updated operation')
  }

  private async onExternalNodeEvent(
    transactionId: string,
    operation: OperationEntity,
    receipt: IReceipt,
    decodedEvent: any,
    chainName: string,
    txContext: ITransactionContext,
  ) {
    // do we know of this token?
    const token: TokenEntity = await this.tokensService.findTokenBy({
      contractAddress: decodedEvent.address,
      chainName,
    })

    const logger = this.logger.logger.child({
      chainName,
      transactionId,
      contractAddress: receipt.contractAddress,
      transactionHash: receipt.txHash,
      decodedEvent,
    })

    if (!token) {
      logger.info('Token not found, skipping external transfer event')
      return
    }

    const tokenLogger = logger.child({
      tokenId: token.id,
      tokenType: token.type,
    })

    tokenLogger.info('Saving new operation for external transfer event')

    let operationType: TokenOperationType = TokenOperationType.Transfer
    const isMint: boolean =
      decodedEvent.decodedData.from ===
      '0x0000000000000000000000000000000000000000'
    if (isMint) operationType = TokenOperationType.Mint
    const isBurn: boolean =
      decodedEvent.decodedData.to ===
      '0x0000000000000000000000000000000000000000'
    if (isBurn) operationType = TokenOperationType.Burn

    // save a new operation, status CONFIRMED
    await this.operationsService.create(
      {
        operationType,
        status: EntityStatus.Confirmed,
        transactionId,
        decodedEvent,
        receipt,
        chainName,
      },
    )

    const valueHex = toHex(decodedEvent.decodedData.value)
    let transactionSender = txContext.from

    tokenLogger.info('Emitting token transfer event')

    if (!transactionSender) {
      tokenLogger.info(
        'Transaction sender not found, possibly as the transaction is from an external chain, retrieving receipt',
      )

      // The event is potentially the result of someone external to Codefi, who didn't use a Codefi access token.
      // As a consequence, we need to create a M2M token with " * " as tenantId, in order to be allowed to fetch
      // the txReceipt whatever the network is.
      const authToken = await this.m2mTokenService.createM2mToken(
        config().m2mToken.client.id,
        config().m2mToken.client.secret,
        config().m2mToken.audience,
      )

      const receiptFromChain = await this.chainService.findReceipt(
        chainName,
        receipt.txHash,
        authToken,
        undefined, // headers
      )

      tokenLogger.info(
        { transactionReceipt: receiptFromChain },
        `Retrieved receipt from chain for external transfer event`,
      )

      transactionSender = receiptFromChain.from
    }

    await this.eventsService.emitTokenTransferEvent(
      token.name,
      token.symbol,
      token.contractAddress,
      valueHex,
      decodedEvent.decodedData.from,
      decodedEvent.decodedData.to,
      receipt.blockNumber,
      transactionSender,
      receipt.txHash,
      chainName,
    )
  }
}
