import BaseMessageSchema from './BaseMessageSchema';

export class DigitalCurrencyNewHoldEventSchema {
  static schema = {
    type: 'record',
    name: 'digitalCurrencyNewHoldEvent',
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
        name: 'sender',
        type: 'string',
      },
      {
        name: 'inputNoteHashes',
        type: {
          type: 'array',
          items: 'string',
        },
      },
      {
        name: 'outputNoteHashes',
        type: {
          type: 'array',
          items: 'string',
        },
      },
      {
        name: 'notary',
        type: 'string',
      },
      {
        name: 'expirationDateTime',
        type: 'int',
      },
      {
        name: 'lockHash',
        type: 'string',
      },
    ],
  };
}
