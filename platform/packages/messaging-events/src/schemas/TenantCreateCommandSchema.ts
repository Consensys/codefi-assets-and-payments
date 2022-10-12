import { ProductType } from '@codefi-assets-and-payments/ts-types';
import AdminSchema from './AdminSchema';
import BaseMessageSchema from './BaseMessageSchema';
import StoreMappingSchema from './StoreMappingSchema';

export class TenantCreateCommandSchema {
  static schema = {
    type: 'record',
    name: 'tenantCreateCommand',
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
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'initialAdmins',
        type: [
          'null',
          {
            type: 'array',
            items: {
              ...AdminSchema.schema,
            },
          },
        ],
        default: null,
      },
      {
        name: 'initialEntities',
        type: [
          'null',
          {
            type: 'array',
            items: {
              type: 'record',
              name: 'tenantEntity',
              fields: [
                {
                  name: 'entityId',
                  type: ['null', 'string'],
                  default: null,
                },
                {
                  name: 'name',
                  type: 'string',
                },
                {
                  name: 'metadata',
                  type: ['null', 'string'],
                  default: null,
                },
                {
                  name: 'initialAdmins',
                  type: [
                    'null',
                    {
                      type: 'array',
                      items: {
                        ...AdminSchema.schema,
                        name: 'entityAdmin',
                      },
                    },
                  ],
                  default: null,
                },
                {
                  name: 'initialWallets',
                  type: [
                    'null',
                    {
                      type: 'array',
                      items: {
                        name: 'entityWallet',
                        type: 'record',
                        fields: [
                          {
                            name: 'address',
                            type: ['null', 'string'],
                            default: null,
                          },
                          {
                            name: 'type',
                            type: {
                              type: 'enum',
                              name: 'WalletType',
                              symbols: [
                                'orchestrate',
                                'external',
                                'INTERNAL_CODEFI_HASHICORP_VAULT',
                                'INTERNAL_CODEFI_AZURE_VAULT',
                                'INTERNAL_CODEFI_AWS_VAULT',
                                'INTERNAL_CLIENT_AZURE_VAULT',
                                'INTERNAL_CLIENT_AWS_VAULT',
                                'EXTERNAL_CLIENT_METAMASK',
                                'EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL',
                                'EXTERNAL_OTHER',
                              ],
                            },
                          },
                          {
                            name: 'metadata',
                            type: ['null', 'string'],
                            default: null,
                          },
                        ],
                      },
                    },
                  ],
                  default: null,
                },
                {
                  name: 'defaultWallet',
                  type: ['null', 'string'],
                  default: null,
                },
              ],
            },
          },
        ],
        default: null,
      },
      {
        name: 'createdBy',
        type: ['null', 'string'],
        default: null,
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
