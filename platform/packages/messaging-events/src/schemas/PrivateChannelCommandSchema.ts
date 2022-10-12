import BaseMessageSchema from './BaseMessageSchema';

export class PrivateChannelCommandSchema {
  static schema = {
    type: 'record',
    name: 'privateChannelCommand',
    namespace: 'net.consensys.codefi.privatechannel',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'id',
        type: 'string',
      },
      {
        name: 'createdBy',
        type: 'string',
      },
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'description',
        type: 'string',
      },
      {
        name: 'chainName',
        type: ['string', 'null'],
      },
      {
        name: 'type',
        type: {
          name: 'type_enum',
          type: 'enum',
          symbols: ['QUORUM', 'BESU'],
        },
      },
      {
        name: 'participants',
        type: {
          name: 'participants_array',
          type: 'array',
          items: 'string',
        },
      },
      {
        name: 'tenantId',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'entityId',
        type: ['null', 'string'],
        default: null,
      },
    ],
  };
}
