import { AbstractMessage } from '../AbstractMessage';
import { DataSharedCommandSchema } from '../../schemas/DataSharedCommandSchema';
import { Nullable } from '../../types';

export class DataSharedCommand extends AbstractMessage<IDataSharedCommand> {
  protected messageName = 'data_shared_command';
  public messageSchema = DataSharedCommandSchema.schema;
}

export interface IDataSharedCommand {
  id: string;
  data: string;
  privacyGroup: string;
  senderId: Nullable<string>;
  chainName: Nullable<string>;
  tenantId?: string;
  entityId?: string;
}
