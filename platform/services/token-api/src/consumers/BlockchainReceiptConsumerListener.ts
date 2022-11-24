import {
  IConsumerListener,
  IReceipt,
  ITransactionContext,
} from '@consensys/nestjs-orchestrate'
import { EntityStatus } from '@consensys/ts-types'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import { OperationEntity } from '../data/entities/OperationEntity'
import { EventsService } from '../services/EventsService'
import { OperationsService } from '../services/OperationsService'
import { TokensService } from '../services/TokensService'
import { IBlockchainEventProcessor } from './IBlockchainEventProcessor'
import { TokenERC20DeployedListener } from './TokenERC20DeployedListener'
import { TokenERC721DeployedListener } from './TokenERC721DeployedListener'
import { TokenTransferListener } from './TokenTransferListener'
import config from '../config'
import { transactionCounter } from '../utils/metrics'

@Injectable()
export class BlockchainReceiptConsumerListener implements IConsumerListener {
  private eventProcessors: Map<string, IBlockchainEventProcessor>

  constructor(
    private logger: NestJSPinoLogger,
    private tokenERC20DeployedListener: TokenERC20DeployedListener,
    private tokenERC721DeployedListener: TokenERC721DeployedListener,
    private tokenTransferListener: TokenTransferListener,
    private operationsService: OperationsService,
    private eventsService: EventsService,
    private tokensService: TokensService,
  ) {
    this.eventProcessors = new Map<string, IBlockchainEventProcessor>()
    this.eventProcessors.set(
      this.tokenERC20DeployedListener.eventName(),
      this.tokenERC20DeployedListener,
    )
    this.eventProcessors.set(
      this.tokenERC721DeployedListener.eventName(),
      this.tokenERC721DeployedListener,
    )
    this.eventProcessors.set(
      this.tokenTransferListener.eventName(),
      this.tokenTransferListener,
    )
  }

  async onMessage(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chain: string,
  ) {
    const logger = this.logger.logger.child({
      transactionId,
      transactionHash: txContext.txHash,
      chainName: chain,
      watchedChain: config().orchestrate.chainName,
      contractAddress: receipt.contractAddress,
    })

    /* istanbul ignore next */
    if (process.env.PIPELINE && chain !== config().orchestrate.chainName) {
      logger.info('Operation detected from a chain we do not monitor')
      return
    }

    logger.info('Transaction receipt received')

    if (!transactionId && !receipt.contractAddress) {
      const transactionTo =
        receipt.logs && receipt.logs.length > 0
          ? receipt.logs[0].address
          : undefined

      logger.info(
        { transactionTo },
        `Receipt does not include a transaction ID, checking if it comes from any of the existing tokens`,
      )

      if (!transactionTo) {
        logger.info('Cannot determine token for transaction receipt, skipping')
        return
      }

      const token = await this.tokensService.findTokenBy({
        contractAddress: transactionTo,
      })

      if (!token) {
        logger.info('No token with matching address could be found, skipping')
        return
      }

      logger.info(
        { tokenId: token.id, tokenType: token.type },
        `Token found, the transaction will be processed`,
      )
    }

    await this.processEvents(transactionId, receipt, txContext, chain)
  }

  async onError(transactionId: string, error: any) {
    /* istanbul ignore next */

    const errorMessage = error.message ? error.message : JSON.stringify(error)

    this.logger.info(
      { transactionId, error: errorMessage },
      `Transaction failed`,
    )

    if (!transactionId) {
      return
    }

    const operation = await this.operationsService.findOperationByTransactionId(
      transactionId,
    )

    // Prevent any updates if the operation has already been confirmed
    if (operation?.status === EntityStatus.Confirmed) {
      this.logger.warn(
        {
          transactionId,
          operationId: operation?.id,
          newStatus: EntityStatus.Failed,
        },
        'Operation already confirmed. Skip.',
      )
      return
    }

    this.eventProcessors.forEach(
      async (processor) => await processor.onError(transactionId, error),
    )

    if (!operation) {
      transactionCounter.inc({
        operationType: undefined,
        tokenType: undefined,
        status: EntityStatus.Failed,
      })
      return
    }

    await this.operationsService.update(
      { transactionId: transactionId },
      {
        status: EntityStatus.Failed,
      },
    )

    this.logger.info(
      {
        transactionId,
        operationId: operation.id,
        operationType: operation.operation,
      },
      `Emitting async result event for failed transaction`,
    )

    await this.eventsService.emitAsyncOperationResultEvent(
      operation.id,
      false,
      operation.chainName,
      null,
      null,
      errorMessage,
    )

    transactionCounter.inc({
      operationType: operation?.operation,
      tokenType: undefined,
      status: EntityStatus.Failed,
    })
  }

