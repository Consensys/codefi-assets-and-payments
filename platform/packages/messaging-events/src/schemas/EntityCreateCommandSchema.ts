import AdminSchema from './AdminSchema';
import BaseMessageSchema from './BaseMessageSchema';
import StoreMappingSchema from './StoreMappingSchema';

export class EntityCreateCommandSchema {
  static schema = {
    type: 'record',
    name: 'entityCreateCommand',
    namespace: 'net.consensys.codefi.convergence.entity',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'entityId',
        type: ['null', 'string'],
        default: null,
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
