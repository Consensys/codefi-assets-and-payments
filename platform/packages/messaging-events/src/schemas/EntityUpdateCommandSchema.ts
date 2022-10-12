import BaseMessageSchema from './BaseMessageSchema';
import StoreMappingSchema from './StoreMappingSchema';

export class EntityUpdateCommandSchema {
  static schema = {
    type: 'record',
    name: 'entityUpdateCommand',
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
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'metadata',
        type: 'string',
      },
      {
        name: 'defaultWallet',
        type: 'string',
      },
      {
        name: 'stores',
        type: [
          'null',
          {
            type: 'array',
            items: {
              ...StoreMappingSchema.schema,
            },
          },
        ],
        default: null,
      },
    ],
  };
}
