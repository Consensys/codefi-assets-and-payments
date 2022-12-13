import { NetworkInitializedEventSchema } from '../../schemas/NetworkInitializedEventSchema';
import { AbstractMessage } from '../AbstractMessage';
import { IRegisterNetworkCommand } from '../commands/RegisterNetworkCommand';
import { Contract, NetworkType } from '@consensys/ts-types';

export class NetworkInitializedEvent extends AbstractMessage<INetworkInitializedEvent> {
  protected messageName = 'network_finalized';
  public messageSchema: any = NetworkInitializedEventSchema.schema;
}
export interface INetworkInitializedEvent extends IRegisterNetworkCommand {
  id: string;
  key: string;
  chainId: number | string;
  type?: NetworkType;
  ethRequired: boolean;
  kaleido: boolean;
  finalized: boolean;
  contracts: Contract[];
}
