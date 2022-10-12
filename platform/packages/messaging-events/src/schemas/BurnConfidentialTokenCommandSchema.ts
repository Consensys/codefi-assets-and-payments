import BaseMessageSchema from './BaseMessageSchema';

export class BurnConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'burnConfidentialTokenCommand',
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
        name: 'value',
        type: 'int',
      },
    ],
  };
}
