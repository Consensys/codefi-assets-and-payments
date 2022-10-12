import BaseMessageSchema from './BaseMessageSchema';

export class DataAttestedEventSchema {
  static schema = {
    type: 'record',
    name: 'dataAttested',
    namespace: 'net.consensys.codefi.dataAttested',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      { name: 'dataId', type: 'string' },
      {
        name: 'dataMerkleProof',
        type: {
          type: 'array',
          items: 'string',
        },
      },
      { name: 'merkleRootHash', type: 'string' },
      { name: 'date', type: 'string' },
    ],
  };
}
