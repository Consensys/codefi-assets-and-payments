import { EthServiceType } from './ethService';
import { LedgerTransaction } from './transaction/LedgerTransaction';
import { OrchestrateTransaction } from './transaction/OrchestrateTransaction';
import { Web3Transaction } from './transaction/Web3Transaction';

export enum keys {
  TX_IDENTIFIER = 'txIdentifier',
  TX = 'tx',
  TYPE = 'type',
  TX_SERIALIZED = 'txSerialized',
  CALL_PATH = 'callPath',
  CALL_BODY = 'callBody',
}

export interface ApiSCResponse {
  [keys.TX_IDENTIFIER]: string;
  [keys.TX]: OrchestrateTransaction | LedgerTransaction | Web3Transaction;
  [keys.TYPE]: EthServiceType;
  [keys.TX_SERIALIZED]: string;
  [keys.CALL_PATH]?: string;
  [keys.CALL_BODY]?: object;
}
