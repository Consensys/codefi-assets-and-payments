import { AbstractMessage } from '../AbstractMessage';
import { RegisterNetworkCommandSchema } from '../../schemas/RegisterNetworkCommandSchema';
import { Metadata, Products, NetworkType } from '@consensys/ts-types';

export class RegisterNetworkCommand extends AbstractMessage<IRegisterNetworkCommand> {
  protected messageName = 'register_network_command';
  public messageSchema: any = RegisterNetworkCommandSchema.schema;
}

export interface IRegisterNetworkCommand {
  tenantId: string;
  name: string;
  description: string;
  explorerUrl?: string;
  symbol?: string;
  metadata?: Metadata[];
  rpcEndpoints: string[];
  products: Products;
  type?: NetworkType;
}
