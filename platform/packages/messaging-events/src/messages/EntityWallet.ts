import { WalletType } from '@codefi-assets-and-payments/ts-types';

export interface IEntityWallet {
  address: string;
  type: WalletType;
  metadata: string;
}
