import BaseMessageSchema from './BaseMessageSchema';

export class ReferenceDataOperationCommandSchema {
  static schema = {
    type: 'record',
    name: 'referenceDataOperationCommand',
    namespace: 'net.consensys.codefi.referencedata',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'id', type: ['string', 'null'] },
      {
        name: 'operation',
        type: {
          name: 'operation_enum',
          type: 'enum',
          symbols: ['CREATE', 'UPDATE', 'DELETE'],
        },
      },
      {
        name: 'publish',
        type: {
          name: 'publish_enum',
          type: 'enum',
          symbols: ['NONE', 'UNSTRUCTURED', 'STRUCTURED'],
        },
      },
      { name: 'publishPrivate', type: ['string', 'null'] },
      { name: 'data', type: ['string', 'null'] },
      { name: 'schemaId', type: ['string', 'null'] },
      { name: 'tenantId', type: ['string', 'null'] },
      { name: 'subject', type: ['string', 'null'] },
    ],
  };
}
