import Transaction from './transaction';
import CONTRACTS from '../config/contracts.json';
import { ContractName, Web3OnTransactionReceipt } from '../types';
import execRetry from '../utils/retry';
import { logger } from '../logging/logger';

/**
 * Contract class
 */
class Contracts extends Transaction {
  contracts;
  from;
  constructor(rpcEndpoint?: string) {
    super(rpcEndpoint);
    this.contracts = [];
  }

  addContract = (contractName: ContractName, address: string) => {
    const contract = CONTRACTS[contractName];
    this.contracts[contractName] = new this.web3.eth.Contract(
      contract.abi,
      address,
    );
  };

  // getSignature returns the signature of given method for a given contract
  // It's a view function and does not require any specific settings for the contracts
  getSignature = (contractName: ContractName, methodName: string) => {
    const abi = CONTRACTS[contractName].abi;
    if (abi === undefined) {
      logger.info(
        {},
        `Get contract method signature ---> No abi found for ${contractName}`,
      );
    }
    let signature = String(methodName);
    signature += '(';

    // The constructor has a special layout in the abi
    if (methodName === 'constructor') {
      for (const m in abi) {
        if (abi[m].type === methodName) {
          const inputs = abi[m].inputs;

          if (inputs && inputs.length > 0) {
            for (const i in inputs) {
              signature += inputs[i].type + ',';
            }
            signature = signature.slice(0, -1);
          }
          signature += ')';
          return signature;
        }
      }
    }

    for (const m in abi) {
      if (abi[m].type === 'function' && abi[m].name === methodName) {
        const inputs = abi[m].inputs;
        for (const i in inputs) {
          signature += inputs[i].type + ',';
        }
        signature = signature.slice(0, -1);
        signature += ')';
        return signature;
      }
    }

    logger.error(
      {},
      `Contract - could not find method named ${methodName} in ${contractName}`,
    );
  };

  craft = (contractName: ContractName, method: string, args: any[]) =>
    this.contracts[contractName].methods[method](...args);

  call = async (contractName: ContractName, method: string, args: any[]) => {
    try {
      return execRetry(
        async () =>
          await this.contracts[contractName].methods[method](...args).call({
            from: this.from,
          }),
        7,
        3000,
        1.5,
      );
    } catch (err) {
      logger.error(
        {
          contractName,
          method,
          args,
          err,
        },
        'Contract - call',
      );
      throw err;
    }
  };

  async deploy(contractName: string, args: any[]): Promise<string> {
    try {
      const jsonInterface = CONTRACTS[contractName];
      const contract = new this.web3.eth.Contract(jsonInterface.abi);
      const data = jsonInterface.bytecode;
      const tx = contract.deploy({
        arguments: args,
        data,
      });
      const response = (await this.send(
        tx,
        'receipt',
      )) as Web3OnTransactionReceipt;
      return response.receipt.contractAddress;
    } catch (err) {
      logger.error(
        {
          contractName,
          args,
          err,
        },
        `Contract - could not deploy ${contractName}`,
      );
      throw err;
    }
  }
}

export default Contracts;
