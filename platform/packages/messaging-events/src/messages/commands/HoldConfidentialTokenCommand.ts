import { HoldConfidentialTokenCommandSchema } from '../../schemas/HoldConfidentialTokenCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class HoldConfidentialTokenCommand extends AbstractMessage<IHoldConfidentialTokenCommand> {
  protected messageName = 'hold_condifential_token';
  public messageSchema: any = HoldConfidentialTokenCommandSchema.schema;
}

export interface IHoldConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  value: number;
  expirationDate: number;
  lockHash: string;
  notaryAddress: string | null;
}
