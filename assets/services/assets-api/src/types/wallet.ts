import { WalletType as EntityApiWalletType } from '@codefi-assets-and-payments/ts-types';

export enum WalletType {
  VAULT = 'vault',
  VAULT_DEPRECATED = 'vault_deprecated', // used to track a wallet which is supposed to be in the Vault but can't be found in the Vault anymore
  LEDGER = 'ledger',
}

export enum keys {
  WALLET_ADDRESS = 'address',
  WALLET_NEW_TYPE = 'newType',
  WALLET_TYPE = 'type',
  WALLET_DATA = 'data',
}

export interface Wallet {
  [keys.WALLET_ADDRESS]: string;
  [keys.WALLET_NEW_TYPE]: EntityApiWalletType;
  [keys.WALLET_TYPE]?: WalletType;
  [keys.WALLET_DATA]?: any;
}

export const WalletExample: Wallet = {
  [keys.WALLET_ADDRESS]: '0xd200b5d89f719473573be585eadedc8c916e5515',
  [keys.WALLET_NEW_TYPE]: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  [keys.WALLET_TYPE]: WalletType.VAULT,
  [keys.WALLET_DATA]: {
    description: "This wallet is stored in Orchestrate's vault",
    exampleKey: 'exampleValue',
  },
};
