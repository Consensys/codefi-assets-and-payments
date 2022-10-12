import BaseTokenCommandSchema from './BaseTokenCommandSchema';

export class ExecTokenCommandSchema {
  static schema = {
    type: 'record',
    name: 'execTokenCommand',
    namespace: 'net.consensys.codefi.token.exec',
    fields: [
      ...BaseTokenCommandSchema.fields,
      {
        name: 'functionName',
        type: 'string',
      },
      {
        name: 'params',
        type: {
          type: 'array',
          items: ['string', 'int', 'boolean'],
        },
      },
    ],
  };
}
