import { ApmService, createLogger } from '@codefi-assets-and-payments/observability';
import { Injectable, OnApplicationShutdown, Optional } from '@nestjs/common';
import { CodefiConsumer } from './CodefiConsumer';
import { IConsumerListener, CodefiConsumersOptions } from './types';

@Injectable()
export class CodefiConsumerService implements OnApplicationShutdown {
  private readonly logger = createLogger(CodefiConsumerService.name);
  private readonly consumers: CodefiConsumer[] = [];
  private options: CodefiConsumersOptions;

  constructor(@Optional() private apmService: ApmService) {}

  public async initialiseConsumers(
    listeners: IConsumerListener[],
    options: CodefiConsumersOptions = {},
  ) {
    this.options = options;

    for (const listener of listeners) {
      const consumer = await this.addListener(listener, options);
      this.consumers.push(consumer);
    }
  }

  private addListener = async <T extends IConsumerListener>(
    listener: T,
    options: CodefiConsumersOptions,
  ) => {
    this.logger.info(
      { topic: listener.topic, groupId: listener.groupId },
      `Registering consumer for this topic: ${listener.topic} and this groupId: ${listener.groupId}`,
    );
    const codefiConsumer = new CodefiConsumer(
      listener,
      options.consumerOptions,
      options.listenerRunConfig,
      this.apmService,
    );

    try {
      await codefiConsumer.startConsumer();
      this.logger.info(
        { topic: listener.topic, groupId: listener.groupId },
        `Consumer started for this topic: ${listener.topic} and this groupId: ${listener.groupId}`,
      );
    } catch (error) {
      this.logger.fatal(
        { topic: listener.topic, groupId: listener.groupId, error },
        `Error connecting to consumer for this topic: ${listener.topic} and this groupId: ${listener.groupId}`,
      );
      process.exit(1);
    }

    return codefiConsumer;
  };

  async onApplicationShutdown(): Promise<void> {
    if (this.options.keepListenersAlive) {
      return;
    }

    for (const listener of this.consumers) {
      await listener.stopConsumer();
    }
  }
}
