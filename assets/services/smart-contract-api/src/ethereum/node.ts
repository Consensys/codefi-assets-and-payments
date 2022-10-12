import Web3 from 'web3';
import { Wallet } from '../types';
import { logger } from '../logging/logger';
import execRetry from '../utils/retry';

/**
 * Node class
 */
class Node {
  web3;
  from;
  constructor(rpcEndpoint?: string) {
    this.web3 = new Web3(rpcEndpoint);
  }

  getWalletFromPrivateKey = (walletPrivateKey: string): Wallet => {
    const wallet: Wallet = this.web3.eth.accounts.privateKeyToAccount(
      `0x${walletPrivateKey}`,
    );
    return wallet;
  };

  setWallet = (wallet: Wallet) => {
    const web3Account = this.web3.eth.accounts.privateKeyToAccount(
      `0x${wallet.privateKey}`,
    );
    this.web3.eth.accounts.wallet.add(web3Account);
    this.from = wallet.address;
  };

  getNonce = async (address: string) => {
    try {
      const nonce = await this.web3.eth.getTransactionCount(address);
      return this.web3.utils.toHex(nonce);
    } catch (err) {
      logger.error(
        {
          err,
          address,
        },
        'Node - could not get nonce',
      );
    }
  };

  // Determined by the last few blocks median gas price.
  // It is multiplied by a safety multiplicator
  getGasPrice = async (): Promise<string> => {
    try {
      const gasPrice: string = await this.web3.eth.getGasPrice(); // Ex: "20000000000" (in Wei)
      const roundGasPrice = Math.floor(parseInt(gasPrice) * 1.1);
      return this.web3.utils.toHex(roundGasPrice); // Ex: "0xea"
    } catch (err) {
      logger.error(
        {
          err,
        },
        'Node - could not get gas price',
      );
    }
  };

  getGasLimit = async (
    from: string,
    to: string,
    data: string,
  ): Promise<number> => {
    try {
      let roundGasLimit: number;

      const DEFAULT_GAS_LIMIT = 41000;

      try {
        const estimateGas = async () => {
          const tempGasLimit = await this.web3.eth.estimateGas({
            from: from,
            to: to,
            data: data,
          }); // Ex: 5000000
          return tempGasLimit;
        };
        const gasLimit = await execRetry(estimateGas, 7, 3000, 1.5);
        // EstimateGas function fails sometimes when we send batches of 50 transactions in a row
        // which is why we need the retry here.

        roundGasLimit = Math.min(Math.round(gasLimit * 2), 6721975); // We need to overestimate here because the certificate can take more place than expected (can not be lower than 2 to pass the e2e tests)
      } catch (error) {
        // An error occurs in 'estimateGas' function when the transaction is destined to revert
        // In such cases, we can:
        //  - set gasLimit to 'undefined', which will allow Orchestrate to define it for us (in case of reverted transactions, Orchestrate will not even send the transaction, in order to save us the gas).
        //  - set gasLimit to '41000', which is the default value (this option ensures transaction will be sent on the chain - even in case of a reverted transaction).
        // Here we go for the second option because we want to test reverted transactions in our E2E tests.
        roundGasLimit = Math.round(DEFAULT_GAS_LIMIT * 2);
      }

      return roundGasLimit;
    } catch (err) {
      logger.error(
        {
          err,
          from,
          to,
          data,
        },
        'Node - could not get gas limit',
      );
    }
  };
}

export default Node;
