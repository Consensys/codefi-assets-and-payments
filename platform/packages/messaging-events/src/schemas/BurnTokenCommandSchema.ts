import BaseTokenCommandSchema from './BaseTokenCommandSchema';

export class BurnTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'burnTokenCommand',
    namespace: 'net.consensys.codefi.token.burn',
    fields: [
      ...BaseTokenCommandSchema.fields,
      {
        name: 'type',
        type: {
          type: 'enum',
          name: 'TokenType',
          symbols: ['CodefiERC20', 'CodefiERC721', 'Universal', 'Confidential'],
        },
      },
      {
        name: 'amount',
        type: ['string', 'null'],
      },
      {
        name: 'partition',
        type: ['string', 'null'],
      },
      {
        name: 'tokenId',
        type: ['string', 'null'],
      },
      {
        name: 'account',
        type: ['string', 'null'],
      },
    ],
  };
}
