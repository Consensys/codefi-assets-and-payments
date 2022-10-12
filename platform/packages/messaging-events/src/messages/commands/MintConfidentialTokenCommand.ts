import { AbstractMessage } from '../AbstractMessage';
import { MintConfidentialTokenCommandSchema } from '../../schemas/MintConfidentialTokenCommandSchema';

export class MintConfidentialTokenCommand extends AbstractMessage<IMintConfidentialTokenCommand> {
  protected messageName = 'mint_condifential_token';
  public messageSchema: any = MintConfidentialTokenCommandSchema.schema;
}

export interface IMintConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  value: number;
}
