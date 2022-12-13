import { Injectable } from '@nestjs/common';

import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';

import { keys as TxKeys, TxStatus } from 'src/types/transaction';

import CacheService from 'src/utils/cache';

import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { keys as HookKeys, HookCallBack } from 'src/types/hook';
import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';
import { TxReceipt } from 'src/types/transaction/TxReceipt';
import { Transaction } from 'src/types/transaction';
import { WorkFlowsPreIssuanceService } from 'src/modules/v2WorkflowsDigitalasset/workflows.digitalasset.service/preIssuance';
import {
  HookFunctions,
  FunctionRule,
  functionRules,
} from 'src/types/smartContract';
import { OrderService } from 'src/modules/v2Order/order.service';

@Injectable()
export class HooksService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly workFlowsPreIssuanceService: WorkFlowsPreIssuanceService,
    private readonly transactionService: TransactionHelperService,
    private readonly tokenCreationService: TokenCreationService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * [Trigger hook function once blockchain transaction has been validated]
   *
   * Every time a transaction is sent on the blockchain, we have to face the problem of
   * asynchronysm.
   * Indeed, the serie of operations to be executed is stoped during the validation
   * of the transaction on the blockchain.
   * A typical serie of operations would be:
   *  1) Check authentication
   *  2) Fetch all off-chain data in the different databases (e.g. user data, asset metadata, etc.)
   *  3) According to fetched data, check IAM access rights (IAM middleware) and check
   *    business process execution possibility (Process middleware)
   *  4) Save the context in a database
   *  5) Send the transaction on the blockchain
   *
   *    ==> THE SERIE OF OPERATIONS IS STOPED UNTIL TRANSACTION validation <==
   *
   *  6) Retrieve the context from the database
   *  7) Update the off-chain data in the different databases where required
   *  8) Notify the user (per email or other)
   *
   * The step 6) gets launched once the transaction listener detects the transaction
   * receipt, when transaction gets validated.
   * Since the transaction listener is an other micro-service (currently the api-smart-contract),
   * it needs to trigger what we call the "hook function", in order to continue the
   * serie of operations where it had stopped, e.g. at step 6).
   *
   * At step 6), e.g. here, the context is retrieved thanks to the transaction identifier:
   * - Either the transaction hash
   * - Or the Orchestrate transaction ID
   *
   */
  async triggerHookFunction(
    tenantId: string,
    txIdentifier: string,
    txHash: string, // txHash is also available in txReceipt
    txReceipt: TxReceipt,
    txStatus: TxStatus,
    errors: any,
  ) {
    try {
      this.logger.info(
        {},
        `\n****** TRIGGER HOOK FUNCTION (${txStatus}) ******\n`,
      );
      this.logger.info(
        {},
        `Hook for transaction with tenant ${tenantId}, identifier ${txIdentifier}, txHash ${txHash} and receipt ${
          txReceipt ? JSON.stringify(txReceipt) : 'undefined'
        }. Errors: ${errors ? `${JSON.stringify(errors)}` : 'undefined'}\n`,
      );

      // USELESS CHECK - BUT WE KEEP IT FOR NOW TO ENSURE THE TXHASH INDEED THE SAME - START //
      if (
        txReceipt &&
        txReceipt[TxKeys.RECEIPT_TX_HASH] &&
        txHash !== txReceipt[TxKeys.RECEIPT_TX_HASH]
      ) {
        ErrorService.throwError(
          `no single source of truth for txHash: ${txHash} is different from ${
            txReceipt[TxKeys.RECEIPT_TX_HASH]
          }`,
        );
      }
      // USELESS CHECK - END //

      // -------------- Extract contract address from txReceipt -------------
      let contractAddress: string;
      if (txReceipt && txReceipt[TxKeys.RECEIPT_CONTRAT_ADDRESS]) {
        contractAddress = txReceipt[TxKeys.RECEIPT_CONTRAT_ADDRESS];
      }

      // -------------- Retrieve txEnvelope -------------
      const identifierOrTxHash = txIdentifier || txHash;
      if (!identifierOrTxHash) {
        ErrorService.throwError(
          'missing input parameters (neither txIdentifier nor txHash)',
        );
      }
      const txEnvelope: Transaction =
        await this.transactionService.retrieveTransaction(
          tenantId,
          identifierOrTxHash,
          true, // withContext
          false, // withTxReceipt
          false, // shallReturnResponse
        );

      if (!txEnvelope && txStatus === TxStatus.FAILED) {
        // In case we call Smart-Cotnract-API to send a transaction and code execution
        // fails before transactions get sent:
        // - we never receive the transactionId in Smart-Contract-Api's response (which remains pending)
        // - we never create corresponding 'txEnvelope' in the DB
        // Consequently, it makes no sense to try executing the hook function in such
        // cases. It's expected behaviour to have no transaction in the DB.
        // ==> We shall stop code execution now and 'return'.
        this.logger.error(
          {},
          `Transaction with ID ${identifierOrTxHash} was not found in the DB (it probably failed in Orchestrate before being created in the DB).\n`,
        );
        return;
      }

      // -------------- Perform checks on txEnvelope -------------
      if (!(txEnvelope && txEnvelope[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID])) {
        ErrorService.throwError(
          `transaction with identifier ${identifierOrTxHash} was not found in database of Codefi transactions (${
            txEnvelope
              ? `no ${TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID}`
              : 'no transaction'
          })`,
        );
      }
      if (txEnvelope[TxKeys.ENV_STATUS] !== TxStatus.PENDING) {
        ErrorService.throwError(
          `transaction (${identifierOrTxHash}) found in DB, but already ${
            txEnvelope[TxKeys.ENV_STATUS]
          }`,
        );
      }
      if (!txEnvelope[TxKeys.ENV_CONTEXT]) {
        ErrorService.throwError(
          `transaction (${identifierOrTxHash}) found in DB, but associated hookCallbackData was not stored`,
        );
      }
      const hookCallbackData: HookCallBack = txEnvelope[TxKeys.ENV_CONTEXT];

      this.logger.info(
        {},
        `Pending transaction + associated hookCallbackData found (${
          txEnvelope[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]
        }) in DB\n`,
      );

      // ---- Clear caller's cache memory to refresh balances on the UI ----
      if (hookCallbackData[HookKeys.USERS_TO_REFRESH]) {
        hookCallbackData[HookKeys.USERS_TO_REFRESH].map(
          (userToRefreshId: string) => {
            CacheService.clearCacheForUser(userToRefreshId);
          },
        );
      }

      // -------------- Save contract address -------------
      const newHookCallbackData: HookCallBack = {
        ...hookCallbackData,
        [HookKeys.CONTRACT_ADDRESS]: contractAddress,
        [HookKeys.TX_ERRORS]: errors,
      };

      // -------------- Retrieve hook function name -------------
      let hookFunctionName: HookFunctions;
      const functionName = hookCallbackData[HookKeys.FUNCTION_NAME];
      if (functionRules[functionName]) {
        hookFunctionName =
          functionRules[functionName][FunctionRule.HOOK_FUNCTION];
      } else {
        ErrorService.throwError(
          `shall never happen: unknown function name in hook callback data (${functionName})`,
        );
      }

      // -------------- Check hook function name -------------
      if (!hookFunctionName) {
        ErrorService.throwError('no hookfunction found in context');
      } else if (hookFunctionName === HookFunctions.NONE) {
        ErrorService.throwError(
          `no hook function to triggger for this function (${functionName})`,
        );
      }

      // -------------- Update transaction status -------------
      await this.transactionService.updateTransaction(
        tenantId,
        identifierOrTxHash,
        TxStatus.PROCESSING,
        newHookCallbackData, // contains contract address
        txHash, // Save tx Hash in off-chain DB
      );

      // -------------- Trigger hook function -------------
      let response: any;
      switch (hookFunctionName) {
        case HookFunctions.TOKEN_CREATION_HOOK: {
          response = await this.tokenCreationService.tokenCreation_hook(
            tenantId,
            newHookCallbackData,
            identifierOrTxHash,
            txStatus,
          );
          break;
        }
        case HookFunctions.ACTION_HOOK: {
          response = await this.transactionService.action_hook(
            tenantId,
            newHookCallbackData,
            identifierOrTxHash,
            txStatus,
          );
          break;
        }
        case HookFunctions.ORDER_HOOK: {
          response = await this.orderService.order_hook(
            tenantId,
            newHookCallbackData,
            identifierOrTxHash,
            txStatus,
          );
          break;
        }
        case HookFunctions.DISTRIBUTE_HOOK: {
          response = await this.workFlowsPreIssuanceService.distribute_hook(
            tenantId,
            newHookCallbackData,
            identifierOrTxHash,
            txStatus,
          );
          break;
        }
        default: {
          ErrorService.throwError(
            `hookfunction was found in context (${hookFunctionName}), but doesn't belong to the list of registered hook functions`,
          );
          break;
        }
      }

      // -------------- Retrieve email functions names -------------
      // const emailFunctionsNames = newHookCallbackData[HookKeys.EMAIL_FUNCTIONS];

      // -------------- Trigger emails functions -------------
      // to be added if needed not used for the moment

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'triggering hook function',
        'triggerHookFunction',
        false,
        500,
      );
    }
  }
}
