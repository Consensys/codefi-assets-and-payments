import { Injectable } from '@nestjs/common'
import { IReceipt, ITransactionContext } from '@codefi-assets-and-payments/nestjs-orchestrate'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationsService } from '../services/OperationsService'
import { TokensService } from '../services/TokensService'
import { EventsService } from '../services/EventsService'
import { IBlockchainEventProcessor } from './IBlockchainEventProcessor'
import { EntityStatus, TokenType, TokenOperationType } from '@codefi-assets-and-payments/ts-types'
import config from '../config'
import { M2mTokenService } from '@codefi-assets-and-payments/auth'
import { ChainService } from '../services/ChainService'

@Injectable()
export abstract class AbstractTokenDeployedListener
  implements IBlockchainEventProcessor
{
  constructor(
    private logger: NestJSPinoLogger,
    private tokensService: TokensService,
    private operationsService: OperationsService,
    private eventsService: EventsService,
    private chainService: ChainService,
    private m2mTokenService: M2mTokenService,
  ) {
    this.logger.setContext(AbstractTokenDeployedListener.name)
  }

  abstract eventName(): string

  abstract tokenType(): TokenType

  async onEvent(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chainName: string,
    event: any,
  ) {
    // search in the db  for token by transactionId
    const name = event.decodedData.name
    const symbol = event.decodedData.symbol
    const decimals = event.decodedData.decimals
    const contractAddress = receipt.contractAddress

    const token = transactionId
      ? await this.tokensService.findTokenBy({ transactionId })
      : undefined

    const logger = this.logger.logger.child({
      transactionId,
      transactionHash: receipt.txHash,
      chainName,
      event,
      contractAddress,
    })

    if (token) {
      const tokenLogger = logger.child({
        tokenId: token.id,
        tokenType: token.type,
        operationId: token.operationId,
      })

      tokenLogger.info('Found token matching deployed event')

      tokenLogger.info(
        { newOperationStatus: EntityStatus.Confirmed },
        'Updating deploy operation',
      )

      const operationResult = await this.operationsService.update(
        {
          id: token.operationId,
        },
        {
          status: EntityStatus.Confirmed,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.txHash,
        },
      )

      tokenLogger.info(
        { newTokenStatus: EntityStatus.Confirmed },
        'Updating token matching deployed event',
      )

      const tokenResult = await this.tokensService.update(
        { id: token.id },
        {
          status: EntityStatus.Confirmed,
          contractAddress,
        },
      )

      tokenLogger.info(
        { operationResult, tokenResult },
        'Updated deploy operation and token',
      )
    } else {
      logger.info('Token not found, assuming token was created by another node')

      const transactionSender = await this.getTransactionSender(
        txContext,
        chainName,
      )

      if (!transactionSender) {
        logger.info('Deployer is not set, skipping')
        return
      }

      logger.info('Saving new operation for deploy event')

      const operationSaved: OperationEntity =
        await this.operationsService.create({
          operationType: TokenOperationType.Deploy,
          status: EntityStatus.Confirmed,
          transactionId,
          chainName,
        })

      logger.info(
        { deployer: transactionSender },
        'Saving new token for deploy event',
      )

      // save new token, status CONFIRMED
      await this.tokensService.save({
        id: undefined,
        status: EntityStatus.Confirmed,
        type: this.tokenType(),
        name,
        symbol,
        decimals,
        chainName,
        deployerAddress: transactionSender,
        contractAddress: contractAddress,
        operationId: operationSaved.id,
        transactionId: transactionId,
        createdAt: new Date(),
      })

      await this.eventsService.emitTokenDeployedEvent(
        name,
        symbol,
        decimals,
        contractAddress,
        transactionSender,
        receipt.txHash,
        receipt.blockNumber,
        chainName,
      )
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onError(transactionId: string, error: any) {
    await this.tokensService.update(
      {
        transactionId: transactionId,
      },
      {
        status: EntityStatus.Failed,
      },
    )
  }

  private async getTransactionSender(
    txContext: ITransactionContext,
    chainName: string,
  ): Promise<string> {
    if (txContext.from) {
      return txContext.from
    }

    const logger = this.logger.logger.child({
      transactionHash: txContext.txHash,
      chainName,
    })

    logger.info(
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
      txContext.txHash,
      authToken,
      undefined, // headers
    )

    logger.info('Retrieved transaction receipt from chain')

    return receiptFromChain.from
  }
}
