import { Builder, IBuilder } from 'builder-pattern';
import { EntityDeleteCommandSchema } from '../../schemas/EntityDeleteCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class EntityDeleteCommand extends AbstractMessage<IEntityDeleteCommand> {
  public messageName = 'entity_delete';
  public messageSchema: any = EntityDeleteCommandSchema.schema;
}
export interface IEntityDeleteCommand {
  tenantId: string;
  entityId: string;
}
export abstract class EntityDeleteCommandBuilder {
  public static get(
    tenantId: string,
    entityId: string,
  ): IBuilder<IEntityDeleteCommand> {
    const command: IEntityDeleteCommand = {
      tenantId,
      entityId,
    };

    return Builder<IEntityDeleteCommand>(command);
  }
}
