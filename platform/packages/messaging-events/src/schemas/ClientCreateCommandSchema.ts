import BaseMessageSchema from './BaseMessageSchema';

export class ClientCreateCommandSchema {
  static schema = {
    type: 'record',
    name: 'clientCreate',
    namespace: 'net.consensys.codefi.clientCreateCommand',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'appType', type: 'string' },
      { name: 'isEmailOnly', type: ['null', 'boolean'] },
      { name: 'clientMetadata', type: ['null', 'string'] },
      { name: 'logoUri', type: ['null', 'string'] },
      {
        name: 'callbacks',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'allowedLogoutUrls',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'webOrigins',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'allowedOrigins',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'grantTypes',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      {
        name: 'jwtConfiguration',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
      { name: 'sso', type: ['null', 'boolean'] },
      { name: 'initiateLoginUri', type: ['null', 'string'] },
      { name: 'tenantId', type: ['null', 'string'] },
      { name: 'entityId', type: ['null', 'string'] },
      {
        name: 'product',
        type: {
          type: 'enum',
          name: 'ClientProduct',
          symbols: ['assets', 'payments', 'compliance', 'staking'],
        },
      },
    ],
  };
}
