import BaseTokenCommandSchema from './BaseTokenCommandSchema';

export class SetTokenURICommandSchema {
  static schema = {
    type: 'record',
    name: 'setTokenURICommand',
    namespace: 'net.consensys.codefi.token.seturi',
    fields: [
      ...BaseTokenCommandSchema.fields,
      {
        name: 'tokenId',
        type: ['string', 'null'],
      },
      {
        name: 'uri',
        type: 'string',
      },
    ],
  };
}
