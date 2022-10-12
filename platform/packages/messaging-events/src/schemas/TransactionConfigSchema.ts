import BaseMessageSchema from './BaseMessageSchema';

export default {
  schema: {
    type: 'record',
    name: 'txConfig',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'from',
        type: ['string', 'null'],
      },
      {
        name: 'chainName',
        type: ['string', 'null'],
      },
      {
        name: 'nonce',
        type: ['string', 'null'],
      },
      {
        name: 'to',
        type: ['string', 'null'],
      },
      {
        name: 'gas',
        type: ['string', 'null'],
      },
      {
        name: 'value',
        type: ['string', 'null'],
      },
      {
        name: 'contractTag',
        type: ['string', 'null'],
      },
      {
        name: 'privateFrom',
        type: ['string', 'null'],
      },
      {
        name: 'privateFor',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'privacyGroupId',
        type: ['string', 'null'],
      },
      {
        name: 'protocol',
        type: [
          {
            type: 'enum',
            name: 'ProtocolType',
            symbols: [
              'EthereumConstantinople',
              'QuorumConstellation',
              'Tessera',
              'Orion',
            ],
          },
          'null',
        ],
      },
      {
        name: 'transactionType',
        type: [
          {
            type: 'enum',
            name: 'TransactionType',
            symbols: ['SendTransaction', 'RawTransaction'],
          },
          'null',
        ],
      },
    ],
  },
};
