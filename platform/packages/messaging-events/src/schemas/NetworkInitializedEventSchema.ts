import { RegisterNetworkCommandSchema } from './RegisterNetworkCommandSchema';

const registerNetworkCommandFields: any[] =
  RegisterNetworkCommandSchema.schema.fields;

const networkInitializedEventFields = [
  {
    name: 'id',
    type: 'string',
  },
  {
    name: 'key',
    type: 'string',
  },
  {
    name: 'chainId',
    type: ['int', 'string'],
  },
  {
    name: 'ethRequired',
    type: 'boolean',
  },
  {
    name: 'kaleido',
    type: 'boolean',
  },
  {
    name: 'finalized',
    type: 'boolean',
  },
  {
    name: 'contracts',
    type: [
      {
        type: 'array',
        items: {
          name: 'Contract',
          type: 'record',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'address', type: 'string' },
            { name: 'senderWalletAddress', type: 'string' },
            {
              name: 'status',
              type: {
                type: 'enum',
                name: 'TransactionStatus',
                symbols: ['pending', 'confirmed', 'failed', 'reverted'],
              },
            },
          ],
        },
      },
    ],
  },
];
export class NetworkInitializedEventSchema {
  static schema = {
    type: 'record',
    name: 'networkInitialized',
    namespace: 'net.consensys.codefi.network',
    fields: registerNetworkCommandFields.concat(networkInitializedEventFields),
  };
}
