import { AbstractMessage } from '../AbstractMessage';
import { ReferenceDataOperationCommandSchema } from '../../schemas/ReferenceDataOperationCommandSchema';
import { MessageDataOperation } from '../..';

/**
 * this command will perform an operation on reference-data-api
 * `operation` is always mandatory
 * `id` is mandatory if the operation is `DELETE` or `UPDATE`
 * `schemaId` and `data` are mandatory if the operation was `CREATE` or `UPDATE`
 */
export class ReferenceDataOperationCommand extends AbstractMessage<IReferenceDataOperationCommand> {
  protected messageName = 'reference_data_command';
  public messageSchema: any = ReferenceDataOperationCommandSchema.schema;
}

export enum PublishType {
  NONE = 'NONE',
  UNSTRUCTURED = 'UNSTRUCTURED',
  STRUCTURED = 'STRUCTURED',
}

export interface IReferenceDataOperationCommand {
  id?: string;
  operation: MessageDataOperation;
  schemaId?: string;
  publish: PublishType;
  publishPrivate?: string;
  data?: any;
  tenantId: string;
  subject?: string;
}
