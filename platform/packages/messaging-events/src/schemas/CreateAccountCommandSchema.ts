import BaseMessageSchema from './BaseMessageSchema';
import TransactionConfigSchema from './TransactionConfigSchema';

export class CreateAccountCommandSchema {
  static schema = {
    type: 'record',
    name: 'createAccountCommand',
    namespace: 'net.consensys.codefi.account.register',
    fields: [
      {
        ...BaseMessageSchema.schema,
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
