import { Builder, IBuilder } from 'builder-pattern';
import { TenantDeleteCommandSchema } from '../../schemas/TenantDeleteCommandSchema';
import { AbstractMessage } from '../AbstractMessage';

export class TenantDeleteCommand extends AbstractMessage<ITenantDeleteCommand> {
  public messageName = 'tenant_delete';
  public messageSchema: any = TenantDeleteCommandSchema.schema;
}
export interface ITenantDeleteCommand {
  tenantId: string;
}
export abstract class TenantDeleteCommandBuilder {
  public static get(tenantId: string): IBuilder<ITenantDeleteCommand> {
    const command: ITenantDeleteCommand = {
      tenantId,
    };

    return Builder<ITenantDeleteCommand>(command);
  }
}
