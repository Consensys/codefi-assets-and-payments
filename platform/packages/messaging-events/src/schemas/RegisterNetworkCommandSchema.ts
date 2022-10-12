import BaseMessageSchema from './BaseMessageSchema';

export class RegisterNetworkCommandSchema {
  static schema = {
    type: 'record',
    name: 'registerNetworkCommand',
    namespace: 'net.consensys.codefi.network.register',
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
        name: 'explorerUrl',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'symbol',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'description',
        type: 'string',
      },
      {
        name: 'rpcEndpoints',
        type: {
          type: 'array',
          items: 'string',
        },
      },
      {
        name: 'metadata',
        type: [
          {
            type: 'array',
            items: {
              name: 'Metadata',
              type: 'record',
              fields: [
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
              ],
            },
          },
          'null',
        ],
      },
      {
        name: 'products',
        type: [
          {
            type: 'record',
            name: 'Products',
            fields: [
              { name: 'assets', type: ['boolean', 'null'], default: false },
              { name: 'payments', type: ['boolean', 'null'], default: false },
              { name: 'compliance', type: ['boolean', 'null'], default: false },
            ],
          },
        ],
      },
      {
        name: 'type',
        type: [
          {
            name: 'NetworkType',
            type: 'enum',
            symbols: ['poa', 'pow'],
          },
          'null',
        ],
      },
    ],
  };
}
