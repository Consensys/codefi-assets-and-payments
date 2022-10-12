export interface ITransactionConfig {
  from: string;
  chainName: string | null;
  nonce: string | null;
  to: string | null;
  gas: string | null;
  gasPrice: string | null;
  value: string | null;
  contractTag: string | null;
  privateFrom: string | null;
  privateFor: string[] | null;
  privacyGroupId: string | null;
  protocol: ProtocolType | null;
  transactionType: TransactionType | null;
}

export declare type ProtocolType =
  | "EthereumConstantinople"
  | "QuorumConstellation"
  | "Tessera"
  | "Orion";

export enum TransactionType {
  RawTransaction,
  SendTransaction,
}
