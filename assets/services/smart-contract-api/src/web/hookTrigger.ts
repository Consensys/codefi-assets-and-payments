import createAxiosClient from './axios';
import { logger } from '../logging/logger';
import execRetry from '../utils/retry';
import { TxStatus } from '../types';
import { ASSETS_API_SECRET, ASSETS_API_URL } from '../config/constants';

/*******************************************************************************
 *********************** FORMAT FOR HOOK CALL INPUT *****************************
 *
 * Format :
 * hookInput = {
 *   txIdentifier: Contains a unique identifier for the transaction
 *               (txHash for web3 or tx.id for Orchestrate tx or other identifier)
 *   type: orchestrate || ledger || web3
 *   tx: Contains any kind of information on the tx, depending on the 'type'.
 * }
 *
 *******************************************************************************
 ******************************************************************************/

/**
 * [Trigger hook function after transaction validation]
 * Format :
 * hookInput = {
 *   txIdentifier: _txIdentifier, // Only for Core-Stack transactions
 *   receipt: {
 *     contractAddress: _contractAddress,
 *     txHash: _txHash,
 *     ...
 * }
 }
 */
const triggerHookFunction = async (
  txIdentifier,
  tenantId,
  txHash,
  receipt,
  serviceUrl: string,
  txStatus: TxStatus,
  errors,
) => {
  try {
    const hookInput = {
      txHash,
      receipt,
      txIdentifier,
      tenantId,
      txStatus,
      errors,
    };

    let axiosConfig = {};
    if (ASSETS_API_SECRET) {
      axiosConfig = {
        headers: { 'x-assets-api-secret': ASSETS_API_SECRET },
      };
    }

    const retriedClosure = () => {
      return createAxiosClient(axiosConfig).post(
        `${serviceUrl || ASSETS_API_URL}/hooks`,
        hookInput,
      );
    };
    const response = await execRetry(retriedClosure, 3, 5000, 1);

    logger.debug(
      'Hook - successfully sent tx transaction receipt to Assets-API callback URL',
      {
        txIdentifier,
      },
    );

    return response;
  } catch (err) {
    logger.error(
      {
        err,
        txIdentifier,
        txHash,
        receipt,
        txStatus,
      },
      'hookTrigger - could not send transaction receipt to Assets-API callback URL',
    );
    throw err;
  }
};

export default triggerHookFunction;
