export enum keys {
  OWNER = 'owner',
  SECRET_ENCRYPTED = 'secretEncrypted',
  SECRET = 'secret',
  SECRET_HASH = 'secretHash',
}

export interface HTLC {
  [keys.OWNER]?: string;
  [keys.SECRET_ENCRYPTED]?: string;
  [keys.SECRET]?: string;
  [keys.SECRET_HASH]: string;
}

export const HTLCExample: HTLC = {
  [keys.OWNER]: 'a096c438-2b37-444f-ad0a-6a61bb84fee3',
  [keys.SECRET_ENCRYPTED]: '0x',
  [keys.SECRET]: '0x',
  [keys.SECRET_HASH]: '0x',
};
