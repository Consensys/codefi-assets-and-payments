import { keys } from './index';
import { TxReceiptExample, TxReceipt } from './TxReceipt';

export interface Web3Transaction {
  [keys.WEB3_EVENT]: string;
  [keys.WEB3_TX_HASH]: string;
  [keys.WEB3_NONCE]: number;
  [keys.WEB3_BLOCKNUMBER]: number;
  [keys.WEB3_STATUS]: string;
  [keys.WEB3_RECEIPT]: TxReceipt;
}

export const Web3TransactionExample: Web3Transaction = {
  [keys.WEB3_EVENT]: 'receipt',
  [keys.WEB3_TX_HASH]:
    '0x3e4b61de09df673681173838d719b728157ed81fd63775a129b760686dcb9df8',
  [keys.WEB3_NONCE]: 270,
  [keys.WEB3_BLOCKNUMBER]: 4425387,
  [keys.WEB3_STATUS]: 'confirmed',
  [keys.WEB3_RECEIPT]: TxReceiptExample,
};
