import express from 'express';
import {
  createEthService,
  formatAllArgs,
  extractChainKeyFromEthService,
} from '../utils/helper';
import {
  SERVICE_TYPE_ORCHESTRATE,
  SERVICE_TYPE_LEDGER,
  SERVICE_TYPE_PAYLOAD,
  CodefiService,
  ORCHESTRATE_REGISTRY_TAG,
  ORCHESTRATE_NEW_CONTRACT_TX,
  DEFAULT_WALLET,
} from '../config/constants';
import Contracts from '../ethereum/contracts';
import execRetry from '../utils/retry';
import orchestrateInstance from '../orchestrate';
import { ISendTransactionRequest } from 'pegasys-orchestrate';
import {
  OrchestrateTransactionResponse,
  Web3Tranaction,
  ContractName,
  EthService,
  Wallet,
} from '../types';
import { logger } from '../logging/logger';

import { v4 as uuidv4 } from 'uuid';
import { extractAuthTokenFromRequest } from '../utils/authToken';
import extractErrorMessage from '../utils/errorMessage';

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
 * TransactionRouter class
 */
class TransactionRouter {
  router;
  identifierContractAddress;
  identifierSignerAddress;
  identifierSignerPrivateKey;
  identifierEthServiceType;
  identifierChain;
  identifierTenantId;
  identifierServiceName;
  identifierServiceUrl;
  constructor() {
    this.router = express.Router();
    this.identifierContractAddress = 'contractAddress';
    this.identifierSignerAddress = 'signerAddress';
    this.identifierSignerPrivateKey = 'signerPrivateKey'; // Only for web3 transactions
    this.identifierEthServiceType = 'ethServiceType';
    this.identifierChain = 'chain';
    this.identifierTenantId = 'tenantId';
    this.identifierServiceName = 'serviceName';
    this.identifierServiceUrl = 'serviceUrl';
  }

