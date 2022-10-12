import { Builder, IBuilder } from 'builder-pattern';
import { EntityUpdateCommandSchema } from '../../schemas/EntityUpdateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';
import { IStoreMapping } from '../StoreMapping';

export class EntityUpdateCommand extends AbstractMessage<IEntityUpdateCommand> {
  public messageName = 'entity_update';
  public messageSchema: any = EntityUpdateCommandSchema.schema;
}
export interface IEntityUpdateCommand {
  tenantId: string;
  entityId: string;
  name: string;
  metadata: string;
  defaultWallet: string;
  stores: IStoreMapping[];
}
export abstract class EntityUpdateCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
    name: string,
    metadata: string,
    defaultWallet: string,
  ): IBuilder<IEntityUpdateCommand> {
    const command: IEntityUpdateCommand = {
      tenantId,
      entityId,
      name,
      metadata,
      defaultWallet,
      stores: null,
    };

    return Builder<IEntityUpdateCommand>(command);
  }
}
