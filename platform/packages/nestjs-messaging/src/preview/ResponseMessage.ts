//https://github.com/ConsenSys/orchestrate-node/blob/b73f9644efe0a1c5b4a43118ac59bef5ccd1f28a/src/kafka/consumer/ResponseMessage.ts

import { IResponse } from './types';

import { Consumer } from './Consumer';

/**
 * Class representing a response message from Orchestrate
 */
export class ResponseMessage {
  constructor(
    private readonly consumer: Consumer,
    private readonly message: IResponse,
    public readonly heartbeat: () => Promise<void>,
  ) {}

  /**
   * Commits the message offset
   */
  public async commit(): Promise<void> {
    await this.consumer.commit(this.message);
  }

  /**
   * Gets the message
   */
  public content(): IResponse {
    return this.message;
  }
}
