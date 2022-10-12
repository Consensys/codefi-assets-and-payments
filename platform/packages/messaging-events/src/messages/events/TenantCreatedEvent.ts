import { AbstractMessage } from '../AbstractMessage';
import { TenantCreatedEventSchema } from '../../schemas/TenantCreatedEventSchema';

/**
 * This event is emitted when an tenant is created
 * in the platform using IAM-api
 */
export class TenantCreatedEvent extends AbstractMessage<ITenantCreatedEvent> {
  protected messageName = 'tenant_created';
  public messageSchema: any = TenantCreatedEventSchema.schema;
}

export interface ITenantCreatedEvent {
  tenantId: string;
  createdBy: string;
  createdAt: string;
}
