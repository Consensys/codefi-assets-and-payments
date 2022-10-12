import BaseMessageSchema from './BaseMessageSchema';

export class AttestDataCommandSchema {
  static schema = {
    type: 'record',
    name: 'attestDataCommand',
    namespace: 'net.consensys.codefi.attestationdata',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'data',
        type: 'string',
      },
      {
        name: 'id',
        type: 'string',
      },
      {
        name: 'tenantId',
        type: ['string', 'null'],
      },
      {
        name: 'createdBy',
        type: ['string', 'null'],
      },
    ],
  };
}
