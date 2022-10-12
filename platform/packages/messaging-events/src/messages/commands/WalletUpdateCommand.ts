import { Builder, IBuilder } from 'builder-pattern';
import { WalletUpdateCommandSchema } from '../../schemas/WalletUpdateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class WalletUpdateCommand extends AbstractMessage<IWalletUpdateCommand> {
  public messageName = 'wallet_update';
  public messageSchema: any = WalletUpdateCommandSchema.schema;
}
export interface IWalletUpdateCommand {
  tenantId: string;
  entityId: string;
  address: string;
  metadata: string;
  setAsDefault: boolean;
}
export abstract class WalletUpdateCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
    address: string,
    metadata: string,
  ): IBuilder<IWalletUpdateCommand> {
    const command: IWalletUpdateCommand = {
      tenantId,
      entityId,
      address,
      metadata,
      setAsDefault: false,
    };

    return Builder<IWalletUpdateCommand>(command);
  }
}
