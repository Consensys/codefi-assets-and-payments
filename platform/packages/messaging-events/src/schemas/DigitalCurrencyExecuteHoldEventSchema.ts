import BaseMessageSchema from './BaseMessageSchema';

export class DigitalCurrencyExecuteHoldEventSchema {
  static schema = {
    type: 'record',
    name: 'digitalCurrencyExecuteHoldEvent',
    namespace: 'net.consensys.codefi.confidentialtoken',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'holdId',
        type: 'string',
      },
      {
        name: 'lockPreimage',
        type: 'string',
      },
    ],
  };
}
