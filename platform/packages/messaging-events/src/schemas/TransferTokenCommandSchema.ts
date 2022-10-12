import BaseTokenCommandSchema from './BaseTokenCommandSchema';

export class TransferTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'transferTokenCommand',
    namespace: 'net.consensys.codefi.token.transfer',
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
        name: 'recipient',
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
        name: 'from',
        type: ['string', 'null'],
      },
    ],
  };
}
