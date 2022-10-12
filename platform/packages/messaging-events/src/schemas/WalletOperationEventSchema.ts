import BaseMessageSchema from './BaseMessageSchema';

export class WalletOperationEventSchema {
  static schema = {
    type: 'record',
    name: 'walletOperation',
    namespace: 'net.consensys.codefi.convergence.wallet',
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
        name: 'entityId',
        type: 'string',
      },
      {
        name: 'address',
        type: 'string',
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
        name: 'storeId',
        type: ['null', 'string'],
        default: null,
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
