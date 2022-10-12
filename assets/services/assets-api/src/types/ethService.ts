import { Network, NetworkExample } from './network';

export enum EthServiceType {
  ORCHESTRATE = 'orchestrate',
  LEDGER = 'ledger',
  WEB3 = 'web3',
  RAW_TX_DATA = 'data',
}

export enum keys {
  TYPE = 'type',
  DATA = 'data', // parameter to be renamed "network"
}
export interface EthService {
  [keys.TYPE]: EthServiceType;
  [keys.DATA]: Network; // parameter to be renamed "network"
}

export const EthServiceExample: EthService = {
  [keys.TYPE]: EthServiceType.ORCHESTRATE,
  [keys.DATA]: NetworkExample,
};
