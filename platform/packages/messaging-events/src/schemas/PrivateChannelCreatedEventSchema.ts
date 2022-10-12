import BaseMessageSchema from './BaseMessageSchema';

export class PrivateChannelCreatedEventSchema {
  static schema = {
    type: 'record',
    name: 'privateChannelCreated',
    namespace: 'net.consensys.codefi.privatechannel',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'id', type: 'string' },
      { name: 'privacyGroup', type: 'string' },
      { name: 'channelName', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'chainName', type: 'string' },
      { name: 'transactionHash', type: 'string' },
      { name: 'contractAddress', type: 'string' },
      { name: 'blockNumber', type: 'int' },
      {
        name: 'participants',
        type: [
          {
            type: 'array',
            items: 'string',
          },
          'null',
        ],
      },
    ],
  };
}
