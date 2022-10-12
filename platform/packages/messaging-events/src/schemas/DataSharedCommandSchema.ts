import BaseMessageSchema from './BaseMessageSchema';

export class DataSharedCommandSchema {
  static schema = {
    type: 'record',
    name: 'dataSharedCommand',
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
        name: 'data',
        type: 'string',
      },
      {
        name: 'privacyGroup',
        type: 'string',
      },
      {
        name: 'senderId',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'chainName',
        type: ['null', 'string'],
        default: null,
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
