import BaseTokenCommandSchema from './BaseTokenCommandSchema';

export class DeployTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'deployTokenCommand',
    namespace: 'net.consensys.codefi.token.deploy',
    fields: [
      ...BaseTokenCommandSchema.fields,
      {
        name: 'type',
        type: {
          type: 'enum',
          name: 'TokenType',
          symbols: [
            'CodefiERC20',
            'CodefiERC721',
            'UniversalToken',
            'ConfidentialToken',
          ],
        },
      },
      {
        name: 'confidential',
        type: ['boolean', 'null'],
      },
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'symbol',
        type: 'string',
      },
      {
        name: 'decimals',
        type: ['int', 'null'],
      },
      {
        name: 'controllers',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'defaultPartitions',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'extension',
        type: ['string', 'null'],
      },
      {
        name: 'newOwner',
        type: ['string', 'null'],
      },
      {
        name: 'certificateSigner',
        type: ['string', 'null'],
      },
      {
        name: 'certificateActivated',
        type: ['string', 'null'],
      },
    ],
  };
}
