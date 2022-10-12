import BaseMessageSchema from './BaseMessageSchema';

export const externalKYCResultSchema = {
  type: 'record',
  name: 'externalKycResult',
  namespace: 'net.consensys.codefi.kyc',
  fields: [
    {
      ...BaseMessageSchema.schema,
    },
    { name: 'userId', type: 'string' },
    {
      name: 'scope',
      type: {
        type: 'enum',
        name: 'KYCScope',
        symbols: ['ALL', 'ID', 'IDENTITY'],
      },
    },
    {
      name: 'errors',
      type: { type: 'map', values: { type: 'array', items: 'string' } },
    },
    { name: 'reportName', type: ['null', 'string'], default: null },
    { name: 'message', type: ['null', 'string'], default: null },
    {
      name: 'result',
      type: { type: 'enum', name: 'KYCResult', symbols: ['PASS', 'FAIL'] },
    },
  ],
};
