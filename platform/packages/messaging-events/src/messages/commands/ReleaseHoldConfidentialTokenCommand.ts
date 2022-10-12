import { ReleaseHoldConfidentialTokenCommandSchema } from '../../schemas/ReleaseHoldConfidentialTokenCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class ReleaseHoldConfidentialTokenCommand extends AbstractMessage<IReleaseHoldConfidentialTokenCommand> {
  protected messageName = 'release_hold_condifential_token';
  public messageSchema: any = ReleaseHoldConfidentialTokenCommandSchema.schema;
}
export interface IReleaseHoldConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  holdId: string;
  from: string | null;
}
