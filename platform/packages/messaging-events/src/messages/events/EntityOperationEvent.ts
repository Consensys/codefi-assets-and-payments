import { EntityOperationEventSchema } from '../../schemas/EntityOperationEventSchema';
import { AbstractMessage } from '../AbstractMessage';
import { MessageDataOperation } from '../MessageOperation';

export class EntityOperationEvent extends AbstractMessage<IEntityOperationEvent> {
  protected messageName = 'entity_operation';
  public messageSchema: any = EntityOperationEventSchema.schema;
}

export interface IEntityOperationEvent {
  operation: MessageDataOperation;
  entityId: string;
  tenantId: string;
  name: string;
  defaultWallet: string;
  metadata: string;
  createdBy: string;
  createdAt: string;
}
