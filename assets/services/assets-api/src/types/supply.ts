import { TokenState } from './states';
import { TxStatus } from './transaction';

export enum keys {
  USER_ID = 'userId',
  TOKEN_STATE = 'tokenState',
  TOKEN_CLASS = 'tokenClass',
  TOKEN_IDENTIFIER = 'tokenIdentifier',
  QUANTITY = 'quantity',
  FORCE_PRICE = 'forcePrice',
  DATA = 'data',
  SEND_NOTIFICATION = 'sendNotification',
  WORKFLOW_INSTANCE_ID = 'workflowInstanceId',
  TRANSACTION_ID = 'transactionId',
  TRANSACTION_STATUS = 'transactionStatus',
}

export interface InitialSupply {
  [keys.USER_ID]: string;
  [keys.TOKEN_STATE]?: TokenState; // only for hybrid
  [keys.TOKEN_CLASS]?: string; // only for hybrid
  [keys.TOKEN_IDENTIFIER]?: string; // only for nonfungible
  [keys.QUANTITY]: number; // only for fungible or hybrid
  [keys.FORCE_PRICE]: number; // optional
  [keys.DATA]: any;
  [keys.SEND_NOTIFICATION]: boolean;
  [keys.WORKFLOW_INSTANCE_ID]?: number; // Undefined before minting transaction is sent
  [keys.TRANSACTION_ID]?: string; // Undefined before minting transaction is sent
  [keys.TRANSACTION_STATUS]?: TxStatus; // Undefined before minting transaction is sent
}

export const InitialSupplyExample: InitialSupply = {
  [keys.USER_ID]: '6935576f-3fa3-4402-bfdb-563134823a26',
  [keys.TOKEN_STATE]: TokenState.ISSUED,
  [keys.TOKEN_CLASS]: 'classa',
  [keys.QUANTITY]: 1000000,
  [keys.FORCE_PRICE]: 0,
  [keys.DATA]: {},
  [keys.SEND_NOTIFICATION]: false,
  [keys.WORKFLOW_INSTANCE_ID]: 1398,
  [keys.TRANSACTION_ID]: 'b8cb9c69-0996-4a01-b94e-fe4e8b90dbac',
  [keys.TRANSACTION_STATUS]: TxStatus.VALIDATED,
};