  async onStopConsumer() {
    this.logger.info(
      { consumer: BlockchainReceiptConsumerListener.name },
      'Consumer stopped',
    )
  }

  private async processEvents(
    transactionId: string,
    receipt: IReceipt,
    txContext: ITransactionContext,
    chain: string,
  ) {
    const logger = this.logger.logger.child({
      transactionId,
      chainName: chain,
      contractAddress: receipt.contractAddress,
      transactionHash: receipt.txHash,
    })

    const operation = await this.operationsService.findOperationByTransactionId(
      transactionId,
    )

    const newStatus = receipt.status
      ? EntityStatus.Confirmed
      : EntityStatus.Failed

    // Prevent any updates if the operation has already been confirmed
    if (operation?.status === EntityStatus.Confirmed) {
      this.logger.warn(
        {
          transactionId,
          operationId: operation?.id,
          newStatus,
        },
        'Operation already confirmed. Skip.',
      )
      return
    }

    await this.onReceipt(operation, receipt)

    if (!receipt.logs || receipt.logs.length === 0) {
      logger.info('Receipt has no events, skipping')

      const token = await this.tokensService.findTokenBy({
        contractAddress: receipt.contractAddress,
      })

      transactionCounter.inc({
        operationType: operation?.operation,
        tokenType: token?.type,
        status: newStatus,
      })

      return
    }

    for (const log of receipt.logs) {
      logger.info({ event: log.event }, 'Processing log')

      const eventProcessor = this.eventProcessors.get(log.event)

      if (eventProcessor) {
        logger.info('Event processor found')

        await eventProcessor.onEvent(
          transactionId,
          receipt,
          txContext,
          chain,
          log,
        )
      } else {
        logger.info('Event processor not found')
      }
    }

    const token = await this.tokensService.findTokenBy({
      contractAddress: receipt.contractAddress,
    })

    transactionCounter.inc({
      operationType: operation?.operation,
      tokenType: token?.type,
      status: newStatus,
    })
  }

  /**
   * Common flow for all incoming receipts; if theres a known operation => update status, emit async result
   *
   * @param operation - operation
   * @param receipt - chain tx receipt
   */
  async onReceipt(
    operation: OperationEntity,
    receipt: IReceipt,
  ): Promise<OperationEntity | undefined> {
    const logger = this.logger.logger.child({
      transactionId: operation?.transactionId,
      operationId: operation?.id,
      operationType: operation?.operation,
      contractAddress: receipt.contractAddress,
      transactionHash: receipt.txHash,
    })

    if (!operation) {
      logger.info('Receipt received for unknown transaction')
      return
    }

    const newStatus = receipt.status
      ? EntityStatus.Confirmed
      : EntityStatus.Failed

    logger.info(
      { newOperationStatus: newStatus },
      'Updating operation for transaction receipt',
    )

    await this.operationsService.update(
      {
        id: operation.id,
      },
      {
        status: newStatus,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.txHash,
        receipt: receipt,
      },
    )

    logger.info('Emitting async result event for operation')

    await this.eventsService.emitAsyncOperationResultEvent(
      operation.id,
      receipt.status,
      operation.chainName,
      receipt.txHash,
      receipt.contractAddress
        ? { contractAddress: receipt.contractAddress }
        : null,
      // TODO Find out what we can add from the error for failed tx
    )

    return operation
  }
}
