import { ProductType } from '@codefi-assets-and-payments/ts-types';
import BaseMessageSchema from './BaseMessageSchema';
import StoreMappingSchema from './StoreMappingSchema';

export class TenantUpdateCommandSchema {
  static schema = {
    type: 'record',
    name: 'tenantUpdateCommand',
    namespace: 'net.consensys.codefi.convergence.tenant',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'tenantId',
        type: 'string',
      },
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'products',
        type: {
          name: 'productTypes',
          type: 'record',
          fields: Object.keys(ProductType).map((product) => ({
            name: product,
            type: ['null', 'boolean'],
            default: null,
          })),
        },
      },
      {
        name: 'defaultNetworkKey',
        type: 'string',
      },
      {
        name: 'metadata',
        type: 'string',
      },
      {
        name: 'stores',
        type: [
          'null',
          {
            type: 'array',
            items: {
              ...StoreMappingSchema.schema,
            },
          },
        ],
        default: null,
      },
    ],
  };
}
