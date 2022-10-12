import { UserCreateCommandSchema } from '../../schemas/UserCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

/**
 * This command will be consumed by admin-api
 * to create users
 */
export class UserCreateCommand extends AbstractMessage<IUserCreateCommand> {
  protected messageName = 'user_create';
  public messageSchema: any = UserCreateCommandSchema.schema;
}

export interface IUserCreateCommand {
  email: string;
  name: string;
  appMetadata: string;
  applicationClientId: string | null;
  connection?: string | null;
  password?: string | null;
  emailVerified?: boolean | null;
  roles?: string[] | null;
  tenantId?: string | null;
  entityId?: string | null;
  product?: string | null;
}
