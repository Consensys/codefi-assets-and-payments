import { WalletType as EntityApiWalletType } from '@consensys/ts-types';
import { EthServiceType } from 'src/types/ethService';
import { WalletType } from '../../../types/wallet';

export const walletTypeMap = {
  [WalletType.VAULT]: EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT,
  [WalletType.VAULT_DEPRECATED]: EntityApiWalletType.EXTERNAL_OTHER,
  [WalletType.LEDGER]: EntityApiWalletType.EXTERNAL_OTHER,
};

export const walletTypeRevertedMap: {
  [key: string]: {
    ethServiceType: EthServiceType;
    possibleLegacyAssetsWalletTypes: Array<WalletType>;
  };
} = {
  [EntityApiWalletType.INTERNAL_CODEFI_HASHICORP_VAULT]: {
    ethServiceType: EthServiceType.ORCHESTRATE,
    possibleLegacyAssetsWalletTypes: [WalletType.VAULT],
  },
  [EntityApiWalletType.INTERNAL_CODEFI_AZURE_VAULT]: {
    ethServiceType: EthServiceType.ORCHESTRATE,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.INTERNAL_CODEFI_AWS_VAULT]: {
    ethServiceType: EthServiceType.ORCHESTRATE,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.INTERNAL_CLIENT_AZURE_VAULT]: {
    ethServiceType: EthServiceType.ORCHESTRATE,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.INTERNAL_CLIENT_AWS_VAULT]: {
    ethServiceType: EthServiceType.ORCHESTRATE,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.EXTERNAL_CLIENT_METAMASK]: {
    ethServiceType: EthServiceType.LEDGER,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.EXTERNAL_CLIENT_METAMASK_INSTITUTIONAL]: {
    ethServiceType: EthServiceType.LEDGER,
    possibleLegacyAssetsWalletTypes: [], // didn't exist
  },
  [EntityApiWalletType.EXTERNAL_OTHER]: {
    ethServiceType: EthServiceType.LEDGER,
    possibleLegacyAssetsWalletTypes: [
      WalletType.LEDGER,
      WalletType.VAULT_DEPRECATED,
    ],
  },
};
