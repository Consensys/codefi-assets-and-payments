import BaseMessageSchema from './BaseMessageSchema';
import TransactionConfigSchema from './TransactionConfigSchema';

export class RegisterAccountCommandSchema {
  static schema = {
    type: 'record',
    name: 'registerAccountCommand',
    namespace: 'net.consensys.codefi.account.register',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'address',
        type: 'string',
      },
      {
        name: 'type',
        type: {
          type: 'enum',
          name: 'AccountType',
          symbols: ['internal', 'external'],
        },
      },
      {
        name: 'tenantId',
        type: 'string',
      },
      {
        name: 'entityId',
        type: 'string',
      },
      {
        name: 'createdBy',
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
