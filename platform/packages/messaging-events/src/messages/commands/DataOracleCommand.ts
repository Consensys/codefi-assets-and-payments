import { AbstractMessage } from '../AbstractMessage';
import { DataOracleCommandSchema } from '../../schemas/DataOracleCommandSchema';
import { MessageDataOperation } from '../MessageOperation';

/**
 * This command will be consumed by data-oracle-api
 *
 */
export class DataOracleCommand extends AbstractMessage<IDataOracleCommand> {
  protected messageName = 'data_oracle_command';
  public messageSchema: any = DataOracleCommandSchema.schema;
}

export interface IDataOracleCommand {
  id: string;
  operation: MessageDataOperation;
  structured: boolean | null;
  data: string | null;
  tenantId: string | null;
  subject: string | null;
  valueMetadata: string | null;
}
