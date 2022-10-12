import BaseMessageSchema from './BaseMessageSchema';

export class DataOracleCommandSchema {
  static schema = {
    type: 'record',
    name: 'dataOracleCommand',
    namespace: 'net.consensys.codefi.dataoracle',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'data',
        type: ['string', 'null'],
      },
      {
        name: 'structured',
        type: ['boolean', 'null'],
      },
      {
        name: 'id',
        type: 'string',
      },
      {
        name: 'operation',
        type: {
          name: 'operation_enum',
          type: 'enum',
          symbols: ['CREATE', 'UPDATE', 'DELETE'],
        },
      },
      {
        name: 'tenantId',
        type: ['string', 'null'],
      },
      {
        name: 'subject',
        type: ['string', 'null'],
      },
      {
        name: 'valueMetadata',
        type: ['string', 'null'],
      },
    ],
  };
}
