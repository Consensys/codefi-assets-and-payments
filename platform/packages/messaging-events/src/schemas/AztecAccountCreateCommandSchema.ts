import BaseMessageSchema from './BaseMessageSchema';

export class AztecAccountCreateCommandSchema {
  static schema = {
    type: 'record',
    name: 'AztecAccountCreateCommand',
    namespace: 'net.consensys.codefi.confidentialToken',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'id', type: 'string' },
    ],
  };
}
