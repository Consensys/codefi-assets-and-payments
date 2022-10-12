import BaseMessageSchema from './BaseMessageSchema';

export class TokenDeployedEventSchema {
  static schema = {
    type: 'record',
    name: 'tokenDeployed',
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
        name: 'decimals',
        type: ['int', 'null'],
      },
      {
        name: 'contractAddress',
        type: 'string',
      },
      {
        name: 'deployerAddress',
        type: 'string',
      },
      {
        name: 'chainName',
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
    ],
  };
}
