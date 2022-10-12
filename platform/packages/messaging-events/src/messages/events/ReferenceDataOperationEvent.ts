import { AbstractMessage } from '../AbstractMessage';
import { ReferenceDataOperationEventSchema } from '../../schemas/ReferenceDataOperationEventSchema';
import { MessageDataOperation } from '../MessageOperation';

/**
 * this event is emitted from reference-data-api every time an operation
 * is performed over a reference data record in the DB
 * `id` and `operation` are mandatory fields
 * `schemaId` and `data` are mandatory if the operation was `CREATE` or `UPDATE`
 */
export class ReferenceDataOperationEvent extends AbstractMessage<IReferenceDataOperationEvent> {
  protected messageName = 'reference_data_operation';
  public messageSchema: any = ReferenceDataOperationEventSchema.schema;
}

export interface IReferenceDataOperationEvent {
  id: string;
  operation: MessageDataOperation;
  schemaId?: string;
  data?: any;
}
