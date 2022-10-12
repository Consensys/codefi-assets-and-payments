import { AbstractMessage } from '../AbstractMessage';
import { CreateDidCommandSchema } from '../../schemas/CreateDidCommandSchema';
import { Nullable } from '../../types';

/**
 * This command will be consumed by codefi-identity-agent
 *
 */
export class CreateDidCommand extends AbstractMessage<ICreateDidCommand> {
  protected messageName = 'create_did_command';
  public messageSchema: any = CreateDidCommandSchema.schema;
}

export interface ICreateDidCommand {
  alias: string;
  provider: Nullable<string>;
  kms: Nullable<string>;
  type: 'client' | 'user';
}
