import { ProductType } from '@consensys/ts-types';
import { TenantOperationEventSchema } from '../../schemas/TenantOperationEventSchema';
import { AbstractMessage } from '../AbstractMessage';
import { MessageDataOperation } from '../MessageOperation';

export class TenantOperationEvent extends AbstractMessage<ITenantOperationEvent> {
  protected messageName = 'tenant_operation';
  public messageSchema: any = TenantOperationEventSchema.schema;
}

export interface ITenantOperationEvent {
  operation: MessageDataOperation;
  tenantId: string;
  name: string;
  products: { [key in ProductType]: boolean };
  defaultNetworkKey: string;
  metadata: string;
  createdBy: string;
  createdAt: string;
}
