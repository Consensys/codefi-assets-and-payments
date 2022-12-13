import express from 'express';
import { IChain } from 'pegasys-orchestrate';
import { extractTenantIdFromToken, decodeTokenFromRequest } from '@consensys/auth';
import extractErrorMessage from '../utils/errorMessage';
import orchestrateInstance from '../orchestrate';
import { logger } from '../logging/logger';
import { extractAuthTokenFromRequest } from '../utils/authToken';
import { NETWORKS, NETWORK_KEY } from '../config/constants';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    if (!NETWORKS) {
      throw new Error('networks are not defined in config/networks.js');
    }
    const defaultNetworkObject = NETWORKS.find((network) => {
      return network.key === NETWORK_KEY;
    });

    if (!(defaultNetworkObject && defaultNetworkObject.key)) {
      throw new Error(
        'default network is either invalid or not defined in .env file',
      );
    }

    let networksList;
    if (req.query.withOrchestrateChainId) {
      const chainsList: IChain[] = await orchestrateInstance.listAllChains();
      const chainsObject: {
        [name: string]: Array<{
          id: string;
          tenantId: string;
        }>;
      } = chainsList.reduce((map, chain: IChain) => {
        const chainArray = map[chain.name] || [];
        chainArray.push({
          id: chain.uuid,
          tenantId: chain.tenantID,
        });
        return { ...map, [chain.name]: chainArray };
      }, {});

      networksList = NETWORKS.map((network) => {
        if (chainsObject[network.key]) {
          return {
            ...network,
            ochestrateChains: chainsObject[network.key],
          };
        } else {
          return network;
        }
      });
    } else {
      networksList = NETWORKS;
    }

    // We filter mnemonics in the object we send back
    const config = {
      networks: networksList,
      defaultNetwork: defaultNetworkObject.key,
    };
    config.networks.map((network) => delete network.faucetMnemonic);
    res.status(200);
    res.json(config);
  } catch (err) {
    logger.error(
      {
        err,
        query: req.query,
      },
      'Routes - Networks - failed listing networks',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

/* Create a new faucet for the specified tenant Id */
router.post('/faucet', async (req, res) => {
  try {
    const authToken = extractAuthTokenFromRequest(req);

    // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
    // Otherwise we use the 'tenantId' from the authToken.
    const forceTenantId = req.body.forceTenantId as string;

    if (
      !req.body.networkKey &&
      !req.body.faucetWallet &&
      !req.body.authToken &&
      !req.body.tenantId &&
      !req.body.name
    ) {
      throw new Error(`missing required parameters`);
    }

    const registeredFaucet = await orchestrateInstance.createFaucet(
      req.body.faucetWallet,
      req.body.networkKey,
      req.body.tenantId,
      req.body.name,
      authToken,
      forceTenantId,
    );

    res.status(201);
    res.json(registeredFaucet);
  } catch (err) {
    let logMessage;
    if (err.response?.status === 409) {
      logMessage =
        'Routes - Networks - Faucet already exists for user tenant and specified network';
    } else {
      logMessage = 'Routes - Networks - failed creating faucet';
    }

    logger.error(
      {
        err,
        body: req.body,
      },
      logMessage,
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

/* Create a new faucet for the specified tenant Id */
router.get('/faucets', async (req, res) => {
  const authToken = extractAuthTokenFromRequest(req);
  try {
    if (!req.query.networkKey) {
      throw new Error(`missing required parameters`);
    }

    const decodedToken = decodeTokenFromRequest(req);
    const tenantId = extractTenantIdFromToken(decodedToken);

    const registeredFaucet = await orchestrateInstance.getFaucets(
      req.query.networkKey as string,
      tenantId,
      authToken,
    );

    res.status(201);
    res.json(registeredFaucet);
  } catch (err) {
    let logMessage;
    if (err.response?.status === 409) {
      logMessage =
        'Routes - Networks - Faucet already exists for user tenant and specified network';
    } else {
      logMessage = 'Routes - Networks - failed getting faucet';
    }

    logger.error(
      {
        err,
        body: req.body,
      },
      logMessage,
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

export default router;
