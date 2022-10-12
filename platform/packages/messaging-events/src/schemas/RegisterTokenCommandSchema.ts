import BaseMessageSchema from './BaseMessageSchema';
import TransactionConfigSchema from './TransactionConfigSchema';

export class RegisterTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'registerTokenCommand',
    namespace: 'net.consensys.codefi.token.register',
    fields: [
      {
        ...BaseMessageSchema.schema,
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
        name: 'contractAddress',
        type: 'string',
      },
      {
        name: 'chainName',
        type: 'string',
      },
      {
        name: 'subject',
        type: 'string',
      },
      {
        name: 'tenantId',
        type: 'string',
      },
      {
        name: 'entityId',
        type: ['string', 'null'],
      },
      {
        name: 'operationId',
        type: 'string',
      },
      {
        name: 'txConfig',
        type: {
          ...TransactionConfigSchema.schema,
        },
      },
    ],
  };
}
