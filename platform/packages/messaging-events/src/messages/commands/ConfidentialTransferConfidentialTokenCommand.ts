import { ConfidentialTransferConfidentialTokenCommandSchema } from '../../schemas/ConfidentialTransferConfidentialTokenCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class ConfidentialTransferConfidentialTokenCommand extends AbstractMessage<IConfidentialTransferConfidentialTokenCommand> {
  protected messageName = 'confidential_transfer_condifential_token';
  public messageSchema: any =
    ConfidentialTransferConfidentialTokenCommandSchema.schema;
}

export interface IConfidentialTransferConfidentialTokenCommand {
  operationId: string;
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  value: number;
}
