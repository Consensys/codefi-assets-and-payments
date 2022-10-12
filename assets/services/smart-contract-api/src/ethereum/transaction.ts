import Node from './node';
import { TransactionFactory, TypedTransaction } from '@ethereumjs/tx';
import { Web3OnTransactionReceipt, Web3OnTransactionHash } from '../types';
import { logger } from '../logging/logger';

/**
 * Transaction class
 */
class Transaction extends Node {
  send = (
    transaction,
    event = 'transactionHash',
  ): Promise<Web3OnTransactionHash | Web3OnTransactionReceipt> => {
    return new Promise(async (resolve, reject) => {
      try {
        const gasPrice = await this.web3.eth.getGasPrice();
        const nonce = await this.web3.eth.getTransactionCount(this.from);
        transaction
          .send({
            from: this.from,
            gasPrice,
            gas: 6721975,
          })
          .on('error', (error) => {
            logger.error(
              {
                error,
                event,
                transaction,
              },
              'Transaction - send() - blockchain error',
            );
            reject(error);
          })
          .on('transactionHash', (transactionHash) => {
            const response = {
              event: 'transactionHash',
              txHash: transactionHash,
              nonce,
              status: 'pending',
            };
            if (event === 'transactionHash') {
              resolve(response);
            }
          })
          .on('receipt', (receipt) => {
            const response = {
              event: 'receipt',
              txHash: receipt.transactionHash,
              nonce: nonce,
              blockNumber: receipt.blockNumber,
              status: 'confirmed',
              receipt,
            };
            if (event === 'receipt') {
              resolve(response);
            }
          });
      } catch (err) {
        logger.error(
          {
            err,
            event,
            transaction,
          },
          'Transaction - could not send ethereum transaction',
        );
        reject(err);
      }
    });
  };

  sign() {
    return new Promise((resolve, reject) => {
      this.web3.eth
        .getGasPrice((error, gasPrice) => {
          if (error) {
            reject(error);
          }
          return gasPrice;
        })
        .then((gasPrice) => resolve(gasPrice))
        .catch((err) => reject(new Error(`sign --> ${err}`)));
    });
  }

  generateRawTx(rawTransaction): TypedTransaction {
    return TransactionFactory.fromTxData(rawTransaction);
  }

  serializeTx(transaction) {
    const serializedTx = transaction.serialize();
    return `0x${serializedTx.toString('hex')}`;
  }

  getTransaction(txhash) {
    return new Promise((resolve, reject) => {
      this.web3.eth
        .getTransaction(txhash)
        .then((txInfo) => {
          return resolve(txInfo);
        })
        .catch((err) => reject(new Error(`getTransaction --> ${err}`)));
    });
  }
}

export default Transaction;
