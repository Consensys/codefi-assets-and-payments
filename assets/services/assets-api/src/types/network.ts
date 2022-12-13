import { Contract, Metadata, Products } from '@consensys/ts-types';

export enum keys {
  TENANT_ID = 'tenantId',
  NAME = 'name',
  KEY = 'key',
  CHAIN_ID = 'chainId',
  TYPE = 'type',
  URLS = 'urls',
  RPC_ENDPOINTS = 'rpcEndpoints',
  RPC_ENDPOINT = 'rpcEndpoint',
  DESCRIPTION = 'description',
  ETH_REQUIRED = 'ethRequired',
  KALEIDO = 'kaleido',
  FAUCET_MNEMONIC = 'faucetMnemonic',
  FINALIZED = 'finalized',
  EXPLORER_URL = 'explorerUrl',
  SYMBOL = 'symbol',
  METADATA = 'metadata',
  PRODUCTS = 'products',
  INITIALIZED_EVENT_EMITTED = 'initializedEventEmitted',
  IS_DEFAULT = 'isDefault',
  ORCHESTRATE_CHAIN_ID = 'orchestrateChainId',
  CONTRACTS = 'contracts',
  DEPLOYER_WALLET = 'deployerWallet',
  FAUCET_MIN_ETH_VALUE = 'faucetMinEthValue',
  IS_ALIVE = 'isAlive',
}

export interface Network {
  [keys.TENANT_ID]: string;
  [keys.NAME]: string;
  [keys.KEY]: string;
  [keys.CHAIN_ID]: string;
  [keys.TYPE]: string;
  [keys.DESCRIPTION]: string;
  [keys.RPC_ENDPOINT]?: string;
  [keys.ETH_REQUIRED]: boolean;
  [keys.KALEIDO]: boolean;
  [keys.FAUCET_MIN_ETH_VALUE]: string;
  [keys.SYMBOL]?: string | null;
  [keys.URLS]?: Array<string>;
  [keys.FAUCET_MNEMONIC]?: string;
  [keys.FINALIZED]?: boolean;
  [keys.IS_ALIVE]?: boolean;
}

export interface FinalizedNetwork extends Network {
  [keys.RPC_ENDPOINTS]: string[];
  [keys.FINALIZED]: boolean;
  [keys.EXPLORER_URL]: string | null;
  [keys.SYMBOL]: string | null;
  [keys.METADATA]: Metadata[];
  [keys.PRODUCTS]: Products;
  [keys.INITIALIZED_EVENT_EMITTED]: boolean;
  [keys.IS_DEFAULT]: boolean;
  [keys.ORCHESTRATE_CHAIN_ID]: string;
  [keys.CONTRACTS]: Contract[];
  [keys.DEPLOYER_WALLET]: string;
}

export const NetworkExample: Network = {
  [keys.TENANT_ID]: 'codefi',
  [keys.NAME]: 'Main Ethereum Network',
  [keys.KEY]: 'mainnet',
  [keys.CHAIN_ID]: '1',
  [keys.TYPE]: 'pow',
  [keys.DESCRIPTION]:
    'Frontier, Homestead, Metropolis, the Ethereum public PoW main network',
  [keys.ETH_REQUIRED]: true,
  [keys.KALEIDO]: false,
  [keys.FAUCET_MIN_ETH_VALUE]: '300000000000000000',
  [keys.IS_ALIVE]: true,
};

export const FinalizedNetworkExample: FinalizedNetwork = {
  [keys.TENANT_ID]: 'codefi',
  [keys.NAME]: 'Main Ethereum Network',
  [keys.KEY]: 'mainnet',
  [keys.CHAIN_ID]: '1',
  [keys.TYPE]: 'pow',
  [keys.DESCRIPTION]:
    'Frontier, Homestead, Metropolis, the Ethereum public PoW main network',
  [keys.ETH_REQUIRED]: true,
  [keys.KALEIDO]: false,
  [keys.RPC_ENDPOINTS]: ['https://mainnet.endpoint.something'],
  [keys.FINALIZED]: true,
  [keys.EXPLORER_URL]: 'https://some.explorer-url',
  [keys.SYMBOL]: 'MY_ASSEST_SYMBOL',
  [keys.METADATA]: [
    { name: 'firstMetadataName', description: 'firstMetadataDescription' },
  ],
  [keys.PRODUCTS]: { payments: true },
  [keys.INITIALIZED_EVENT_EMITTED]: false,
  [keys.IS_DEFAULT]: false,
  [keys.ORCHESTRATE_CHAIN_ID]: 'someChainId',
  [keys.CONTRACTS]: [
    {
      name: 'someContractsName',
      address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    },
  ],
  [keys.DEPLOYER_WALLET]: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  [keys.FAUCET_MIN_ETH_VALUE]: '300000000000000000',
};
