import { AbstractMessage } from '../AbstractMessage';
import { UserCreatedEventSchema } from '../../schemas/UserCreatedEventSchema';

/**
 * This event is emitted when an user logs in for the first time
 * in the platform using IAM-api or when an user was invited via e-mail
 */
export class UserCreatedEvent extends AbstractMessage<IUserCreatedEvent> {
  protected messageName = 'user_created';
  public messageSchema: any = UserCreatedEventSchema.schema;
}

export interface IUserCreatedEvent {
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
