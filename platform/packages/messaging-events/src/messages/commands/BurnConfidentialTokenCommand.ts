import { AbstractMessage } from '../AbstractMessage';
import { BurnConfidentialTokenCommandSchema } from '../../schemas/BurnConfidentialTokenCommandSchema';

export class BurnConfidentialTokenCommand extends AbstractMessage<IBurnConfidentialTokenCommand> {
  protected messageName = 'burn_condifential_token';
  public messageSchema: any = BurnConfidentialTokenCommandSchema.schema;
}

export interface IBurnConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  value: number;
}
