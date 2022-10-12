import { Builder, IBuilder } from 'builder-pattern';
import { EntityCreateCommandSchema } from '../../schemas/EntityCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';
import { IAdmin } from '../Admin';
import { IEntityWallet } from '../EntityWallet';
import { IStoreMapping } from '../StoreMapping';

export class EntityCreateCommand extends AbstractMessage<IEntityCreateCommand> {
  public messageName = 'entity_create';
  public messageSchema: any = EntityCreateCommandSchema.schema;
}
export interface IEntityCreateCommand {
  entityId: string;
  tenantId: string;
  name: string;
  metadata: string;
  initialAdmins: IAdmin[];
  initialWallets: IEntityWallet[];
  defaultWallet: string;
  createdBy: string;
  stores: IStoreMapping[];
}
export abstract class EntityCreateCommandBuilder {
  public static get(
    tenantId: string,
    name: string,
  ): IBuilder<IEntityCreateCommand> {
    const command: IEntityCreateCommand = {
      entityId: null,
      tenantId,
      name,
      metadata: null,
      initialAdmins: null,
      initialWallets: null,
      defaultWallet: null,
      createdBy: null,
      stores: null,
    };

    return Builder<IEntityCreateCommand>(command);
  }
}
