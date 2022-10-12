import BaseMessageSchema from './BaseMessageSchema';

export class AsyncOperationResultEventSchema {
  static schema = {
    type: 'record',
    name: 'asyncOperationResultEvent',
    namespace: 'net.consensys.codefi',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'operationId',
        type: 'string',
      },
      {
        name: 'result',
        type: 'boolean',
      },
      {
        name: 'transactionHash',
        type: ['string', 'null'],
      },
      {
        name: 'chainName',
        type: ['string', 'null'],
      },
      {
        name: 'error',
        type: ['string', 'null'],
      },
      {
        name: 'receipt',
        type: [
          {
            type: 'record',
            name: 'receipt',
            fields: [
              {
                name: 'contractAddress',
                type: ['string', 'null'],
              },
            ],
          },
          'null',
        ],
      },
    ],
  };
}
