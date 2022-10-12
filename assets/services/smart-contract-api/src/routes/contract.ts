import express from 'express';
import { formatAllArgs, createEthService } from '../utils/helper';
import Deployment from '../ethereum/deployment';

import {
  SERVICE_TYPE_ORCHESTRATE,
  SERVICE_TYPE_LEDGER,
} from '../config/constants';
import { EthService } from '../types';
import { logger } from '../logging/logger';

import { v4 as uuidv4 } from 'uuid';
import { extractAuthTokenFromRequest } from '../utils/authToken';
import extractErrorMessage from '../utils/errorMessage';

const router = express.Router();

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

/* Deploy contract. */
router.post('/deploy', async (req, res) => {
  const authToken = extractAuthTokenFromRequest(req);
  const idempotencyKey = req?.body?.idempotencyKey || uuidv4();

  // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
  // Otherwise we use the 'tenantId' from the authToken.
  const forceTenantId = req?.query?.forceTenantId as string;

  const {
    contractName,
    context,
    signerAddress,
    signerPrivateKey, // only for web3 transactions
    tenantId,
    serviceName,
    serviceUrl,
    ethServiceType,
    chain,
  } = req.body;

  const args = formatAllArgs(req.body.arguments);

  let ethService: EthService;
  try {
    if (ethServiceType && chain) {
      ethService = createEthService(ethServiceType, chain);
    } else {
      throw new Error(`missing ethServiceType or chain parameter`);
    }

    if (!tenantId) {
      throw new Error(`missing tenantId parameter`);
    }
  } catch (error) {
    res.status(error?.status || 500);
    res.json({ error: extractErrorMessage(error) });
  }

  const deployment = new Deployment(ethService.data.rpcEndpoint);

  if (ethService && ethService.type === SERVICE_TYPE_ORCHESTRATE) {
    try {
      const result = await deployment.deployWithOrchestrate(
        ethService,
        signerAddress,
        contractName,
        args,
        context,
        tenantId,
        serviceName,
        serviceUrl,
        forceTenantId,
        idempotencyKey,
        authToken,
      );
      res.status(200);
      res.json({
        ...result,
        type: ethService.type,
      });
      // })
    } catch (err) {
      logger.error(
        {
          err,
          contractName,
          signerAddress,
        },
        'Routes - Contract - deploy - ORCHESTRATE',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  } else if (ethService && ethService.type === SERVICE_TYPE_LEDGER) {
    try {
      const result = await deployment.createRawContractDeploymentTx(
        signerAddress,
        contractName,
        args,
        ethService,
      );
      res.status(200);
      res.json({
        ...result,
        type: ethService.type,
      });
    } catch (err) {
      logger.error(
        {
          err,
          contractName,
          signerAddress,
        },
        'Routes - Contract - deploy - RAW_TX',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  } else {
    try {
      const result = await deployment.deployWithWeb3(
        signerPrivateKey,
        contractName,
        args,
      );
      res.status(200);
      res.json({
        txIdentifier: result.txHash,
        tx: result,
        type: ethService.type,
      });
    } catch (err) {
      logger.error(
        {
          err,
          contractName,
          signerAddress,
          signerPrivateKey,
        },
        'Routes - Contract - deploy - WEB3',
      );
      res.status(err?.status || 500);
      res.json({ error: extractErrorMessage(err) });
    }
  }
});

export default router;
