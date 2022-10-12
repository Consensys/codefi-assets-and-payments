import { ProductType } from '@codefi-assets-and-payments/ts-types';
import { Builder, IBuilder } from 'builder-pattern';
import { TenantCreateCommandSchema } from '../../schemas/TenantCreateCommandSchema';
import { AbstractMessage } from '../AbstractMessage';
import { IAdmin } from '../Admin';
import { IEntityWallet } from '../EntityWallet';
import { IStoreMapping } from '../StoreMapping';

export class TenantCreateCommand extends AbstractMessage<ITenantCreateCommand> {
  public messageName = 'tenant_create';
  public messageSchema: any = TenantCreateCommandSchema.schema;
}

export interface ITenantEntity {
  entityId: string;
  name: string;
  metadata: string;
  initialAdmins: IAdmin[];
  initialWallets: IEntityWallet[];
  defaultWallet: string;
}

export interface ITenantCreateCommand {
  tenantId: string;
  name: string;
  products: { [key in ProductType]: boolean };
  defaultNetworkKey: string;
  metadata: string;
  initialAdmins: IAdmin[];
  initialEntities: ITenantEntity[];
  createdBy: string;
  stores: IStoreMapping[];
}

export abstract class TenantCreateCommandBuilder {
  public static get(
    tenantId: string,
    name: string,
    products: { [key in ProductType]?: boolean },
    defaultNetworkKey: string,
  ): IBuilder<ITenantCreateCommand> {
    const emptyProducts = Object.keys(ProductType).reduce((acc, curr) => {
      acc[curr] = null;
      return acc;
    }, {}) as { [key in ProductType]: boolean };

    const command: ITenantCreateCommand = {
      tenantId,
      name,
      products: {
        ...emptyProducts,
        ...products,
      },
      defaultNetworkKey,
      metadata: null,
      initialAdmins: null,
      initialEntities: null,
      createdBy: null,
      stores: null,
    };

    return Builder<ITenantCreateCommand>(command);
  }
}
