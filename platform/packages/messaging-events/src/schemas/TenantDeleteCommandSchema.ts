import BaseMessageSchema from './BaseMessageSchema';

export class TenantDeleteCommandSchema {
  static schema = {
    type: 'record',
    name: 'tenantDeleteCommand',
    namespace: 'net.consensys.codefi.convergence.tenant',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'tenantId',
        type: 'string',
      },
    ],
  };
}
