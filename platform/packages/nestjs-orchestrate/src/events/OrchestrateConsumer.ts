import cfg from '../config'
import { IConsumerListener } from './IConsumerListener'
import { Consumer, EventType, ResponseMessage } from 'pegasys-orchestrate'
import { Injectable } from '@nestjs/common'
import {
  ApmService,
  ApmTransactionStarted,
  createLogger
} from '@consensys/observability'

@Injectable()
export class OrchestrateConsumer {
  private consumer: Consumer
  private logger = createLogger('orchestrate')

  constructor(private readonly apmService: ApmService) {}

  async startConsumer(
    consumerListener: IConsumerListener,
    providedGroupId?: string,
  ) {
    let groupId = cfg().kafkaGroupId
      ? `${cfg().kafkaGroupId}-orchestrate`
      : undefined
    if (providedGroupId) {
      groupId += `-${providedGroupId}`
    }
    this.consumer = new Consumer(
      [cfg().orchestrateKafkaUrl],
      undefined,
      undefined,
      {
        groupId,
      },
    )
    await this.consumer.connect()
    this.consumer.on(EventType.Response, async (message: ResponseMessage) => {
      const { value, topic } = message.content()

      let apmTransaction: ApmTransactionStarted
      const apmTraceParent = value?.contextLabels?.apmTraceParent
      if (apmTraceParent) {
        try {
          apmTransaction = this.apmService.startTransaction(
            `orchestrate-${topic}`,
            {
              childOf: apmTraceParent,
            },
          )
        } catch (error) {
          this.logger.warn(
            { apmTraceParent, error },
            'Failed to start apm transaction',
          )
        }
      }

      if (value.errors && value.errors.length !== 0) {
        await consumerListener.onError(value.id, value.errors)
      } else {
        const skipMessage =
          cfg().orchestrateFilterFlag &&
          cfg().orchestrateFilterFlag !== value?.contextLabels?.filterFlag

        if (skipMessage) {
          this.logger.info(
            `Message consumed but skipped because it doesn't include ${
              cfg().orchestrateFilterFlag
            } flag in it's metadata (${
              value?.contextLabels?.filterFlag
            } instead)`,
          )
        } else {
          await consumerListener.onMessage(
            value.id,
            value.receipt,
            value.txContext,
            value.chain,
            value.contextLabels,
          )
        }
      }

      if (apmTransaction) {
        try {
          apmTransaction.trans.end()
        } catch (error) {
          this.logger.warn(
            { apmTraceParent, error },
            'Failed to end apm transaction',
          )
        }
      }

      await message.commit()
    })
    await this.consumer.consume()
  }

  async stopConsumer(consumerListener?: IConsumerListener) {
    await this.consumer.disconnect()
    if (consumerListener) {
      await consumerListener.onStopConsumer()
    }
  }
}
