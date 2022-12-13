import { KafkaProducer } from '@consensys/nestjs-messaging'
import { Injectable } from '@nestjs/common'
import { NestJSPinoLogger } from '@consensys/observability'
import config from '../config'
import {
  IAsyncOperationResultEvent,
  Events,
  ITokenDeployedEvent,
  ITokenTransferEvent,
  IReceipt,
} from '@consensys/messaging-events'
import {} from 'kafkajs'

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kafkaProducer: KafkaProducer,
  ) {
    logger.setContext(EventsService.name)
  }

  async emitAsyncOperationResultEvent(
    operationId: string,
    result: boolean,
    chainName: string,
    transactionHash: string | null,
    receipt: IReceipt | null,
    error: string | null = null,
  ) {
    if (config().kafka.enabled) {
      const event: IAsyncOperationResultEvent = {
        operationId,
        result,
        transactionHash,
        receipt,
        chainName,
        error,
      }

      this.logger.info(
        {
          event,
          error: event.error || undefined,
          topic: Events.asyncOperationResultEvent.getMessageName(),
        },
        'Sending async operation result event',
      )

      const eventResult = await this.kafkaProducer.send(
        Events.asyncOperationResultEvent,
        event,
      )
      return eventResult
    } else {
      this.logger.info(`Kafka disabled, not sending async result event`)
    }
  }

  async emitTokenDeployedEvent(
    name: string,
    symbol: string,
    decimals: number,
    contractAddress: string,
    deployerAddress: string,
    transactionHash: string,
    blockNumber: number,
    chainName: string,
  ) {
    if (config().kafka.enabled) {
      const event: ITokenDeployedEvent = {
        name,
        symbol,
        decimals: decimals ? Math.floor(decimals) : 0,
        contractAddress,
        deployerAddress,
        transactionHash,
        blockNumber,
        chainName,
      }

      this.logger.info(
        { event, topic: Events.tokenDeployedEvent.getMessageName() },
        'Sending token deployed event',
      )

      const eventResult = await this.kafkaProducer.send(
        Events.tokenDeployedEvent,
        event,
      )
      return eventResult
    } else {
      this.logger.info(`Kafka disabled, not sending token deployed event`)
    }
  }

  async emitTokenTransferEvent(
    tokenName: string,
    symbol: string,
    contractAddress: string,
    amount: string,
    from: string,
    account: string,
    blockNumber: number,
    transactionSender: string,
    transactionHash: string,
    chainName: string,
  ) {
    if (!config().kafka.enabled) {
      this.logger.info(`Kafka disabled, not sending token transfer event`)
      return
    }

    const event: ITokenTransferEvent = {
      name: tokenName,
      symbol,
      contractAddress,
      amount,
      from,
      transactionSender,
      account,
      blockNumber,
      transactionHash,
      chainName,
    }

    this.logger.info(
      { event, topic: Events.tokenTransferEvent.getMessageName() },
      `Sending token transfer event`,
    )

    await this.kafkaProducer.send<ITokenTransferEvent>(
      Events.tokenTransferEvent,
      event,
    )
  }
}
