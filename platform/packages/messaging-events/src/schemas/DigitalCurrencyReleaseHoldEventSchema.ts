import BaseMessageSchema from './BaseMessageSchema';

export class DigitalCurrencyReleaseHoldEventSchema {
  static schema = {
    type: 'record',
    name: 'digitalCurrencyReleaseHoldEvent',
    namespace: 'net.consensys.codefi.confidentialtoken',
    fields: [
      {
        ...BaseMessageSchema.schema,
      },
      {
        name: 'holdId',
        type: 'string',
      },
    ],
  };
}
