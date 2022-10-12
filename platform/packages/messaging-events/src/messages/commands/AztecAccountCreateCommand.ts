import { AztecAccountCreateCommandSchema } from '../../schemas/AztecAccountCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class AztecAccountCreateCommand extends AbstractMessage<IAztecAccountCreateCommand> {
  protected messageName = 'aztec_create_account';
  public messageSchema: any = AztecAccountCreateCommandSchema.schema;
}

export interface IAztecAccountCreateCommand {
  id: string;
}
