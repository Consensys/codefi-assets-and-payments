import { Builder, IBuilder } from 'builder-pattern';
import { WalletDeleteCommandSchema } from '../../schemas/WalletDeleteCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class WalletDeleteCommand extends AbstractMessage<IWalletDeleteCommand> {
  public messageName = 'wallet_delete';
  public messageSchema: any = WalletDeleteCommandSchema.schema;
}
export interface IWalletDeleteCommand {
  tenantId: string;
  entityId: string;
  address: string;
}
export abstract class WalletDeleteCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
    address: string,
  ): IBuilder<IWalletDeleteCommand> {
    const command: IWalletDeleteCommand = {
      tenantId,
      entityId,
      address,
    };

    return Builder<IWalletDeleteCommand>(command);
  }
}
