import BaseMessageSchema from './BaseMessageSchema';

export class TenantCreatedEventSchema {
  static schema = {
    type: 'record',
    name: 'TenantCreated',
    namespace: 'net.consensys.codefi.tenant',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'tenantId', type: 'string' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdAt', type: 'string' },
    ],
  };
}