  // create Transaction Request
  createTransactionRequest = (
    contractName: ContractName,
    defaultContractAddress: string,
    element: any,
    // _payable: boolean,
  ) => {
    this.router.post(
      '/' + contractName + '/' + element.name,
      async (req, res) => {
        const authToken = extractAuthTokenFromRequest(req);
        const idempotencyKey = req?.body?.idempotencyKey || uuidv4();

        // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
        // Otherwise we use the 'tenantId' from the authToken.
        const forceTenantId = req?.query?.forceTenantId as string;

        let isValid = true;
        const _reqBody = req.body;
        const signerAddress = _reqBody[this.identifierSignerAddress];
        const signerPrivateKey = _reqBody[this.identifierSignerPrivateKey];
        const tenantId = _reqBody[this.identifierTenantId];
        const serviceName = _reqBody[this.identifierServiceName];
        const serviceUrl = _reqBody[this.identifierServiceUrl];

        // Gather requested args defined by element from get request
        const args = [];
        for (let j = 0; j < element.inputs.length; j++) {
          if (_reqBody[element.inputs[j].name]) {
            const param = formatAllArgs(_reqBody[element.inputs[j].name]);
            args.push(param);
          } else {
            isValid = false;
          }
        }

        // Get ethvalue if precised in request
        // let ethValue = 0;
        // if (_reqBody[identifierEthValue]) {
        //   ethValue = parseInt(_reqBody[identifierEthValue], 10);
        // }

        // Get contractAddress if precised in request
        let localContractAddress = defaultContractAddress;
        if (_reqBody[this.identifierContractAddress]) {
          localContractAddress = _reqBody[this.identifierContractAddress];
        }

        // Get contractAddress if precised in request
        let localEthService: EthService;
        try {
          if (
            _reqBody[this.identifierEthServiceType] &&
            _reqBody[this.identifierChain]
          ) {
            localEthService = createEthService(
              _reqBody[this.identifierEthServiceType],
              _reqBody[this.identifierChain],
            );
          } else {
            throw new Error(
              `missing ${this.identifierEthServiceType} or ${this.identifierChain} parameter`,
            );
          }

          if (!tenantId) {
            throw new Error(`missing tenantId parameter`);
          }
        } catch (error) {
          res.status(error?.status || 500);
          res.json({ error: extractErrorMessage(error) });
        }

        // Send transaction if no parameter is missing
        if (!isValid) {
          res.send('Error: missing input args.');
        } else {
          if (localEthService.type === SERVICE_TYPE_ORCHESTRATE) {
            try {
              const result = await this.createOrchestrateTransactionRequest(
                contractName,
                element,
                localContractAddress,
                args,
                localEthService,
                tenantId,
                serviceName,
                serviceUrl,
                forceTenantId,
                idempotencyKey,
                authToken,
                signerAddress,
              );
              res.status(200);
              res.json({
                ...result,
                type: localEthService.type,
              });
            } catch (err) {
              res.status(err?.status || 500);
              res.json({ error: extractErrorMessage(err) });
            }
          } else if (localEthService.type === SERVICE_TYPE_LEDGER) {
            try {
              const result = await this.createRawTransaction(
                contractName,
                element,
                localContractAddress,
                args,
                localEthService,
                signerAddress,
              );
              res.status(200);
              res.json({
                ...result,
                type: localEthService.type,
              });
            } catch (err) {
              res.status(err?.status || 500);
              res.json({ error: extractErrorMessage(err) });
            }
          } else if (localEthService.type === SERVICE_TYPE_PAYLOAD) {
            try {
              const result = await this.createRawTxData(
                contractName,
                element,
                localContractAddress,
                args,
                localEthService,
              );
              res.status(200);
              res.json({
                ...result,
                type: localEthService.type,
              });
            } catch (err) {
              res.status(err?.status || 500);
              res.json({ error: extractErrorMessage(err) });
            }
          } else {
            try {
              const result = await this.createWeb3TransactionRequest(
                signerPrivateKey,
                contractName,
                element,
                localContractAddress,
                args,
                localEthService,
              );
              res.status(200);
              res.json({
                ...result,
                type: localEthService.type,
              });
            } catch (err) {
              res.status(err?.status || 500);
              res.json({ error: extractErrorMessage(err) });
            }
          }
        }
      },
    );
  };

