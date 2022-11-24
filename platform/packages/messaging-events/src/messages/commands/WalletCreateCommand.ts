import { WalletType } from '@consensys/ts-types';
import { Builder, IBuilder } from 'builder-pattern';
import { WalletCreateCommandSchema } from '../../schemas/WalletCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class WalletCreateCommand extends AbstractMessage<IWalletCreateCommand> {
  public messageName = 'wallet_create';
  public messageSchema: any = WalletCreateCommandSchema.schema;
}
export interface IWalletCreateCommand {
  tenantId: string;
  entityId: string;
  address: string;
  type: WalletType;
  metadata: string;
  setAsDefault: boolean;
  createdBy: string;
}
export abstract class WalletCreateCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
    type: WalletType,
  ): IBuilder<IWalletCreateCommand> {
    const command: IWalletCreateCommand = {
      tenantId,
      entityId,
      address: null,
      type,
      metadata: null,
      setAsDefault: false,
      createdBy: null,
    };

    return Builder<IWalletCreateCommand>(command);
  }
}
