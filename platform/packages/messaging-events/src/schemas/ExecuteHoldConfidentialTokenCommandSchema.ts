import BaseMessageSchema from './BaseMessageSchema';

export class ExecuteHoldConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'executeHoldConfidentialTokenCommand',
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
        name: 'holdId',
        type: 'string',
      },
      {
        name: 'lockHashPreImage',
        type: 'string',
      },
      {
        name: 'from',
        type: ['null', 'string'],
        default: null,
      },
    ],
  };
}
