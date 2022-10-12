import { HookCallBack, HookCallBackExample } from 'src/types/hook';
import { keys as UserKeys, UserExample } from '../user';

export enum TxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  VALIDATED = 'validated',
  REVERTED = 'reverted',
  FAILED = 'failed',
}

export enum keys {
  ORCHESTRATE_OFFSET = 'offset',
  ORCHESTRATE_ID = 'id',
  WEB3_EVENT = 'event',
  WEB3_TX_HASH = 'txHash',
  WEB3_NONCE = 'nonce',
  WEB3_BLOCKNUMBER = 'blockNumber',
  WEB3_STATUS = 'status',
  WEB3_RECEIPT = 'receipt',
  TX_NONCE = 'nonce',
  TX_GAS_PRICE = 'gasPrice',
  TX_GAS_LIMIT = 'gasLimit',
  TX_TO = 'to',
  TX_VALUE = 'value',
  TX_DATA = 'data',
  TX_V = 'v',
  TX_R = 'r',
  TX_S = 's',
  RECEIPT_BLOCK_HASH = 'blockHash',
  RECEIPT_BLOCK_NUMBER = 'blockNumber',
  RECEIPT_CONTRAT_ADDRESS = 'contractAddress',
  RECEIPT_CUMULATIVE_GAS_USED = 'cumulativeGasUsed',
  RECEIPT_FROM = 'from',
  RECEIPT_GAS_USED = 'gasUsed',
  RECEIPT_LOGS_BLOOM = 'logsBloom',
  RECEIPT_STATUS = 'status',
  RECEIPT_TO = 'to',
  RECEIPT_TX_HASH = 'transactionHash',
  RECEIPT_TX_INDEX = 'transactionIndex',
  RECEIPT_EVENTS = 'events',
  ENV_ID = 'id',
  ENV_TRANSACTION_ID = 'transactionId', // Shall replace ENV_IDENTIFIER_ORCHESTRATE_ID
  ENV_STATUS = 'status',
  ENV_CONTEXT = 'context',
  ENV_CREATED_AT = 'createdAt',
  ENV_UPDATED_AT = 'updatedAt',
  ENV_USER_ID = 'userId',
  ENV_RECEIPT = 'txReceipt',
  ENV_TENANT_ID = 'tenantId',
  ENV_SIGNER_ID = 'signerId',
  ENV_CALLER_ID = 'callerId',
  ENV_IDENTIFIER_ORCHESTRATE_ID = 'identifierOrchestrateId',
  ENV_IDENTIFIER_TX_HASH = 'identifierTxHash',
  ENV_IDENTIFIER_CUSTOM = 'identifierCustom',
  ENV_CALLBACKS = 'callbacks',
}

export interface Transaction {
  [keys.ENV_ID]?: number;
  [keys.ENV_TENANT_ID]?: string;
  [keys.ENV_STATUS]: TxStatus;
  [keys.ENV_SIGNER_ID]: string;
  [keys.ENV_CALLER_ID]: string;
  [keys.ENV_IDENTIFIER_ORCHESTRATE_ID]: string;
  [keys.ENV_IDENTIFIER_TX_HASH]: string;
  [keys.ENV_IDENTIFIER_CUSTOM]?: string;
  [keys.ENV_TRANSACTION_ID]?: string; // Should be deprecated
  [keys.ENV_USER_ID]?: string; // Should be deprecated
  [keys.ENV_CALLBACKS]: any[];
  [keys.ENV_CONTEXT]: HookCallBack;
  [keys.ENV_RECEIPT]?: string;
  [keys.ENV_CREATED_AT]?: Date;
  [keys.ENV_UPDATED_AT]?: Date;
}

export const TransactionExample: Transaction = {
  [keys.ENV_ID]: 3435,
  [keys.ENV_TENANT_ID]: 'MQp8PWAYYas8msPmfwVppZY2PRbUsFa5',
  [keys.ENV_SIGNER_ID]: UserExample[UserKeys.USER_ID],
  [keys.ENV_CALLER_ID]: UserExample[UserKeys.USER_ID],
  [keys.ENV_TRANSACTION_ID]: 'b8cb9c69-0996-4a01-b94e-fe4e8b90dbac',
  [keys.ENV_IDENTIFIER_ORCHESTRATE_ID]: 'b8cb9c69-0996-4a01-b94e-fe4e8b90dbac',
  [keys.ENV_IDENTIFIER_TX_HASH]:
    '0x7b4b61de09df673681173838d639b728157ed81fd63775a129b760686dcb9de6',
  [keys.ENV_STATUS]: TxStatus.VALIDATED,
  [keys.ENV_CONTEXT]: HookCallBackExample,
  [keys.ENV_CALLBACKS]: ['sendTokenCreationEmail'],
  [keys.ENV_CREATED_AT]: new Date('December 19, 1990 08:24:00'),
  [keys.ENV_UPDATED_AT]: new Date('December 19, 1990 08:24:00'),
};
