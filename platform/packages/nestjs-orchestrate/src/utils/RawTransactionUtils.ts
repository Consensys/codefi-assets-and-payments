import { TransactionConfig } from '../transactions/TransactionConfig'
import cfg from '../config'

export class RawTransactionUtils {
  static buildRawTransaction(data: string, config: TransactionConfig): any {
    return {
      from: config.from,
      to: config.to,
      gas: cfg().transactionGas(config.gas),
      gasPrice: cfg().transactionGasPrice(config.gasPrice),
      nonce: config.nonce,
      data,
    }
  }
}
