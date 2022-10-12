import { ProductType } from '@codefi-assets-and-payments/ts-types';
import { Builder, IBuilder } from 'builder-pattern';
import { TenantUpdateCommandSchema } from '../../schemas/TenantUpdateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';
import { IStoreMapping } from '../StoreMapping';

export class TenantUpdateCommand extends AbstractMessage<ITenantUpdateCommand> {
  public messageName = 'tenant_update';
  public messageSchema: any = TenantUpdateCommandSchema.schema;
}
export interface ITenantUpdateCommand {
  tenantId: string;
  name: string;
  products: { [key in ProductType]: boolean };
  defaultNetworkKey: string;
  metadata: string;
  stores: IStoreMapping[];
}
export abstract class TenantUpdateCommandBuilder {
  public static get(
    tenantId: string,
    name: string,
    products: { [key in ProductType]?: boolean },
    defaultNetworkKey: string,
    metadata: string,
  ): IBuilder<ITenantUpdateCommand> {
    const emptyProducts = Object.keys(ProductType).reduce((acc, curr) => {
      acc[curr] = null;
      return acc;
    }, {}) as { [key in ProductType]: boolean };

    const command: ITenantUpdateCommand = {
      tenantId,
      name,
      products: {
        ...emptyProducts,
        ...products,
      },
      defaultNetworkKey,
      metadata,
      stores: null,
    };

    return Builder<ITenantUpdateCommand>(command);
  }
}
