import BaseMessageSchema from './BaseMessageSchema';

export class TokenRegisteredEventSchema {
  static schema = {
    type: 'record',
    name: 'tokenRegistered',
    namespace: 'net.consensys.codefi.token',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'operationId',
        type: 'string',
      },
      {
        name: 'type',
        type: {
          type: 'enum',
          name: 'TokenType',
          symbols: [
            'CodefiERC20',
            'CodefiERC721',
            'UniversalToken',
            'ConfidentialToken',
          ],
        },
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
        name: 'chainName',
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
        name: 'tenantId',
        type: 'string',
      },
      {
        name: 'createdBy',
        type: 'string',
      },
      {
        name: 'createdAt',
        type: 'string',
      },
    ],
  };
}
