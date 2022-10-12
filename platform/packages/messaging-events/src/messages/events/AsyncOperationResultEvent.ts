import { AbstractMessage } from '../AbstractMessage';
import { AsyncOperationResultEventSchema } from '../../schemas/AsyncOperationResultEventSchema';

export class AsyncOperationResultEvent extends AbstractMessage<IAsyncOperationResultEvent> {
  protected messageName = 'async_operation_result';
  public messageSchema: any = AsyncOperationResultEventSchema.schema;
}

export interface IAsyncOperationResultEvent {
  operationId: string;
  result: boolean;
  transactionHash: string | null;
  receipt: IReceipt | null;
  chainName: string | null;
  error: string | null;
}

export interface IReceipt {
  contractAddress: string | null;
}
