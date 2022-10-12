import BaseMessageSchema from './BaseMessageSchema';

export class UserCreateCommandSchema {
  static schema = {
    type: 'record',
    name: 'userCreate',
    namespace: 'net.consensys.codefi.userCreateCommand',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'email', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'appMetadata', type: 'string' },
      { name: 'applicationClientId', type: ['null', 'string'] },
      { name: 'connection', type: ['null', 'string'] },
      { name: 'password', type: ['null', 'string'] },
      { name: 'emailVerified', type: ['null', 'boolean'] },
      {
        name: 'roles',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      { name: 'tenantId', type: ['null', 'string'], default: null },
      { name: 'entityId', type: ['null', 'string'], default: null },
      { name: 'product', type: ['null', 'string'], default: null },
    ],
  };
}
