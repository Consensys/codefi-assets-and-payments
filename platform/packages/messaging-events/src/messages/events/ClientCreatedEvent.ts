import { AbstractMessage } from '../AbstractMessage';
import { ClientCreatedEventSchema } from '../../schemas/ClientCreatedEventSchema';

/**
 * This event is emitted when an client is created
 * in the platform using IAM-api
 */
export class ClientCreatedEvent extends AbstractMessage<IClientCreatedEvent> {
  protected messageName = 'client_created';
  public messageSchema: any = ClientCreatedEventSchema.schema;
}

export interface IClientCreatedEvent {
  clientId: string;
  clientSecret: string;
  name: string;
  appType: string;
  tenantId?: string | null;
  entityId?: string | null;
  product?: string | null;
}
