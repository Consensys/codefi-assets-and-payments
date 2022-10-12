import express from 'express';
import triggerHookFunction from '../web/hookTrigger';
import { logger } from '../logging/logger';
import extractErrorMessage from '../utils/errorMessage';

const router = express.Router();

/* Trigger hook function. */
router.post('/', async (req, res) => {
  const {
    txIdentifier,
    tenantId,
    txHash,
    txReceipt,
    serviceUrl,
    txStatus,
    errors,
  } = req.body;

  try {
    const response = await triggerHookFunction(
      txIdentifier,
      tenantId,
      txHash,
      txReceipt,
      serviceUrl,
      txStatus,
      errors,
    );
    res.status(200);
    res.json({
      hook:
        response.data.hookFunctionToTriggerAfterTxValidation +
        ' function triggered successfuly',
    });
  } catch (err) {
    logger.error(
      {
        err,
        txIdentifier,
        txHash,
        txReceipt,
        txStatus,
      },
      'Routes - Hook Trigger',
    );
    res.status(err?.status || 500);
    res.json({ error: extractErrorMessage(err) });
  }
});

export default router;
