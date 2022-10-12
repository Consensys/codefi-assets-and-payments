import BaseMessageSchema from './BaseMessageSchema';

export class EntityOperationEventSchema {
  static schema = {
    type: 'record',
    name: 'entityOperation',
    namespace: 'net.consensys.codefi.convergence.entity',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'operation',
        type: {
          name: 'operationEnum',
          type: 'enum',
          symbols: ['CREATE', 'UPDATE', 'DELETE'],
        },
      },
      {
        name: 'entityId',
        type: 'string',
      },
      {
        name: 'tenantId',
        type: 'string',
      },
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'defaultWallet',
        type: 'string',
      },
      {
        name: 'metadata',
        type: 'string',
      },
      {
        name: 'createdBy',
        type: 'string',
      },
      {
        name: 'createdAt',
        type: 'string',
      },
    ],
  };
}
