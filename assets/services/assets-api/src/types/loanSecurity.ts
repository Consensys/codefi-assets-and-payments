import { Document } from './asset';

export enum LoanSecurityType {
  CASH = 'CASH',
  PROPERTY = 'PROPERTY',
  ASSETS = 'ASSETS',
}

export enum keys {
  IDENTIFIER = 'identifier',
  TYPE = 'type',
  DESCRIPTION = 'description',
  DOCUMENTS = 'documents',
  TRUSTEE = 'trustee',
}

export interface LoanSecurity {
  [keys.IDENTIFIER]: string;
  [keys.TYPE]: LoanSecurityType;
  [keys.DESCRIPTION]: string;
  [keys.TRUSTEE]: string;
  [keys.DOCUMENTS]: Document[];
}

export const LoanSecurityExample: LoanSecurity = {
  [keys.IDENTIFIER]: 'loan security identifier',
  [keys.TYPE]: LoanSecurityType.ASSETS,
  [keys.DESCRIPTION]: 'loan security description',
  [keys.TRUSTEE]: 'loan security trustee',
  [keys.DOCUMENTS]: [
    {
      name: 'ept.pdf',
      key: 'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
    },
    {
      name: 'tpt.pdf',
      key: 'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
    },
    {
      name: 'kiid.pdf',
      key: 'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
    },
  ],
};
