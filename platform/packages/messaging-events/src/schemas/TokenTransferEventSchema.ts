import BaseMessageSchema from './BaseMessageSchema';

export class TokenTransferEventSchema {
  static schema = {
    type: 'record',
    name: 'tokenTransfer',
    namespace: 'net.consensys.codefi.token',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'name',
        type: 'string',
      },
      {
        name: 'symbol',
        type: 'string',
      },
      {
        name: 'contractAddress',
        type: 'string',
      },
      {
        name: 'transactionHash',
        type: 'string',
      },
      {
        name: 'blockNumber',
        type: 'int',
      },
      {
        name: 'account',
        type: 'string',
      },
      {
        name: 'from',
        type: 'string',
      },
      {
        name: 'transactionSender',
        type: 'string',
      },
      {
        name: 'amount',
        type: 'string',
      },
      {
        name: 'chainName',
        type: 'string',
      },
    ],
  };
}
