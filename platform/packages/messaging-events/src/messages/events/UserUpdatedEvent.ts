import { AbstractMessage } from '../AbstractMessage';
import { UserUpdatedEventSchema } from '../../schemas/UserUpdatedEventSchema';

/**
 * This event is emitted when an user logs in for the first time
 * in the platform using IAM-api or when an user was invited via e-mail
 */
export class UserUpdatedEvent extends AbstractMessage<IUserUpdatedEvent> {
  protected messageName = 'user_updated';
  public messageSchema: any = UserUpdatedEventSchema.schema;
}

export interface IUserUpdatedEvent {
  userId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
  appMetadata: string;
  userMetadata: string;
  tenantId?: string | null;
  entityId?: string | null;
  product?: string | null;
}
