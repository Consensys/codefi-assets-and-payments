import BaseMessageSchema from './BaseMessageSchema';

export class ReferenceDataOperationEventSchema {
  static schema = {
    type: 'record',
    name: 'referenceDataOperation',
    namespace: 'net.consensys.codefi.referencedata',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'id', type: 'string' },
      {
        name: 'operation',
        type: {
          name: 'operation_enum',
          type: 'enum',
          symbols: ['CREATE', 'UPDATE', 'DELETE'],
        },
      },
      { name: 'data', type: ['string', 'null'] },
      { name: 'schemaId', type: ['string', 'null'] },
    ],
  };
}
