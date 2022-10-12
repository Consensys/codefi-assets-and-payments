import { ExecuteHoldConfidentialTokenCommandSchema } from '../../schemas/ExecuteHoldConfidentialTokenCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class ExecuteHoldConfidentialTokenCommand extends AbstractMessage<IExecuteHoldConfidentialTokenCommand> {
  protected messageName = 'execute_hold_condifential_token';
  public messageSchema: any = ExecuteHoldConfidentialTokenCommandSchema.schema;
}

export interface IExecuteHoldConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  holdId: string;
  lockHashPreImage: string;
  from: string | null;
}
