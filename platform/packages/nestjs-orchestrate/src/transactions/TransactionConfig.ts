export type ProtocolType =
  | 'EthereumConstantinople'
  | 'QuorumConstellation'
  | 'Tessera'
  | 'Orion' // deprecated after Orchestrate v21.11.0-alpha.1 (renamed EEA)
  | 'EEA'

export enum TransactionType {
  RawTransaction,
  SendTransaction,
}

export interface TransactionConfig {
  from: string
  chainName?: string
  nonce?: string
  to?: string
  gas?: string
  gasPrice?: string
  value?: string
  contractTag?: string
  privateFrom?: string
  privateFor?: string[]
  privacyGroupId?: string
  protocol?: ProtocolType
  transactionType?: TransactionType
}
