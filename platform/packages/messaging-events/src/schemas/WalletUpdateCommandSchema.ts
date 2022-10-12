import BaseMessageSchema from './BaseMessageSchema';

export class WalletUpdateCommandSchema {
  static schema = {
    type: 'record',
    name: 'walletUpdateCommand',
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
      {
        name: 'metadata',
        type: 'string',
      },
      {
        name: 'setAsDefault',
        type: 'boolean',
        default: false,
      },
    ],
  };
}
