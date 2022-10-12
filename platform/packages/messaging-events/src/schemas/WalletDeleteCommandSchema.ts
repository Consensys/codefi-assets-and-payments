import BaseMessageSchema from './BaseMessageSchema';

export class WalletDeleteCommandSchema {
  static schema = {
    type: 'record',
    name: 'walletDeleteCommand',
    namespace: 'net.consensys.codefi.convergence.wallet',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'tenantId',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'entityId',
        type: ['null', 'string'],
        default: null,
      },
      {
        name: 'address',
        type: 'string',
      },
    ],
  };
}
