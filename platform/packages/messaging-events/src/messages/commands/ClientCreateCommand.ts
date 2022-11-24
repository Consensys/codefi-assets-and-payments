import { ProductsEnum } from '@consensys/ts-types';
import { ClientCreateCommandSchema } from '../../schemas/ClientCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

/**
 * This command will be consumed by admin-api to create clients
 */
export class ClientCreateCommand extends AbstractMessage<IClientCreateCommand> {
  protected messageName = 'client_create';
  public messageSchema: any = ClientCreateCommandSchema.schema;
}

export interface IClientCreateCommand {
  name: string;
  description: string;
  appType: string;
  isEmailOnly?: boolean;
  clientMetadata?: string;
  logoUri?: string;
  callbacks?: Array<string>;
  allowedLogoutUrls?: Array<string>;
  webOrigins?: Array<string>;
  allowedOrigins?: Array<string>;
  grantTypes?: Array<string>;
  jwtConfiguration?: any;
  sso?: boolean;
  initiateLoginUri?: string;
  tenantId?: string;
  entityId?: string;
  product?: ProductsEnum;
}
