import BaseMessageSchema from './BaseMessageSchema';

export class DidCreatedEventSchema {
  static schema = {
    type: 'record',
    name: 'didCreated',
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
        name: 'did',
        type: 'string',
      },
      {
        name: 'provider',
        type: 'string',
      },
      {
        name: 'type',
        type: 'string',
      },
    ],
  };
}
