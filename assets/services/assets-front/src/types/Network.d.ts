export interface NetworkContract {
  name: string;
  senderWalletAddress: string;
  status: string;
  address: string;
}

export interface NetworkProducts {
  assets: boolean;
}

export interface Network {
  name: string;
  tenantId: string;
  targetTenantId: string;
  key: string;
  description: string;
  contracts: Array<NetworkContract>;
  products: NetworkProducts;
  rpcEndpoints: Array<string>;
  chainId: number;
  kaleido: boolean;
  ethRequired: boolean;
  symbol?: string | null;
  deployerWallet: string;
  finalized: boolean;
  initializedEventEmitted: boolean;
}
