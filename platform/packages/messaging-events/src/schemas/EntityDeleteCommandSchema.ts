import BaseMessageSchema from './BaseMessageSchema';

export class EntityDeleteCommandSchema {
  static schema = {
    type: 'record',
    name: 'entityDeleteCommand',
    namespace: 'net.consensys.codefi.convergence.entity',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'tenantId',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'entityId',
        type: 'string',
      },
    ],
  };
}
