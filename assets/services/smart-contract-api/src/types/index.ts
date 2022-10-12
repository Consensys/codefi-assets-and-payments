import { TypedTransaction } from '@ethereumjs/tx';
import { ISendTransactionRequest } from 'pegasys-orchestrate';

export type OrchestrateTransactionResponse = {
  txIdentifier: string;
  tx: ISendTransactionRequest;
};

export interface OrchestrateRawDeploymentResponse
  extends OrchestrateTransactionResponse {
  txSerialized: string;
}

export type Web3Tranaction = {
  encodeABI: Function;
  call: Function;
};

export type Web3OnTransactionHash = {
  event: string;
  txHash: string;
  nonce: number;
  status: string;
};

export interface Web3OnTransactionReceipt extends Web3OnTransactionHash {
  receipt: {
    txHash: string;
    contractAddress: string;
    status: boolean;
  };
  tx: Web3OnTransactionHash;
}

export type RawTransactionResponse = {
  txIdentifier: string;
  tx: TypedTransaction;
  txSerialized: string;
};

export interface DeploymentResponse extends OrchestrateTransactionResponse {
  type: string;
}

export type RawTransactionOnHash = {
  txIdentifier: string;
  tx: string;
  txSerialized: string;
  txData: string;
};

export interface RawTransactionOnReceipt extends RawTransactionOnHash {
  receipt: {
    contractAddress: string;
  };
}

export type EthServiceType = 'orchestrate' | 'ledger' | 'web3' | 'data';

export type EthService = {
  data: {
    rpcEndpoint: string;
    key: string;
  };
  type: EthServiceType;
};

export type ContractName =
  | 'ERC1400ERC20AuditedV1'
  | 'ERC1400'
  | 'ERC1400CertificateNonceAuditedV2'
  | 'ERC1400CertificateSaltAuditedV2'
  | 'ERC1400HoldableCertificateToken'
  | 'ERC1400TokensValidator'
  | 'DVP'
  | 'DVPHoldableLockable'
  | 'MultiSigWallet'
  | 'ERC20Token'
  | 'ERC20HoldableToken'
  | 'ERC721Token'
  | 'BatchBalanceReader'
  | 'BatchReader'
  | 'BatchTokenIssuer'
  | 'ERC1820Registry'
  | 'Example';

export type ContractConfig = {
  deploy: boolean;
  version: string;
  forceDeploy: boolean;
  forceDeployNetwork?: string;
  address: string;
  args: any[];
};

export type ContractConfigs = Record<ContractName, ContractConfig>;

export type Wallet = {
  address: string;
  privateKey: string;
};

export const enum TxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  VALIDATED = 'validated',
  REVERTED = 'reverted',
  FAILED = 'failed',
}
