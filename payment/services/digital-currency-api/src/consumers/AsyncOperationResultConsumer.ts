import { Injectable } from '@nestjs/common'
import { getGroupId } from '../utils/kafka'
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability'
import { EntityStatus } from '@codefi-assets-and-payments/ts-types'
import { DigitalCurrencyEntity } from '../data/entities/DigitalCurrencyEntity'
import { OperationEntity } from '../data/entities/OperationEntity'
import { OperationService } from '../services/OperationService'
import { DigitalCurrencyService } from '../services/DigitalCurrencyService'
import {
  Events,
  IAsyncOperationResultEvent,
} from '@codefi-assets-and-payments/messaging-events'
import { KafkaPreview } from '@codefi-assets-and-payments/nestjs-messaging'
import {
  EntityNotFoundException,
  ProcessingMessageException,
} from '@codefi-assets-and-payments/error-handler'

@Injectable()
export class AsyncOperationResultConsumer
  implements KafkaPreview.IConsumerListener
{
  constructor(
    private logger: NestJSPinoLogger,
    private operationsService: OperationService,
    private digitalCurrencyService: DigitalCurrencyService,
  ) {
    this.logger.setContext(AsyncOperationResultConsumer.name)
  }
  topic: string = Events.asyncOperationResultEvent.getMessageName()
  groupId: string = getGroupId(AsyncOperationResultConsumer.name)

  async onMessage(decodedMessage: IAsyncOperationResultEvent) {
    const operationId = decodedMessage.operationId
    const result = decodedMessage.result
    const error = decodedMessage.error
    const transactionHash = decodedMessage.transactionHash
    const receipt = decodedMessage.receipt

    this.logger.info(
      `[!] topic ${
        this.topic
      } - AsyncOperationResultConsumer message received. operationId=${operationId}, result=${result}, fault=${error}, transactionHash=${transactionHash}, receipt=${JSON.stringify(
        receipt,
      )}`,
    )

    try {
      // checking if operation was already updated
      const originalOperation = await this.operationsService.findOne({
        id: operationId,
      })

      if (originalOperation.status == EntityStatus.Confirmed) {
        // an operation's event marked as confirmed is considered final
        this.logger.warn(
          `Duplicate event: async operationId=${operationId} already with status ${EntityStatus.Confirmed}.`,
        )
        return
      }
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        this.logger.warn({ operationId }, 'Operation does not exist, skip.')
        return
      } else {
        this.logger.error(
          `Retriable error processing message - Message: ${JSON.stringify(
            decodedMessage,
          )} - Error: ${JSON.stringify(error.message)}`,
        )
        throw new ProcessingMessageException(
          'ErrorProcessingMessage',
          `Error processing message, operationId=${decodedMessage.operationId}`,
          {
            operationId: decodedMessage.operationId,
          },
        )
      }
    }

    try {
      let toUpdateCurrency: Partial<DigitalCurrencyEntity> = {
        createdAt: new Date(),
        status: result ? EntityStatus.Confirmed : EntityStatus.Failed,
      }
      let toUpdateOperation: Partial<OperationEntity> = {
        createdAt: new Date(),
        status: result ? EntityStatus.Confirmed : EntityStatus.Failed,
        transactionHash: transactionHash,
      }

      if (receipt?.contractAddress) {
        toUpdateOperation = {
          ...toUpdateOperation,
          digitalCurrencyAddress: receipt?.contractAddress,
        }
        toUpdateCurrency = {
          ...toUpdateCurrency,
          currencyEthereumAddress: receipt?.contractAddress,
        }
      }

      const currencyResult =
        await this.digitalCurrencyService.updateByOperationId(
          operationId,
          toUpdateCurrency,
        )

      const operationResult = await this.operationsService.update(
        {
          id: operationId,
        },
        toUpdateOperation,
      )

      const updatedOperation = await this.operationsService.findOne({
        id: operationId,
      })
      // do not compute operation if transaction fail
      if (result) {
        await this.digitalCurrencyService.computeOperation(updatedOperation)
      }
      // this will be 1 only when we are checking the result of the creation of the currency, not for subsequent operations
      this.logger.info(`Digital currencies updated=${currencyResult}`)
      this.logger.info(`Operations updated=${operationResult}`)
    } catch (error) {
      this.logger.error(
        { topic: this.topic, groupId: this.groupId, decodedMessage, error },
        `Error processing message in ${AsyncOperationResultConsumer.name} for topic: ${this.topic}, this consumerGroupId: ${this.groupId}`,
      )
      throw new ProcessingMessageException(
        'ErrorProcessingMessage',
        `Error processing message, operationId=${decodedMessage.operationId}`,
        {
          operationId: decodedMessage.operationId,
        },
      )
    }
  }

  async onStopListener() {
    this.logger.info(`Stopping ${AsyncOperationResultConsumer.name}`)
  }
}
