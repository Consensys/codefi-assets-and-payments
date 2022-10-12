import BaseMessageSchema from './BaseMessageSchema';

export class CreateDidCommandSchema {
  static schema = {
    type: 'record',
    name: 'createDidCommand',
    namespace: 'net.consensys.codefi.identityagent',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'alias',
        type: 'string',
      },
      {
        name: 'provider',
        type: ['string', 'null'],
      },
      {
        name: 'kms',
        type: ['string', 'null'],
      },
      {
        name: 'type',
        type: 'string',
      },
    ],
  };
}
