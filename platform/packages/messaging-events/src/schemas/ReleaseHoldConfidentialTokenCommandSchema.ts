import BaseMessageSchema from './BaseMessageSchema';

export class ReleaseHoldConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'releaseHoldConfidentialTokenCommand',
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
        name: 'from',
        type: ['null', 'string'],
        default: null,
      },
    ],
  };
}
