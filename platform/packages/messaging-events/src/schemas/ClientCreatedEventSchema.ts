import BaseMessageSchema from './BaseMessageSchema';

export class ClientCreatedEventSchema {
  static schema = {
    type: 'record',
    name: 'clientCreated',
    namespace: 'net.consensys.codefi.client',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'clientId', type: 'string' },
      { name: 'clientSecret', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'appType', type: 'string' },
      { name: 'tenantId', type: ['null', 'string'], default: null },
      { name: 'entityId', type: ['null', 'string'], default: null },
      { name: 'product', type: ['null', 'string'], default: null },
    ],
  };
}
