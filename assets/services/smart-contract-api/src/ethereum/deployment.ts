import Transaction from './transaction';
import execRetry from '../utils/retry';
import orchestrateInstance from '../orchestrate';
import CONTRACTS from '../config/contracts.json';
import {
  ORCHESTRATE_REGISTRY_TAG,
  DEFAULT_WALLET,
  CodefiService,
} from '../config/constants';
import {
  ContractName,
  Web3OnTransactionReceipt,
  EthService,
  OrchestrateTransactionResponse,
  RawTransactionResponse,
  Wallet,
} from '../types';
import { extractChainKeyFromEthService } from '../utils/helper';
import { logger } from '../logging/logger';
import { generateCode } from '../utils/codeGenerator';
import { IDeployContractRequest } from 'pegasys-orchestrate';

/*******************************************************************************
 ***************** EXPECTED FORMAT FOR TX REQUEST RESPONSE **********************
 *
 * Format :
 * response = {
 *   txIdentifier: Contains a unique identifier for the transaction
 *               (txHash for web3 or tx.id for Orchestrate tx or other identifier)
 *   type: orchestrate || ledger || web3
 *   tx: Contains any kind of information on the tx, depending on the 'type'.
 * }
 *
 *******************************************************************************
 ******************************************************************************/

/**
 * Deployment class
 */
class Deployment extends Transaction {
  // deploy a smart contract asynchronously [WITH CORE STACK]
  deployWithOrchestrate = async (
    ethService: EthService,
    signerAddress = '0x7E654d251Da770A068413677967F6d3Ea2FeA9E4',
    contractName: ContractName,
    args: any[],
    context: any,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
  ): Promise<OrchestrateTransactionResponse> => {
    try {
      const chainKey: string = extractChainKeyFromEthService(ethService);
      const orchestrateMessage: IDeployContractRequest = {
        params: {
          contractName: contractName,
          contractTag: ORCHESTRATE_REGISTRY_TAG,
          // gasPricePolicy: [optional] { priority: Priority.VeryLow | Priority.Low | Priority.Medium | Priority.High | Priority.VeryHigh }
          // oneTimeKey: [optional],
          from: signerAddress, // [optional]
          // value: [optional],
          // gas: [optional],
          // gasPrice: [optional],
          args: args && args.length > 0 ? args : undefined,
        },
        chain: chainKey,
      };

      const gasLimit: number = await this.getGasLimit(
        signerAddress,
        undefined,
        this.getDeploymentData(contractName, args),
      );

      const sendToOrchestrate = async () => {
        try {
          const id = await orchestrateInstance.deployContract(
            orchestrateMessage,
            tenantId,
            serviceName,
            serviceUrl,
            gasLimit ? gasLimit.toString() : undefined, // gasLimit can be 'undefined' but not '0' (in case of 'undefined' it will be handled by Orchestrate)
            true, // decorateTransaction
            forceTenantId,
            idempotencyKey,
            authToken,
          );
          // FIXME - new producer does not seem to return a tx object - we might have a breaking change here
          return {
            txIdentifier: id,
            tx: orchestrateMessage,
          };
        } catch (err) {
          logger.error(
            {
              err,
              orchestrateMessage,
            },
            'Deployment - error sending orchestrate message',
          );
          throw err;
        }
      };

      const response = await execRetry(sendToOrchestrate, 5, 3000, 1.5);

      return response;
    } catch (err) {
      logger.error(
        {
          err,
          ethService,
          signerAddress,
          contractName,
          args,
          context,
        },
        `Deployment - could not deploy contract ${contractName} (orchestre tx)`,
      );
      throw err;
    }
  };

  // create smart contract deployment transaction [TO SIGN TX ON FRONT-END]
  createRawContractDeploymentTx = async (
    signerAddress = '0x7E654d251Da770A068413677967F6d3Ea2FeA9E4',
    contractName: ContractName,
    args: any[],
    ethService: EthService,
  ): Promise<RawTransactionResponse> => {
    try {
      // Check if contract compilation available
      if (!CONTRACTS[contractName]) {
        const errorMessage = 'No compiled contract ' + contractName;
        throw new Error(errorMessage);
      }

      const nonce = await this.getNonce(signerAddress);
      const gasPrice: string = await this.getGasPrice();
      const gasLimit: string = '0x'.concat(
        (
          await this.getGasLimit(
            signerAddress,
            undefined,
            this.getDeploymentData(contractName, args),
          )
        ).toString(16),
      );
      const txParams = {
        from: signerAddress,
        to: undefined,
        value: '0x00',
        gasPrice,
        gasLimit,
        data: this.getDeploymentData(contractName, args),
        nonce, // Replace by nonce for your account on geth node
      };
      const tx = this.generateRawTx(txParams);
      const txSerialized = this.serializeTx(tx);
      return {
        txIdentifier: generateCode().concat('-raw'),
        tx,
        txSerialized,
      };
    } catch (err) {
      logger.error(
        {
          err,
          ethService,
          signerAddress,
          contractName,
          args,
        },
        `Deployment - could not deploy contract ${contractName} (raw tx)`,
      );
      throw err;
    }
  };

  // deploy a smart contract synchronously [WITHOUT ORCHESTRATE]
  deployWithWeb3 = async (
    signerPrivateKey: string,
    contractName: ContractName,
    args: any[],
  ): Promise<Web3OnTransactionReceipt> => {
    try {
      const wallet: Wallet = signerPrivateKey
        ? this.getWalletFromPrivateKey(signerPrivateKey)
        : DEFAULT_WALLET;
      this.setWallet(wallet);

      // Check if contract compilation available
      if (!CONTRACTS[contractName]) {
        const errorMessage = 'No compiled contract ' + contractName;
        throw new Error(errorMessage);
      }
      const contractInterface = CONTRACTS[contractName];
      const contract = new this.web3.eth.Contract(contractInterface.abi);
      const transaction = contract.deploy({
        data: contractInterface.bytecode,
        arguments: args,
      });

      const result = await this.send(transaction, 'receipt');
      return result as Web3OnTransactionReceipt;
    } catch (err) {
      logger.error(
        {
          err,
          signerPrivateKey,
          contractName,
          args,
        },
        `Deployment - could not deploy contract ${contractName} (web3 tx)`,
      );
      throw err;
    }
  };

  // getDeploymentData returns the payload for a deployment
  getDeploymentData = (contractName: ContractName, args: any[]) => {
    try {
      // Check if contract compilation available
      if (!CONTRACTS[contractName]) {
        const errorMessage = 'No compiled contract ' + contractName;
        throw new Error(errorMessage);
      }

      const contractObject = new this.web3.eth.Contract(
        CONTRACTS[contractName].abi,
      );

      return contractObject
        .deploy({
          data: CONTRACTS[contractName].bytecode,
          arguments: args,
        })
        .encodeABI();
    } catch (err) {
      logger.error(
        {
          err,
          contractName,
          args,
        },
        'Deployment - could not craft deployment data',
      );
      throw err;
    }
  };
}

export default Deployment;