  // create asynchronous transaction Request [WITH ORCHESTRATE]
  createOrchestrateTransactionRequest = async (
    contractName: ContractName,
    element: any,
    localContractAddress: string,
    args: any[],
    ethService: EthService,
    tenantId: string,
    serviceName: CodefiService,
    serviceUrl: string,
    forceTenantId: string,
    idempotencyKey: string,
    authToken: string,
    signerAddress = '0x7E654d251Da770A068413677967F6d3Ea2FeA9E4',
  ): Promise<OrchestrateTransactionResponse> => {
    try {
      const contracts = new Contracts(ethService.data.rpcEndpoint);
      const signature = contracts.getSignature(contractName, element.name);

      const sendTxToOrchestrate = async () => {
        try {
          const chainKey: string = extractChainKeyFromEthService(ethService);

          const orchestrateMessage: ISendTransactionRequest = {
            params: {
              to: localContractAddress, // required
              methodSignature: signature, // TODO method should also include the types, e.g. method(address,bool)
              // gasPricePolicy: [optional] { priority: Priority.VeryLow | Priority.Low | Priority.Medium | Priority.High | Priority.VeryHigh }
              // oneTimeKey: [optional],
              from: signerAddress,
              // value: [optional],
              // gas: [optional],
              // gasPrice: [optional],
              args: args && args.length > 0 ? args : undefined,
              ...(ORCHESTRATE_NEW_CONTRACT_TX
                ? {
                    contractName: contractName,
                    contractTag: ORCHESTRATE_REGISTRY_TAG,
                  }
                : {}),
            },
            chain: chainKey,
          };

          contracts.addContract(contractName, localContractAddress);

          const transaction = await contracts.craft(
            contractName,
            element.name,
            args,
          );

          const data = transaction.encodeABI();

          const gasLimit: number = await contracts.getGasLimit(
            signerAddress,
            localContractAddress,
            data,
          );

          const id = await orchestrateInstance.sendTransaction(
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
              signature,
              err,
            },
            'transactionRouter - createOrchestrateTransactionRequest - sendTxToOrchestrate',
          );
          throw err;
        }
      };

      const response = await execRetry(sendTxToOrchestrate, 5, 3000, 1.5);

      return response;
    } catch (err) {
      logger.error(
        {
          signerAddress,
          contractName,
          element,
          localContractAddress,
          args,
          ethService,
        },
        'transactionRouter - createOrchestrateTransactionRequest',
      );
      throw err;
    }
  };

  // create raw transaction data [TO SIGN TX ON FRONT-END]
  createRawTxData = async (
    contractName: ContractName,
    element: any,
    localContractAddress: string,
    args: any[],
    ethService: EthService,
  ) => {
    try {
      const contracts = new Contracts(ethService.data.rpcEndpoint);
      contracts.addContract(contractName, localContractAddress);
      const transaction: Web3Tranaction = await contracts.craft(
        contractName,
        element.name,
        args,
      );
      return {
        txData: transaction.encodeABI(),
      };
    } catch (err) {
      logger.error(
        {
          contractName,
          element,
          localContractAddress,
          args,
          ethService,
        },
        'transactionRouter - createRawTxData',
      );
      throw err;
    }
  };

  // create raw transaction [TO SIGN TX ON FRONT-END]
  createRawTransaction = async (
    contractName: ContractName,
    element: any,
    localContractAddress: string,
    args: any[],
    ethService: EthService,
    signerAddress = '0x7E654d251Da770A068413677967F6d3Ea2FeA9E4',
  ) => {
    try {
      const contracts = new Contracts(ethService.data.rpcEndpoint);

      contracts.addContract(contractName, localContractAddress);

      const transaction = await contracts.craft(
        contractName,
        element.name,
        args,
      );
      const nonce = await contracts.getNonce(signerAddress);
      const gasPrice = await contracts.getGasPrice();
      const data = transaction.encodeABI();
      const gasLimit: string = '0x'.concat(
        (
          await contracts.getGasLimit(signerAddress, localContractAddress, data)
        ).toString(16),
      );
      const txParams = {
        from: signerAddress,
        to: localContractAddress,
        value: '0x00',
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        data: data,
        nonce: nonce, // Replace by nonce for your account on geth node
      };
      const tx = contracts.generateRawTx(txParams);
      const txSerialized = contracts.serializeTx(tx);
      return {
        txIdentifier: signerAddress.concat(nonce),
        tx: tx,
        txSerialized: txSerialized,
        txData: data,
      };
    } catch (err) {
      logger.error(
        {
          signerAddress,
          contractName,
          element,
          localContractAddress,
          args,
          ethService,
        },
        'transactionRouter - createRawTransaction',
      );
      throw err;
    }
  };

  // create synchronous transaction Request
  createWeb3TransactionRequest = async (
    signerPrivateKey: string,
    contractName: ContractName,
    element: any,
    localContractAddress: string,
    args: any[],
    ethService: EthService,
  ) => {
    try {
      const contracts = new Contracts(ethService.data.rpcEndpoint);
      const wallet: Wallet = signerPrivateKey
        ? contracts.getWalletFromPrivateKey(signerPrivateKey)
        : DEFAULT_WALLET;
      contracts.setWallet(wallet);
      contracts.addContract(contractName, localContractAddress);
      const transaction = await contracts.craft(
        contractName,
        element.name,
        args,
      );
      const result = await contracts.send(transaction, 'receipt');
      return {
        txIdentifier: result.txHash,
        tx: result,
      };
    } catch (err) {
      logger.error(
        {
          signerPrivateKey,
          contractName,
          element,
          localContractAddress,
          args,
          ethService,
        },
        'transactionRouter - createWeb3TransactionRequest',
      );
      throw err;
    }
  };
}

export default TransactionRouter;
