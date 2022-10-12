import BaseMessageSchema from './BaseMessageSchema';

export class PrivateDataSharedEventSchema {
  static schema = {
    type: 'record',
    name: 'privateDataShared',
    namespace: 'net.consensys.codefi.privatechannel',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'id', type: 'string' },
      { name: 'data', type: 'string' },
      { name: 'privateChannelId', type: 'string' },
      { name: 'transactionHash', type: 'string' },
      { name: 'blockNumber', type: 'int' },
    ],
  };
}
