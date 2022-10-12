import { ApmService, ApmTransactionStarted } from '@codefi-assets-and-payments/observability';
import * as KafkaJS from 'kafkajs';
import { Consumer } from './Consumer';
import { ResponseMessage } from './ResponseMessage';
import { IConsumerListener, IConsumerOptions } from './types';

export class CodefiConsumer extends Consumer {
  constructor(
    private consumerListener: IConsumerListener,
    options?: IConsumerOptions,
    runConfig?: KafkaJS.ConsumerRunConfig,
    private apmService?: ApmService,
  ) {
    super(consumerListener.topic, consumerListener.groupId, options, runConfig);
  }

  async startConsumer() {
    await this.connectConsumer();
    await this.consume();
  }

  async stopConsumer() {
    await this.consumer.disconnect();

    if (this.consumerListener) {
      await this.consumerListener.onStopListener();
    }
  }

  protected async onMessage(message: ResponseMessage) {
    const { value, topic } = message.content();

    let apmTransaction: ApmTransactionStarted;
    const apmTraceParent = value?.traceParent;
    if (this.apmService && apmTraceParent) {
      try {
        apmTransaction = this.apmService.startTransaction(topic, {
          childOf: apmTraceParent,
        });
      } catch (error) {
        this.logger.warn(
          { apmTraceParent, error },
          'Failed to start apm transaction',
        );
      }
    }

    await this.consumerListener.onMessage(value);

    if (apmTransaction) {
      try {
        apmTransaction.trans.end();
      } catch (error) {
        this.logger.warn(
          { apmTraceParent, error },
          'Failed to end apm transaction',
        );
      }
    }
  }

  protected async onPostMessage(message: ResponseMessage, isSuccess: boolean) {
    if (isSuccess) {
      await message.commit();
    }

    await message.heartbeat();
  }
}
