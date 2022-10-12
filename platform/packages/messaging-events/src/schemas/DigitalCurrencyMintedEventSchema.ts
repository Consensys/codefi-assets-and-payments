import BaseMessageSchema from './BaseMessageSchema';

export class DigitalCurrencyMintedEventSchema {
  static schema = {
    type: 'record',
    name: 'digitalCurrencyMintedEvent',
    namespace: 'net.consensys.codefi.confidentialtoken',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'tokenId',
        type: 'string',
      },
      {
        name: 'toAccountId',
        type: 'string',
      },
      {
        name: 'value',
        type: 'int',
      },
    ],
  };
}
