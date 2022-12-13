import { ProductType } from '@consensys/ts-types';
import BaseMessageSchema from './BaseMessageSchema';

export class TenantOperationEventSchema {
  static schema = {
    type: 'record',
    name: 'tenantOperation',
    namespace: 'net.consensys.codefi.convergence.tenant',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'operation',
        type: {
          name: 'operationEnum',
          type: 'enum',
          symbols: ['CREATE', 'UPDATE', 'DELETE'],
        },
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
        name: 'createdBy',
        type: 'string',
      },
      {
        name: 'createdAt',
        type: 'string',
      },
    ],
  };
}
