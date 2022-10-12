export enum HoldStatusCode {
  NONEXISTENT = 'Nonexistent',
  ORDERED = 'Ordered',
  EXECUTED = 'Executed',
  EXECUTED_AND_KEPT_OPEN = 'ExecutedAndKeptOpen',
  RELEASED_BY_NOTARY = 'ReleasedByNotary',
  RELEASED_BY_PAYEE = 'ReleasedByPayee',
  RELEASED_ON_EXPIRATION = 'ReleasedOnExpiration',
}

export interface Hold {
  id?: string;
  partition: string;
  sender: string;
  recipient: string;
  notary: string;
  value: string;
  expiration: string;
  secretHash: string;
  secret: string;
  status: string;
  statusReadable?: HoldStatusCode;
  valueReadable?: number;
}
