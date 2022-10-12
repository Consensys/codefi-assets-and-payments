import BaseMessageSchema from './BaseMessageSchema';

export class HoldConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'holdConfidentialTokenCommand',
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
      {
        name: 'expirationDate',
        type: 'int',
      },
      {
        name: 'lockHash',
        type: 'string',
      },
      {
        name: 'notaryAddress',
        type: ['null', 'string'],
        default: null,
      },
    ],
  };
}
