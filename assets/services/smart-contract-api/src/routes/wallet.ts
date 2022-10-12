import express from 'express';
import Wallet from '../accounts/wallet';
import {
  SERVICE_TYPE_ORCHESTRATE,
  SERVICE_TYPE_WEB3,
} from '../config/constants';
import { EthServiceType } from '../types';
import { logger } from '../logging/logger';
import { extractAuthTokenFromRequest } from '../utils/authToken';
import extractErrorMessage from '../utils/errorMessage';

const router = express.Router();

/* Generate an ethereum wallet, fuel it and save it in the vault */
router.get('/create', async (req, res) => {
  try {
    const authToken = extractAuthTokenFromRequest(req);

    let ethServiceType: EthServiceType;

    // If 'forceTenantId' query param is defined, we generate a new access token for this query param.
    // Otherwise we use the 'tenantId' from the authToken.
    const forceTenantId = req?.query?.forceTenantId as string;

    if (
      req.query.ethServiceType === SERVICE_TYPE_WEB3 ||
      req.query.ethServiceType === SERVICE_TYPE_ORCHESTRATE
    ) {
      ethServiceType = req.query.ethServiceType;
    } else {
      throw new Error(`missing ethServiceType parameter`);
    }

    const walletHandler = new Wallet();
    const address = await walletHandler.create(
      ethServiceType,
      forceTenantId,
      req.query.chain as string,
      req.query.storeId as string,
      authToken,
    );
    res.status(200);
    res.json({
      address,
    });
  } catch (err) {
    logger.error(
      {
        err,
        query: req.query,
      },
      'Routes - Wallet - failed creating wallet',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

/* Retrive an ethereum wallet from the Vault (this endpoint is only used to know if an account still exists in the vault) */
router.get('/retrieve', async (req, res) => {
  try {
    const accountAddress = req.query.address as string;

    if (!accountAddress) {
      throw new Error(`missing address parameter`);
    }
    const walletHandler = new Wallet();
    const account = await walletHandler.retrieve(accountAddress);
    res.status(200);
    res.json({
      account,
    });
  } catch (err) {
    logger.error(
      {
        err,
        query: req.query,
      },
      'Routes - Wallet - failed retrieving wallet',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

export default router;
