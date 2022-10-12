import { TokenTransferEventSchema } from '../../schemas/TokenTransferEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class TokenTransferEvent extends AbstractMessage<ITokenTransferEvent> {
  protected messageName = 'token_transfer';
  public messageSchema: any = TokenTransferEventSchema.schema;
}

export interface ITokenTransferEvent {
  name: string;
  symbol: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  transactionSender: string;
  from: string;
  account: string;
  amount: string;
  chainName: string;
}
