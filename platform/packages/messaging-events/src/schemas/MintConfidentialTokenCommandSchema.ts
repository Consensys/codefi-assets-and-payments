import BaseMessageSchema from './BaseMessageSchema';

export class MintConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'mintConfidentialTokenCommand',
    namespace: 'net.consensys.codefi.confidentialtoken',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'operationId',
        type: 'string',
      },
      {
        name: 'tokenId',
        type: 'string',
      },
      {
        name: 'fromAccountId',
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
