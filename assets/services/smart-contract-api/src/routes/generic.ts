import { ISendRawRequest, ITransferRequest } from 'pegasys-orchestrate';
import {
  extractChainKeyFromEthService,
  createEthService,
} from '../utils/helper';
import express from 'express';
import orchestrateInstance from '../orchestrate';
import Web3 from 'web3';
import {
  validateContractInput,
  validateContractAddressInput,
} from '../utils/validator';
import {
  SERVICE_TYPE_ORCHESTRATE,
  SERVICE_TYPE_WEB3,
  ZERO_ADDRESS,
  DEFAULT_WALLETS,
  WALLETS,
  CodefiService,
} from '../config/constants';
import CONTRACTS from '../config/contracts.json';
import { EthService } from '../types';
import { logger } from '../logging/logger';

import { v4 as uuidv4 } from 'uuid';
import { extractAuthTokenFromRequest } from '../utils/authToken';
import extractErrorMessage from '../utils/errorMessage';
import execRetry from '../utils/retry';

const router = express.Router();

router.get('/get-deployer-address', async (req, res) => {
  try {
    res.status(200);
    res.send(
      WALLETS.map(({ accounts, key }) => {
        return { key, deployer: accounts[0].address };
      }),
    );
  } catch (err) {
    logger.error(
      {
        err,
      },
      'Routes - generic - get-deployer-balance',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

router.get('/get-user-balance', async (req, res) => {
  const userAddress = req.query.userAddress || DEFAULT_WALLETS[0].address;

  let ethService: EthService;
  try {
    if (req.query.chain) {
      ethService = createEthService(
        SERVICE_TYPE_WEB3,
        req.query.chain.toString(),
      );
    } else {
      throw new Error(`missing chain parameter`);
    }
  } catch (error) {
    res.status(error?.status || 500);
    res.json({ error: extractErrorMessage(error) });
  }

  try {
    const web3 = new Web3(ethService.data.rpcEndpoint);
    const balance = await web3.eth.getBalance(userAddress);
    const ethBalance = web3.utils.fromWei(web3.utils.toBN(balance), 'ether');
    res.status(200);
    res.send(ethBalance);
  } catch (err) {
    logger.error(
      {
        err,
        userAddress,
        ethService,
      },
      'Routes - generic - get-user-balance',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

router.get('/get-user-nonce', async (req, res) => {
  const userAddress = req.query.userAddress || DEFAULT_WALLETS[0].address;
  let ethService: EthService;
  try {
    if (req.query.chain) {
      ethService = createEthService(
        SERVICE_TYPE_WEB3,
        req.query.chain.toString(),
      );
    } else {
      throw new Error(`missing chain parameter`);
    }

    const web3 = new Web3(ethService.data.rpcEndpoint);
    const nonce = await web3.eth.getTransactionCount(userAddress);
    res.status(200);
    res.send(nonce.toString());
  } catch (err) {
    logger.error(
      {
        err,
        userAddress,
        ethService,
      },
      'Routes - generic - get-user-nonce',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

router.get('/get-contract-abi', [
  validateContractInput,
  (req, res) => {
    const { contractName } = req.query;
    try {
      res.status(200);
      res.send(CONTRACTS[contractName].abi);
    } catch (err) {
      logger.error(
        {
          err,
          contractName,
        },
        'Routes - generic - get-contract-abi',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  },
]);

router.get('/get-contract-balance', [
  validateContractAddressInput,
  async (req, res) => {
    let ethService: EthService;
    try {
      if (req.query.chain) {
        ethService = createEthService(SERVICE_TYPE_WEB3, req.query.chain);
      } else {
        throw new Error(`missing chain parameter`);
      }

      const web3 = new Web3(ethService.data.rpcEndpoint);
      const balance = await web3.eth.getBalance(req.query.contractAddress);
      res.status(200);
      res.send(web3.utils.fromWei(web3.utils.toBN(balance), 'ether'));
    } catch (err) {
      logger.error(
        {
          err,
          ethService,
        },
        'Routes - generic - get-contract-balance',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  },
]);

router.post('/send-signed-transaction', async (req, res) => {
  const authToken = extractAuthTokenFromRequest(req);
  const idempotencyKey = req?.body?.idempotencyKey || uuidv4();

  // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
  // Otherwise we use the 'tenantId' from the authToken.
  const forceTenantId = req?.query?.forceTenantId as string;

  const { signedTx, tenantId, ethServiceType, chain, serviceName, serviceUrl } =
    req.body;
  const waitForReceipt = req.body.waitForReceipt
    ? req.body.waitForReceipt === 'true'
    : false;

  let chainKey: string;

  let ethService: EthService;
  try {
    if (tenantId && ethServiceType && chain) {
      ethService = createEthService(ethServiceType, chain);
    } else {
      throw new Error(`missing tenantId or ethServiceType or chain parameter`);
    }

    chainKey = extractChainKeyFromEthService(ethService);
  } catch (error) {
    res.status(error?.status || 500);
    res.json({ error: extractErrorMessage(error) });
  }

  if (ethService.type === SERVICE_TYPE_ORCHESTRATE) {
    const sendRawTxToOrchestrate = async () => {
      const orchestrateMessage: ISendRawRequest = {
        params: {
          raw: signedTx,
        },
        chain: chainKey,
      };
      const id = await orchestrateInstance.sendRawTransaction(
        orchestrateMessage,
        tenantId,
        serviceName,
        serviceUrl,
        undefined, // gasLimit was already set when tx got crafted
        false, // decorateTransaction
        forceTenantId,
        idempotencyKey,
        authToken,
      );
      return {
        txIdentifier: id,
      };
    };

    try {
      const response = await execRetry(sendRawTxToOrchestrate, 5, 3000, 1.5);
      res.status(200);
      res.json({ ...response, type: ethService.type });
    } catch (err) {
      logger.error(
        {
          err,
          signedTx,
          waitForReceipt,
          ethService,
        },
        'Routes - generic - send-signed-transaction - ORCHESTRATE',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  } else {
    try {
      const web3 = new Web3(ethService.data.rpcEndpoint);
      web3.eth
        .sendSignedTransaction(signedTx)
        .on('transactionHash', (hash) => {
          if (!waitForReceipt) {
            res.status(200);
            res.json({
              status: 'success',
              message: {
                type: ethService.type, // web3
                txIdentifier: hash,
                tx: signedTx,
              },
            });
          }
        })
        .on('receipt', (receipt: any) => {
          if (waitForReceipt) {
            res.status(200);
            res.json({
              status: 'success',
              message: {
                type: ethService.type, // web3
                txIdentifier: receipt.txHash,
                tx: receipt,
              },
            });
          }
        })
        .on('error', (error) => {
          throw error;
        });
    } catch (err) {
      logger.error(
        {
          err,
          signedTx,
          waitForReceipt,
          ethService,
        },
        'Routes - generic - send-signed-transaction - WEB3',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  }
});

router.get('/get-block-number', async (req, res) => {
  let ethService: EthService;
  try {
    if (req.query.chain) {
      ethService = createEthService(
        SERVICE_TYPE_WEB3,
        req.query.chain.toString(),
      );
    } else {
      throw new Error(`missing chain parameter`);
    }

    const web3 = new Web3(ethService.data.rpcEndpoint);
    const blockNumber = await web3.eth.getBlockNumber();
    res.status(200);
    res.send({
      blockNumber: blockNumber,
    });
  } catch (err) {
    logger.error(
      {
        err,
        ethService,
      },
      'Routes - generic - get-block-number',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

router.get('/get-transaction-receipt', async (req, res) => {
  let ethService: EthService;
  try {
    const { txHash } = req.query;

    if (req.query.chain) {
      ethService = createEthService(
        SERVICE_TYPE_WEB3,
        req.query.chain.toString(),
      );
    } else {
      throw new Error(`missing chain parameter`);
    }

    const web3 = new Web3(ethService.data.rpcEndpoint);
    const receipt = await web3.eth.getTransactionReceipt(txHash.toString());
    res.status(200);
    res.send({
      txIdentifier: receipt ? receipt.transactionHash : undefined,
      tx: receipt,
      type: 'web3',
    });
  } catch (err) {
    logger.error(
      {
        err,
        ethService,
      },
      'Routes - generic - get-transaction-receipt',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

router.post('/withdraw-all-ether-from-account', async (req, res) => {
  try {
    const authToken = extractAuthTokenFromRequest(req);
    const idempotencyKey = req?.body?.idempotencyKey || uuidv4();

    // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
    // Otherwise we use the 'tenantId' from the authToken.
    const forceTenantId = req?.query?.forceTenantId as string;

    const { account, withdrawalAddress, chain, tenantId } = req.body;

    let ethService: EthService;
    if (chain) {
      ethService = createEthService(SERVICE_TYPE_ORCHESTRATE, chain);
    } else {
      throw new Error('missing parameter: chainId');
    }

    if (!tenantId) {
      throw new Error('missing parameter: tenantId');
    }

    const chainKey: string = extractChainKeyFromEthService(ethService);

    if (
      !(
        withdrawalAddress &&
        withdrawalAddress.length === 42 &&
        withdrawalAddress.substring(0, 2) === '0x' &&
        withdrawalAddress !== ZERO_ADDRESS
      )
    ) {
      throw new Error(`${withdrawalAddress} is an invalid withdrawal address`);
    }

    const web3 = new Web3(ethService.data.rpcEndpoint);
    const balance = await web3.eth.getBalance(account);
    const gasPrice = await web3.eth.getGasPrice();
    const gas = 21000;

    const sendToOrchestrate = async () => {
      const orchestrateMessage: ITransferRequest = {
        params: {
          from: account,
          to: withdrawalAddress, // required
          value: (parseInt(balance) - gas * parseInt(gasPrice)).toString(),
          gas: gas.toString(),
          gasPrice: gasPrice,
          // gasPricePolicy: [optional] { priority: Priority.VeryLow | Priority.Low | Priority.Medium | Priority.High | Priority.VeryHigh }
        },
        chain: chainKey,
      };

      const id = await orchestrateInstance.transferEth(
        orchestrateMessage,
        tenantId,
        CodefiService.NONE, // serviceName,
        undefined, // serviceUrl
        undefined, // gasLimit is already defined
        false, // decorateTransaction
        forceTenantId,
        idempotencyKey,
        authToken,
      );
      return {
        txIdentifier: id,
      };
    };

    const response = await execRetry(sendToOrchestrate, 5, 3000, 1.5);
    res.status(200);
    res.json({ ...response, type: ethService.type });
  } catch (err) {
    logger.error(
      {
        err,
      },
      'Routes - generic - withdraw-all-ether-from-account - ORCHESTRATE',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

export default router;
