import { WalletType } from '@consensys/ts-types';

export interface IEntityWallet {
  address: string;
  type: WalletType;
  metadata: string;
}
