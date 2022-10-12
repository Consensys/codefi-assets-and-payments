import { TokenDeployedEventSchema } from '../../schemas/TokenDeployedEventSchema';
import { AbstractMessage } from '../AbstractMessage';

export class TokenDeployedEvent extends AbstractMessage<ITokenDeployedEvent> {
  protected messageName = 'token_deployed';
  public messageSchema: any = TokenDeployedEventSchema.schema;
}

export interface ITokenDeployedEvent {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  deployerAddress: string;
  transactionHash: string;
  chainName: string;
  blockNumber: number;
}
