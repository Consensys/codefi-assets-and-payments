import BaseMessageSchema from './BaseMessageSchema';

export class ConfidentialTransferConfidentialTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'confidentialTransferConfidentialTokenCommand',
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
