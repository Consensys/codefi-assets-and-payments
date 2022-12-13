import { forwardRef, Inject, Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';
import { NestJSPinoLogger } from '@consensys/observability';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { keys as TxKeys, TxStatus, Transaction } from 'src/types/transaction';
import { keys as TokenKeys, Token } from 'src/types/token';
import {
  TokenIdentifierEnum,
  TransactionEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

import { keys as HookKeys, HookCallBack } from 'src/types/hook';

import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { LedgerTransaction } from 'src/types/transaction/LedgerTransaction';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { OrchestrateTransaction } from 'src/types/transaction/OrchestrateTransaction';
import { Web3Transaction } from 'src/types/transaction/Web3Transaction';
import { keys as NetworkKeys } from 'src/types/network';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import {
  FunctionName,
  FunctionRule,
  functionRules,
  SmartContract,
  TokenCategory,
} from 'src/types/smartContract';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import {
  SendSignedTransactionOutput,
  DeleteTransactionOutput,
  ResendTransactionOutput,
} from '../transaction.dto';
import { TokenState } from 'src/types/states';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { UserHelperService } from 'src/modules/v2User/user.service';
import { KycCheckService } from 'src/modules/v2KYCCheck/kyc.check.service';
import { EntityType } from 'src/types/entity';
import { LinkService } from 'src/modules/v2Link/link.service';
import {
  keys as WorkflowInstanceKeys,
  WorkflowInstance,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { keys as HTLCKeys } from 'src/types/htlc';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { Config } from 'src/types/config';
import { keys as SupplyKeys, InitialSupply } from 'src/types/supply';
import {
  endProtectionAgainstRaceCondition,
  protectAgainstRaceCondition,
} from 'src/utils/race';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import { WorkFlowsSecondaryTradeService } from 'src/modules/v2WorkflowsDigitalasset/workflows.digitalasset.service/secondaryTrade';

@Injectable()
export class TransactionHelperService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly userHelperService: UserHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly partitionService: PartitionService,
    private readonly kycCheckHelperService: KycCheckService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    @Inject(forwardRef(() => TokenTxHelperService))
    private readonly tokenTxHelperService: TokenTxHelperService,
    @Inject(forwardRef(() => WorkFlowsSecondaryTradeService))
    private readonly workFlowsSecondaryTradeService: WorkFlowsSecondaryTradeService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * [Send a signed transaction]
   *
   * This function is used when the transaction is signed on front-end side
   *
   */
  async sendSignedTransaction(
    tenantId: string,
    userId: string,
    txIdentifier: string,
    signedTx: string,
    authToken: string,
  ): Promise<SendSignedTransactionOutput> {
    try {
      /******** Fetch user ********/
      const user: User = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      /******** Fetch tx envelope to retrieve hookCallBackData ********/
      const transaction: Transaction = await this.retrieveTransaction(
        tenantId,
        txIdentifier,
        true, // withContext - We're interested by retrieving the tx context here
        false, // withTxReceipt
        true, // shallReturnResponse
      );

      const hookCallBackData: HookCallBack = transaction[TxKeys.ENV_CONTEXT];

      /********* Verify user who tries to send the transaction is indeed the user who crafter it *******/
      if (transaction[TxKeys.ENV_SIGNER_ID] !== userId) {
        ErrorService.throwError(
          `the transaction sender ${userId} is different from the transaction crafter ${
            transaction[TxKeys.ENV_SIGNER_ID]
          }`,
        );
      }

      /******** Retrieve chainID from Ethereum service ********/
      let networkKey: string;
      if (
        hookCallBackData[HookKeys.ETH_SERVICE] &&
        hookCallBackData[HookKeys.ETH_SERVICE][EthServiceKeys.DATA] &&
        hookCallBackData[HookKeys.ETH_SERVICE][EthServiceKeys.DATA][
          NetworkKeys.KEY
        ]
      ) {
        // new way
        networkKey =
          hookCallBackData[HookKeys.ETH_SERVICE][EthServiceKeys.DATA][
            NetworkKeys.KEY
          ];
        this.logger.info({}, `Recovered networkKey: ${networkKey}\n`);
      } else {
        ErrorService.throwError('failed trying to recover networkKey');
      }

      /******** Retrieve signer/wallet address and check is still belongs to the user ********/
      if (
        !(
          hookCallBackData[HookKeys.WALLET] &&
          hookCallBackData[HookKeys.WALLET][WalletKeys.WALLET_ADDRESS] &&
          this.walletService.checkWalletAddressIsValidAndRetrieveWalletIndex(
            user[UserKeys.WALLETS],
            hookCallBackData[HookKeys.WALLET][WalletKeys.WALLET_ADDRESS],
          )
        )
      ) {
        ErrorService.throwError('failed trying to recover signerAddress');
      }

      /******** Create Ethereum service ********/
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.ORCHESTRATE, // required by 'sendSignedTx'
          undefined, // chainId - TO BE DEPRECATED (replaced by 'networkKey')
          networkKey,
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      /******** Send signed transaction ********/
      const response: ApiSCResponse = await this.apiSCCallService.sendSignedTx(
        tenantId,
        signedTx,
        ethService,
        authToken,
      );
      this.logger.info(
        {},
        `SendSignedTx response: ${JSON.stringify(response)}\n`,
      );

      /******** Save new transaction identifier provided by Orchestrate **************/
      if (response[ApiSCResponseKeys.TX_IDENTIFIER]) {
        await this.transactionService.updateTransaction(
          tenantId,
          TransactionEnum.identifier,
          txIdentifier,
          undefined,
          undefined,
          undefined,
          response[ApiSCResponseKeys.TX_IDENTIFIER], // Save new transaction identifier provided by Orchestrate
        );
      }

      return {
        ...response,
        message: `Signed transaction ${txIdentifier} successfully sent`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending signed transaction',
        'sendSignedTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Resend transaction]
   */
  async resendTransaction(
    tenantId: string,
    userId: string,
    callerId: string,
    txIdentifier: string,
    authToken: string,
  ): Promise<ResendTransactionOutput> {
    try {
      const [user, transaction, config]: [User, Transaction, Config] =
        await Promise.all([
          this.apiEntityCallService.fetchEntity(tenantId, userId, true),
          this.retrieveTransaction(
            tenantId,
            txIdentifier,
            true, // withContext - We're interested by retrieving the tx context here
            false, // withTxReceipt
            true, // shallReturnResponse
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      const hookCallBackData: HookCallBack = transaction[TxKeys.ENV_CONTEXT];

      /********* Verify user who tries to send the transaction is indeed the user who crafter it *******/
      if (transaction[TxKeys.ENV_SIGNER_ID] !== userId) {
        ErrorService.throwError(
          `the transaction sender ${userId} is different from the transaction crafter ${
            transaction[TxKeys.ENV_SIGNER_ID]
          }`,
        );
      }

      /******** Retrieve signer/wallet address and check is still belongs to the user ********/
      if (
        !(
          hookCallBackData[HookKeys.WALLET] &&
          hookCallBackData[HookKeys.WALLET][WalletKeys.WALLET_ADDRESS] &&
          this.walletService.checkWalletAddressIsValidAndRetrieveWalletIndex(
            user[UserKeys.WALLETS],
            hookCallBackData[HookKeys.WALLET][WalletKeys.WALLET_ADDRESS],
          ) >= 0
        )
      ) {
        ErrorService.throwError('failed trying to recover signerAddress');
      }

      /******** Retrieve call path+body+ethService ********/
      let callPath: string;
      let callBody: object;
      let ethService: EthService;
      if (
        !(
          hookCallBackData[HookKeys.CALL] &&
          hookCallBackData[HookKeys.CALL][HookKeys.CALL_PATH]
        )
      ) {
        ErrorService.throwError(
          'transaction call path is not stored in transaction envelope',
        );
      } else if (
        !(
          hookCallBackData[HookKeys.CALL] &&
          hookCallBackData[HookKeys.CALL][HookKeys.CALL_BODY]
        )
      ) {
        ErrorService.throwError(
          'transaction call body is not stored in transaction envelope',
        );
      } else if (
        !(
          hookCallBackData[HookKeys.ETH_SERVICE] &&
          hookCallBackData[HookKeys.ETH_SERVICE][EthServiceKeys.TYPE]
        )
      ) {
        ErrorService.throwError(
          'ethService type is not stored in transaction envelope',
        );
      } else {
        callPath = hookCallBackData[HookKeys.CALL][HookKeys.CALL_PATH];
        callBody = hookCallBackData[HookKeys.CALL][HookKeys.CALL_BODY];
        ethService = hookCallBackData[HookKeys.ETH_SERVICE];
      }

      /******** Retrieve first workflow instance ********/
      const fetchedWorkflowInstance1: WorkflowInstance =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          hookCallBackData[HookKeys.ACTION][WorkflowInstanceKeys.ID],
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          hookCallBackData[HookKeys.ACTION][WorkflowInstanceKeys.TYPE],
          undefined, // otherWorkflowType
          true,
        );
      /******** Retrieve second workflow instance (if existing) ********/
      let fetchedWorkflowInstance2: WorkflowInstance;
      if (hookCallBackData[HookKeys.ACTION2]) {
        fetchedWorkflowInstance2 =
          await this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.id,
            hookCallBackData[HookKeys.ACTION2][WorkflowInstanceKeys.ID],
            undefined, // idempotencyKey
            undefined,
            undefined,
            undefined,
            undefined, // entityType
            hookCallBackData[HookKeys.ACTION2][WorkflowInstanceKeys.TYPE],
            undefined, // otherWorkflowType
            true,
          );
      }

      /******** Resend transaction ********/
      const response: ApiSCResponse = await this.apiSCCallService.resendTx(
        tenantId,
        user, // signer
        callPath,
        callBody,
        ethService,
        authToken,
        config,
      );
      this.logger.info({}, `ResendTx response: ${JSON.stringify(response)}\n`);
      const transactionId = response[ApiSCResponseKeys.TX_IDENTIFIER];

      /******* Update first workflow instance in DB ********/
      const currentData1 = fetchedWorkflowInstance1[WorkflowInstanceKeys.DATA];
      const updatedWorkflowInstance1: WorkflowInstance =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          fetchedWorkflowInstance1[WorkflowInstanceKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          {
            ...fetchedWorkflowInstance1,
            [WorkflowInstanceKeys.DATA]: this.addPendingTxToData(
              currentData1,
              currentData1[WorkflowInstanceKeys.DATA__TX_SIGNER_ID], // no change
              currentData1[WorkflowInstanceKeys.DATA__WALLET_USED], // no change
              currentData1[WorkflowInstanceKeys.DATA__NEXT_STATUS], // no change
              transactionId, // new --> replacement
              hookCallBackData[HookKeys.ETH_SERVICE], // no change
              response[ApiSCResponseKeys.TX_SERIALIZED], // new --> replacement
              response[ApiSCResponseKeys.TX], // new --> replacement
            ),
          },
        );

      /******* Update second workflow instance in DB (if existing) ********/
      let updatedWorkflowInstance2: WorkflowInstance;
      if (hookCallBackData[HookKeys.ACTION2]) {
        const currentData2 =
          fetchedWorkflowInstance2[WorkflowInstanceKeys.DATA];
        updatedWorkflowInstance2 =
          await this.workflowService.updateWorkflowInstance(
            tenantId,
            fetchedWorkflowInstance2[WorkflowInstanceKeys.ID],
            undefined, // No state transition triggered before transaction validation
            undefined, // No state transition triggered before transaction validation
            undefined, // No state transition triggered before transaction validation
            {
              ...fetchedWorkflowInstance2,
              [WorkflowInstanceKeys.DATA]: this.addPendingTxToData(
                currentData2,
                currentData2[WorkflowInstanceKeys.DATA__TX_SIGNER_ID], // no change
                currentData2[WorkflowInstanceKeys.DATA__WALLET_USED], // no change
                currentData2[WorkflowInstanceKeys.DATA__NEXT_STATUS], // no change
                transactionId, // new --> replacement
                hookCallBackData[HookKeys.ETH_SERVICE], // no change
                response[ApiSCResponseKeys.TX_SERIALIZED], // new --> replacement
                response[ApiSCResponseKeys.TX], // new --> replacement
              ),
            },
          );
      }

      /******** Save new transaction data in off-chain DB (incl. hookCallbackData) **************/
      const asyncTx: boolean = this.ethHelperService.checkAsyncTransaction(
        hookCallBackData[HookKeys.ETH_SERVICE],
      );
      const newTransaction: Transaction =
        await this.transactionService.createTransaction(
          tenantId,
          userId,
          callerId,
          transactionId,
          {
            ...hookCallBackData,
            [HookKeys.ACTION]: updatedWorkflowInstance1,
            [HookKeys.ACTION2]: updatedWorkflowInstance2,
          },
          asyncTx,
        );

      return {
        transaction: newTransaction,
        message: `Transaction ${txIdentifier} successfully resent. New transaction ID is ${transactionId}.`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'resending transaction',
        'resendTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Send KYC-compliant cetificate-based transaction]
   *
   * The certificate-based transaction is sent only in case the sender and recipient are verified (KYC).
   */
  async sendTokenTransaction(
    tenantId: string,
    callerId: string,
    signer: User, // CAUTION: 'signer' user absolutely needs to be the owner of the 'signerAddress' defined in the body
    tokenCategory: TokenCategory,
    issuer: User,
    token: Token,
    config: Config,
    tokenSender: User,
    tokenRecipient: User,
    originTokenState: TokenState,
    originTokenClass: string,
    destinationTokenState: TokenState,
    destinationTokenClass: string,
    tokenName: SmartContract,
    functionName: FunctionName,
    body: any,
    ethService: EthService,
    authToken: string,
    tenantConfig: Config,
  ): Promise<ApiSCResponse> {
    try {
      // Check if token sender and token recipient are linked properly to the token
      await Promise.all([
        tokenSender
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              tokenSender[UserKeys.USER_ID],
              UserType.INVESTOR,
              token[TokenKeys.TOKEN_ID],
              EntityType.TOKEN,
              originTokenClass,
            )
          : undefined,
        tokenRecipient
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              tokenRecipient[UserKeys.USER_ID],
              UserType.INVESTOR,
              token[TokenKeys.TOKEN_ID],
              EntityType.TOKEN,
              destinationTokenClass,
            )
          : undefined,
      ]);

      // Check token minting/transfer/burn is valid according to token class + state + sender and recipient KYC verification
      await this.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName,
        issuer,
        token,
        config,
        tokenSender,
        tokenRecipient,
        originTokenState,
        originTokenClass,
        destinationTokenState,
        destinationTokenClass,
      );

      // Send the transaction
      let response: ApiSCResponse;
      if (tokenCategory === TokenCategory.HYBRID) {
        const contractName: SmartContract = functionRules[functionName][
          FunctionRule.IS_EXTENSION_FUNCTION
        ]
          ? SmartContract.ERC1400_TOKENS_VALIDATOR
          : tokenName;
        response = await this.apiSCCallService.sendCertificateBasedTx(
          callerId,
          tenantId,
          signer,
          tokenCategory,
          contractName,
          functionName,
          body,
          ethService,
          authToken,
          tenantConfig,
        );
      } else {
        response = await this.apiSCCallService.sendSimpleTx(
          tenantId,
          signer,
          tokenCategory,
          tokenName,
          functionName,
          body,
          ethService,
          authToken,
          tenantConfig,
        );
      }

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending token transaction',
        'sendTokenTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve transaction]
   * Returns the transaction stored in DB.
   */
  async retrieveTransaction(
    tenantId: string,
    txIdentifier: string, // Can be an orchestrateId, a txHash or a ledger transaction identifier
    withContext: boolean,
    withTxReceipt: boolean,
    shallReturnResponse: boolean,
  ): Promise<Transaction> {
    try {
      // Try to retrieve the transaction in different ways
      const txEnvelopes1: Array<Transaction> =
        await this.transactionService.retrieveTransactions(
          tenantId,
          TransactionEnum.identifier,
          txIdentifier,
        );
      const txEnvelopes2: Array<Transaction> =
        await this.transactionService.retrieveTransactions(
          tenantId,
          TransactionEnum.txHash,
          txIdentifier,
        );

      let txEnvelope: Transaction;
      if (txEnvelopes1.length > 0) {
        txEnvelope = txEnvelopes1[0];
      } else if (txEnvelopes2.length > 0) {
        txEnvelope = txEnvelopes2[0];
      }

      let userId: string;
      let txReceipt;
      if (txEnvelope) {
        // Retrieve userId in transaction context
        if (txEnvelope[TxKeys.ENV_SIGNER_ID]) {
          userId = txEnvelope[TxKeys.ENV_SIGNER_ID];
        }

        // Retrieve transaction receipt thanks to txHash found in context
        if (
          withTxReceipt &&
          txEnvelope[TxKeys.ENV_IDENTIFIER_TX_HASH] &&
          this.checkTxHashFormat(txEnvelope[TxKeys.ENV_IDENTIFIER_TX_HASH]) &&
          txEnvelope[TxKeys.ENV_CONTEXT] &&
          txEnvelope[TxKeys.ENV_CONTEXT][HookKeys.ETH_SERVICE]
        ) {
          const retrievedTxHash: string =
            txEnvelope[TxKeys.ENV_IDENTIFIER_TX_HASH];
          const retrievedEthService: EthService =
            txEnvelope[TxKeys.ENV_CONTEXT][HookKeys.ETH_SERVICE];
          txReceipt = await this.apiSCCallService.getTxReceipt(
            retrievedTxHash,
            retrievedEthService,
          );
          txEnvelope[TxKeys.ENV_RECEIPT] = txReceipt;
        }
      } else if (withTxReceipt && this.checkTxHashFormat(txIdentifier)) {
        txReceipt = await this.apiSCCallService.getTxReceipt(
          txIdentifier,
          txEnvelope[TxKeys.ENV_CONTEXT][HookKeys.ETH_SERVICE],
        );
      } else {
        if (shallReturnResponse) {
          ErrorService.throwError(
            `transaction with id ${txIdentifier} was not found`,
          );
        } else {
          return undefined;
        }
      }

      txEnvelope[TxKeys.ENV_USER_ID] =
        withContext && userId ? userId : undefined;
      txEnvelope[TxKeys.ENV_RECEIPT] = txReceipt;

      txEnvelope[TxKeys.ENV_TRANSACTION_ID] =
        txEnvelope[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID]; // FIXME: 'identifier' is deprecated and supposed to be replaced by 'transactionId'

      return txEnvelope;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving transaction',
        'retrieveTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve all transactions]
   * Returns all transaction stored in DB, for a givent tenant.
   */
  async retrieveAllTransactions(tenantId: string): Promise<Transaction[]> {
    try {
      // Try to retrieve the transaction in different ways
      const transactions: Array<Transaction> =
        await this.transactionService.retrieveTransactions(tenantId);
      return transactions;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving all transactions',
        'retrieveAllTransactions',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve transaction]
   * Returns the transaction stored in DB.
   */
  async updateTransaction(
    tenantId: string,
    txIdentifier: string,
    newStatus: TxStatus,
    newHookCallBack?: HookCallBack,
    newTxHash?: string,
  ): Promise<Transaction> {
    try {
      const txEnvelope: Transaction = await this.retrieveTransaction(
        tenantId,
        txIdentifier,
        true, // withContext - We're interested by retrieving the tx context here
        false, // withTxReceipt
        true, // shallReturnResponse
      );

      if (!(txEnvelope && txEnvelope[TxKeys.ENV_ID])) {
        ErrorService.throwError(
          `transaction with identifier ${txIdentifier} can not be updated, it was not found in the database of Codefi transactions (${
            txEnvelope ? `no ${TxKeys.ENV_ID}` : 'no transaction'
          })`,
        );
      }

      const updatedTxEnvelope: Transaction =
        await this.transactionService.updateTransaction(
          tenantId,
          TransactionEnum.index,
          txEnvelope[TxKeys.ENV_ID],
          newStatus,
          newHookCallBack,
          newTxHash ? newTxHash : undefined,
          undefined,
        );

      return updatedTxEnvelope;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating transaction',
        'updateTransaction',
        false,
        500,
      );
    }
  }

  /**
   * [Delete transaction]
   * Deletes the transaction stored in off-chain DB.
   */
  async deleteTransaction(
    tenantId: string,
    transactionId: string,
  ): Promise<DeleteTransactionOutput> {
    try {
      const transactions: Transaction[] =
        await this.transactionService.retrieveTransactions(
          tenantId,
          TransactionEnum.identifier,
          transactionId,
        );

      if (transactions.length > 1) {
        ErrorService.throwError(
          `shall never happen: more than one transaction found for transaction with ID ${transactionId} (${transactions.length} instead)`,
        );
      } else if (transactions.length === 0) {
        ErrorService.throwError(
          `shall never happen: no transaction found for transaction with ID ${transactionId}`,
        );
      }

      const transaction = transactions[0];
      await this.transactionService.deleteTransaction(
        tenantId,
        transaction[TxKeys.ENV_ID],
      );

      return {
        message: `Transaction ${transactionId} deleted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deleting transaction',
        'deleteTransaction',
        false,
        500,
      );
    }
  }

  /**
   * Add all information about a transaction to an object's metadata
   *
   * Example of objects: an action, a token
   */
  addPendingTxToData(
    data: any,
    txSignerId: string,
    walletUsed: Wallet,
    nextStatus: string,
    transactionId: string,
    ethService: EthService,
    txSerialized: string,
    rawTransaction:
      | OrchestrateTransaction
      | LedgerTransaction
      | Web3Transaction,
  ): any {
    try {
      const udpatedData: any = {
        ...data,
        [WorkflowInstanceKeys.DATA__TX_SIGNER_ID]: txSignerId,
        [WorkflowInstanceKeys.DATA__WALLET_USED]: walletUsed,
        [WorkflowInstanceKeys.DATA__NEXT_STATUS]: nextStatus,
        [WorkflowInstanceKeys.DATA__TRANSACTION]: {
          ...(data ? data[WorkflowInstanceKeys.DATA__TRANSACTION] : {}),
          [nextStatus]: {
            [WorkflowInstanceKeys.DATA__TRANSACTION__STATUS]: TxStatus.PENDING,
            [WorkflowInstanceKeys.DATA__TRANSACTION__ID]: transactionId,
          },
        },
      };

      if (
        ethService &&
        ethService[EthServiceKeys.TYPE] !== EthServiceType.LEDGER
      ) {
        return {
          ...udpatedData,
          [WorkflowInstanceKeys.DATA__IS_LEDGER_TX]: false,
        };
      } else if (
        ethService &&
        ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER &&
        txSerialized
      ) {
        return {
          ...udpatedData,
          [WorkflowInstanceKeys.DATA__IS_LEDGER_TX]: true,
          txSerialized, // Used by the Ledger to sign the raw transaction
          rawTransaction, // Used by the end-to-end tests to sign the raw transaction (ethers.js library)
          ethService,
        };
      } else {
        ErrorService.throwError(
          'raw transaction shall be provided in case of raw transaction',
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding pending tx to data',
        'addPendingTxToData',
        false,
        500,
      );
    }
  }

  /**
   * Update information about a transaction inside an object's metadata
   *
   * Example of objects: an action, a token
   */
  updateTxStatusInData(
    data: any,
    nextStatus: string,
    transactionId: string,
    txStatus: TxStatus,
  ): any {
    try {
      return {
        ...data,
        [WorkflowInstanceKeys.DATA__TRANSACTION]: {
          ...data[WorkflowInstanceKeys.DATA__TRANSACTION],
          [nextStatus]: {
            [WorkflowInstanceKeys.DATA__TRANSACTION__STATUS]: txStatus,
            [WorkflowInstanceKeys.DATA__TRANSACTION__ID]: transactionId,
          },
        },
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating tx status in data',
        'updateTxStatusInData',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve information about a transaction ID inside an object's metadata
   */
  retrieveTxIdInData(data: any, state: string): string {
    try {
      let transactionId: string;
      if (
        data &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION] &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION][state] &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION][state][
          WorkflowInstanceKeys.DATA__TRANSACTION__ID
        ]
      ) {
        transactionId =
          data[WorkflowInstanceKeys.DATA__TRANSACTION][state][
            WorkflowInstanceKeys.DATA__TRANSACTION__ID
          ];
      }

      return transactionId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving tx ID in data',
        'retrieveTxIdInData',
        false,
        500,
      );
    }
  }

  /**
   * Retrieve information about a transaction status inside an object's metadata
   */
  retrieveTxStatusInData(data: any, state: string): TxStatus {
    try {
      let transactionStatus: TxStatus;
      if (
        data &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION] &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION][state] &&
        data[WorkflowInstanceKeys.DATA__TRANSACTION][state][
          WorkflowInstanceKeys.DATA__TRANSACTION__STATUS
        ]
      ) {
        transactionStatus =
          data[WorkflowInstanceKeys.DATA__TRANSACTION][state][
            WorkflowInstanceKeys.DATA__TRANSACTION__STATUS
          ];
      }

      return transactionStatus;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving tx status in data',
        'retrieveTxStatusInData',
        false,
        500,
      );
    }
  }

  /**
   * Check string has the same format as a transaction hash
   *
   * Ex: 0xb3f2c5190f0456f55f8658ffb5b4d103778fed99a8c095113db644dbc7ecc821
   */
  checkTxHashFormat(txHash: string): boolean {
    try {
      if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking tx hash format',
        'checkTxHashFormat',
        false,
        500,
      );
    }
  }

  async checkTxComplianceBatch(
    tenantId: string,
    tokenCategory: TokenCategory,
    functionType: FunctionName,
    issuer: User,
    token: Token,
    config: Config,
    tokenSenders: Array<User>,
    tokenRecipients: Array<User>,
    originTokenState: TokenState,
    originTokenClass: string,
    destinationTokenState: TokenState,
    destinationTokenClass: string,
  ): Promise<boolean> {
    try {
      let checkSenders: boolean =
        functionRules[functionType][FunctionRule.SENDER_CHECK_REQUIRED];
      let checkRecipients: boolean =
        functionRules[functionType][FunctionRule.RECIPIENT_CHECK_REQUIRED];

      /********** Check token states & token classes validity ************/
      if (tokenCategory === TokenCategory.HYBRID) {
        if (checkSenders) {
          this.partitionService.checkTokenStateIsValid(originTokenState);
          this.partitionService.checkTokenClassIsValid(token, originTokenClass);
        }

        if (checkRecipients) {
          this.partitionService.checkTokenStateIsValid(destinationTokenState);
          this.partitionService.checkTokenClassIsValid(
            token,
            destinationTokenClass,
          );
          this.userHelperService.checkUsersCanHoldTokensBatch(tokenRecipients);
        }
      }

      /******************** Check if KYC can be bypassed for this token **********************/
      let checkKyc = true;
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__BYPASS_KYC_CHECKS]
      ) {
        checkKyc = false;
      }

      /******************** Check if KYC can be bypassed for this token state (only for hybrid tokens) **********************/

      if (tokenCategory === TokenCategory.HYBRID) {
        if (
          checkSenders &&
          !this.partitionService.checkTokenStateRequiresKyc(originTokenState)
        ) {
          checkSenders = false;
        }
        if (
          checkRecipients &&
          !this.partitionService.checkTokenStateRequiresKyc(
            destinationTokenState,
          )
        ) {
          checkRecipients = false;
        }
      }

      /******************** Check KYC **********************/
      if (checkKyc) {
        await Promise.all([
          checkSenders
            ? this.kycCheckHelperService.checkKycValidationsForTokenOperationBatch(
                tenantId,
                tokenSenders,
                issuer,
                token,
                config,
                originTokenClass,
                'senders',
              )
            : true,
          checkRecipients
            ? this.kycCheckHelperService.checkKycValidationsForTokenOperationBatch(
                tenantId,
                tokenRecipients,
                issuer,
                token,
                config,
                destinationTokenClass,
                'recipients',
              )
            : true,
        ]);
      }

      /******************** Check token transferability (only for hybrid tokens) **********************/

      // In case there is a transfer of property of the token, we need to check if the
      // state of the token allows ownership change.
      const tokensAreTransferable: boolean =
        functionRules[functionType][FunctionRule.OWNERSHIP_TRANSFER];
      if (
        tokenCategory === TokenCategory.HYBRID &&
        tokensAreTransferable &&
        !this.partitionService.checkTokenStateAllowsTransfer(originTokenState)
      ) {
        ErrorService.throwError(
          `ownership of ${originTokenState} tokens can not be updated (forbidden behaviour)`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking batch tx compliance',
        'checkTxComplianceBatch',
        false,
        500,
      );
    }
  }

  /**
   * [Check transaction compliance, e.g. if users are verified (KYC)]
   *
   * Checks that are performed in this function:
   *    --> check the state belongs to the list of authorized states
   *    --> check the class belongs to the list of authorized classes
   *
   *  If there is an initial token holder (tokenSender):
   *    If the origin or destination token state require kyc verification
   *       --> check the initial token holder verified his kyc
   *
   *  If there is a destination token holder (tokenRecipient):
   *    If the origin or destination token state require kyc verification
   *       --> check the destination token holder verified his kyc
   *    --> check the destination token holder is of type INVESTOR or INVESTOR (not ISSUER)
   *
   *  If the initial token holder is different from the destination token holder:
   *    --> check if the initial token state and the destination token state allow token holder to change
   *
   */
  async checkTxCompliance(
    tenantId: string,
    tokenCategory: TokenCategory,
    functionName: FunctionName,
    issuer: User,
    token: Token,
    config: Config,
    tokenSender: User,
    tokenRecipient: User,
    originTokenState: TokenState,
    originTokenClass: string,
    destinationTokenState: TokenState,
    destinationTokenClass: string,
  ): Promise<boolean> {
    try {
      let checkSender: boolean =
        functionRules[functionName][FunctionRule.SENDER_CHECK_REQUIRED];
      let checkRecipient: boolean =
        functionRules[functionName][FunctionRule.RECIPIENT_CHECK_REQUIRED];

      /********** Check token states & token classes validity ************/
      if (tokenCategory === TokenCategory.HYBRID) {
        if (checkSender) {
          this.partitionService.checkTokenStateIsValid(originTokenState);
          this.partitionService.checkTokenClassIsValid(token, originTokenClass);
        }

        if (checkRecipient) {
          this.partitionService.checkTokenStateIsValid(destinationTokenState);
          this.partitionService.checkTokenClassIsValid(
            token,
            destinationTokenClass,
          );
          this.userHelperService.checkUserCanHoldTokens(tokenRecipient);
        }
      }

      /******************** Check if KYC can be bypassed for this token **********************/
      let checkKyc = true;
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__BYPASS_KYC_CHECKS]
      ) {
        checkKyc = false;
      }

      /******************** Check if KYC can be bypassed for this token state (only for hybrid tokens) **********************/

      if (tokenCategory === TokenCategory.HYBRID) {
        if (
          checkSender &&
          !this.partitionService.checkTokenStateRequiresKyc(originTokenState)
        ) {
          checkSender = false;
        }
        if (
          checkRecipient &&
          !this.partitionService.checkTokenStateRequiresKyc(
            destinationTokenState,
          )
        ) {
          checkRecipient = false;
        }
      }

      /******************** Check KYC **********************/
      if (checkKyc) {
        await Promise.all([
          checkSender
            ? this.kycCheckHelperService.checkKycValidationForTokenOperation(
                tenantId,
                tokenSender,
                issuer,
                token,
                config,
                originTokenClass,
                'Sender',
              )
            : true,
          checkRecipient
            ? this.kycCheckHelperService.checkKycValidationForTokenOperation(
                tenantId,
                tokenRecipient,
                issuer,
                token,
                config,
                destinationTokenClass,
                'Recipient',
              )
            : true,
        ]);
      }

      /******************** Check token transferability (only for hybrid tokens) **********************/

      // In case there is a transfer of property of the token, we need to check if the
      // state of the token allows ownership change.
      const tokensAreTransferable: boolean =
        functionRules[functionName][FunctionRule.OWNERSHIP_TRANSFER];
      if (
        tokenCategory === TokenCategory.HYBRID &&
        tokensAreTransferable &&
        !this.partitionService.checkTokenStateAllowsTransfer(originTokenState)
      ) {
        ErrorService.throwError(
          `ownership of ${originTokenState} tokens can not be updated (forbidden behaviour)`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking tx compliance',
        'checkTxCompliance',
        false,
        500,
      );
    }
  }

  /**
   * [Switch action + transaction state as validated]
   *
   * Hook function called once a token transaction is validated.
   */
  async action_hook(
    tenantId: string,
    hookCallbackData: HookCallBack,
    identifierOrTxHash: string,
    txStatus: TxStatus,
  ): Promise<{
    tokenAction: Action;
    created: boolean;
    updated: boolean;
    transactionId: string;
    message: string;
  }> {
    try {
      this.logger.info(
        {},
        `****** TX RECEIPT (action hook) (${txStatus}) ******\n`,
      );

      const response: {
        workflowInstance: WorkflowInstance;
        transactionId: string;
        message: string;
      } = await this.workflowInstance_hook(
        tenantId,
        hookCallbackData,
        identifierOrTxHash,
        txStatus,
      );

      return {
        tokenAction: response.workflowInstance,
        created: true,
        updated: true,
        transactionId: response.transactionId,
        message: response.message,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calling token action callback hook function',
        'action_hook',
        false,
        500,
      );
    }
  }

  /**
   * [Switch workflow instance + transaction state as validated]
   *
   * Hook function called once a token transaction is validated.
   */
  async workflowInstance_hook(
    tenantId: string,
    hookCallbackData: HookCallBack,
    identifierOrTxHash: string,
    txStatus: TxStatus,
  ): Promise<{
    workflowInstance: WorkflowInstance;
    transactionId: string;
    message: string;
  }> {
    try {
      const funcName = 'workflowInstance_hook';
      const funcParams = {
        tenantId,
        tokenId: hookCallbackData[HookKeys.TOKEN_ID],
      };

      if (hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION]) {
        // RACE CONDITION DANGER
        // This function is sometimes called in parallel, when we mint multiple initial
        // supplies in parallel.
        // For this reason, we add a protection against race conditions.
        await protectAgainstRaceCondition(funcName, funcParams, 100, 1000, 1);
      }

      if (!hookCallbackData[HookKeys.ACTION]) {
        ErrorService.throwError(
          `missing workflow instance (still called 'action') in hook callback data for transaction ${identifierOrTxHash}`,
        );
      }

      const updateToNextState: boolean = txStatus === TxStatus.VALIDATED;

      const updatedData: any = this.updateTxStatusInData(
        hookCallbackData[HookKeys.ACTION][WorkflowInstanceKeys.DATA],
        hookCallbackData[HookKeys.NEXT_STATE],
        identifierOrTxHash,
        txStatus,
      );

      const newWorkflowInstance: WorkflowInstance = {
        ...hookCallbackData[HookKeys.ACTION],
        data: updatedData,
      };

      const updatedWorkflowInstance: WorkflowInstance =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newWorkflowInstance[WorkflowInstanceKeys.ID],
          updateToNextState
            ? hookCallbackData[HookKeys.FUNCTION_NAME]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState
            ? hookCallbackData[HookKeys.TYPE_FUNCTION_USER]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState ? hookCallbackData[HookKeys.NEXT_STATE] : undefined, // Only update to next state if transaction is a success
          newWorkflowInstance,
        );

      const updatedTx: Transaction = await this.updateTransaction(
        tenantId,
        identifierOrTxHash,
        txStatus,
      );

      const transactionId: string =
        updatedTx[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID];

      /*******************************************************************************************/
      /*******************************************************************************************/
      // In some exceptional case, additional actions are scheduled after receipt of a blockchain transaction.
      // This can be detected thanks to SCHEDULED_ADDITIONAL_ACTION flag set to true in HookCallBackData.
      // When that happens, we fetch the token and check its flags, to deduce what kind of additional action
      // shall be executed.
      // Since we don't want the hook to fail because of the scheduled additional action, we embed
      // it in a try/catch.
      if (hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION]) {
        try {
          const token = await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            hookCallbackData[HookKeys.TOKEN_ID],
            true,
            undefined,
            undefined,
            true,
          );

          if (
            token &&
            token[TokenKeys.DATA] &&
            token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_SUPPLIES] &&
            hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION] ===
              FunctionName.UPDATE_TOKEN_DATA &&
            hookCallbackData[HookKeys.FUNCTION_NAME] === FunctionName.MINT
          ) {
            // SCHEDULED ADDITIONAL ACTION - OPTION 1
            // Check if this corresponds to a minting of initial supplies.
            // If so, we'll update token's data, for information for the end user.
            try {
              this.logger.info(
                {},
                `****** Scheduled automated action: receipt of minting transaction ${transactionId} ******\n`,
              );
              const initialSupplies: Array<InitialSupply> =
                token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_SUPPLIES];
              let updateToken: boolean;
              if (initialSupplies && initialSupplies.length > 0) {
                const updatedInitialSupplies: Array<InitialSupply> =
                  initialSupplies.map((initialSupply: InitialSupply) => {
                    if (
                      initialSupply[SupplyKeys.TRANSACTION_ID] === transactionId
                    ) {
                      updateToken = true;
                      return {
                        ...initialSupply,
                        [SupplyKeys.TRANSACTION_STATUS]: txStatus,
                      };
                    } else {
                      return initialSupply;
                    }
                  });

                if (updateToken) {
                  this.logger.info(
                    {},
                    `****** Scheduled automated action: update token ${
                      hookCallbackData[HookKeys.TOKEN_ID]
                    } after receipt of initialSupply minting transaction ${transactionId} (status: ${txStatus}) ******\n`,
                  );
                  // Save updated initialSupplies in token data
                  const tokenUpdates: Token = {
                    ...token,
                    [TokenKeys.DATA]: {
                      ...token[TokenKeys.DATA],
                      [TokenKeys.DATA__INITIAL_SUPPLIES]:
                        updatedInitialSupplies, // Override initial supplies with
                    },
                  };

                  // Here we call "updateToken" because we don't want the first call to fail in case there's an issue with miniting of initialSupplies (which can potentially occur..)
                  await this.apiMetadataCallService.updateTokenInDB(
                    tenantId,
                    tokenUpdates[TokenKeys.TOKEN_ID],
                    tokenUpdates,
                  );
                }
              }
            } catch (error) {
              this.logger.info(
                {},
                `****** Scheduled automated action: error updating token ${
                  hookCallbackData[HookKeys.TOKEN_ID]
                } after receipt of initialSupply minting transaciton ${transactionId} (status: ${txStatus}) ******\n`,
              );
            }
          } else if (
            ((token &&
              token[TokenKeys.DATA] &&
              token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_RETIREMENT]) ||
              hookCallbackData[HookKeys.ACTION][WorkflowInstanceKeys.DATA][
                WorkflowInstanceKeys.DATA__AUTOMATE_RETIREMENT
              ]) &&
            hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION] ===
              FunctionName.UPDATE_STATE &&
            (hookCallbackData[HookKeys.FUNCTION_NAME] ===
              FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER ||
              hookCallbackData[HookKeys.FUNCTION_NAME] ===
                FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER)
          ) {
            // SCHEDULED ADDITIONAL ACTION - OPTIONE 2
            // Check if this corresponds to a retirement.
            // If so, we'll send a transaction to update token's state to 'collateral',
            // immediately after trade order settlement.
            const order: Order = hookCallbackData[HookKeys.ACTION];
            try {
              this.logger.info(
                {},
                `****** Scheduled automated action:  retire ${
                  order[WorkflowInstanceKeys.QUANTITY]
                } tokens for user ${
                  order[WorkflowInstanceKeys.RECIPIENT_ID]
                } with token id: ${
                  hookCallbackData[HookKeys.TOKEN_ID]
                } ******\n`,
              );

              await this.tokenTxHelperService.forceUpdateState(
                tenantId,
                undefined, // idempotencyKey
                hookCallbackData[HookKeys.TOKEN_CATEGORY],
                hookCallbackData[HookKeys.CALLER_ID],
                hookCallbackData[HookKeys.USER_ID], // issuerId
                order[WorkflowInstanceKeys.RECIPIENT_ID],
                hookCallbackData[HookKeys.TOKEN_ID],
                TokenState.ISSUED,
                order[WorkflowInstanceKeys.ASSET_CLASS],
                TokenState.COLLATERAL,
                order[WorkflowInstanceKeys.QUANTITY],
                order[WorkflowInstanceKeys.PRICE],
                undefined, // optional data
                hookCallbackData[HookKeys.TYPE_FUNCTION_USER],
                hookCallbackData[HookKeys.SEND_NOTIFICATION],
                hookCallbackData[HookKeys.AUTH_TOKEN],
              );
            } catch (error) {
              const errorMessage = error?.message ? error.message : error;
              this.logger.info(
                {},
                `****** Error retiring ${
                  order[WorkflowInstanceKeys.QUANTITY]
                } tokens for user ${
                  order[WorkflowInstanceKeys.RECIPIENT_ID]
                } with token id: ${
                  hookCallbackData[HookKeys.TOKEN_ID]
                }: ${errorMessage} ******\n`,
              );
            }
          } else if (
            token &&
            token[TokenKeys.DATA] &&
            token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_FORCE_BURN] &&
            hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION] ===
              FunctionName.FORCE_BURN &&
            (hookCallbackData[HookKeys.FUNCTION_NAME] ===
              FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER ||
              hookCallbackData[HookKeys.FUNCTION_NAME] ===
                FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER)
          ) {
            // SCHEDULED ADDITIONAL ACTION - OPTION 4
            // Check if this corresponds to a force burn BUY order tokens
            // If so, tokens need to be burnt after the settlement.
            const order: Order = hookCallbackData[HookKeys.ACTION];

            if (
              token[TokenKeys.DATA][
                TokenKeys.DATA__AUTOMATE_FORCE_BURN
              ].includes(order[WorkflowInstanceKeys.ORDER_SIDE])
            ) {
              try {
                this.logger.info(
                  {},
                  `****** Scheduled automated action:  retire ${
                    order[WorkflowInstanceKeys.QUANTITY]
                  } tokens for user ${
                    order[WorkflowInstanceKeys.RECIPIENT_ID]
                  } with token id: ${
                    hookCallbackData[HookKeys.TOKEN_ID]
                  } ******\n`,
                );

                await this.tokenTxHelperService.forceBurn(
                  tenantId,
                  undefined, // idempotencyKey
                  hookCallbackData[HookKeys.TOKEN_CATEGORY],
                  hookCallbackData[HookKeys.CALLER_ID],
                  hookCallbackData[HookKeys.USER_ID], // issuerId
                  order[WorkflowInstanceKeys.RECIPIENT_ID],
                  hookCallbackData[HookKeys.TOKEN_ID],
                  TokenState.ISSUED,
                  order[WorkflowInstanceKeys.ASSET_CLASS],
                  TokenState.COLLATERAL,
                  order[WorkflowInstanceKeys.QUANTITY],
                  order[WorkflowInstanceKeys.PRICE],
                  undefined, // optional data
                  hookCallbackData[HookKeys.TYPE_FUNCTION_USER],
                  hookCallbackData[HookKeys.SEND_NOTIFICATION],
                  hookCallbackData[HookKeys.AUTH_TOKEN],
                );
              } catch (error) {
                const errorMessage = error?.message ? error.message : error;
                this.logger.info(
                  {},
                  `****** Error retiring ${
                    order[WorkflowInstanceKeys.QUANTITY]
                  } tokens for user ${
                    order[WorkflowInstanceKeys.RECIPIENT_ID]
                  } with token id: ${
                    hookCallbackData[HookKeys.TOKEN_ID]
                  }: ${errorMessage} ******\n`,
                );
              }
            }
          } else if (
            hookCallbackData[HookKeys.ACTION]?.[WorkflowInstanceKeys.DATA]?.[
              WorkflowInstanceKeys.DATA__AUTOMATE_PAYMENT
            ] &&
            hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION] ===
              FunctionName.HOLD &&
            hookCallbackData[HookKeys.FUNCTION_NAME] ===
              FunctionName.HOLD_SECONDARY_TRADE_ORDER_DELIVERY
          ) {
            // Retrieve the latest order and grab the HTLC secret hash
            const order: Order =
              await this.workflowService.retrieveWorkflowInstances(
                tenantId,
                WorkflowInstanceEnum.id,
                hookCallbackData[HookKeys.ACTION][WorkflowInstanceKeys.ID],
                undefined, // idempotencyKey
                undefined,
                undefined,
                undefined,
                undefined, // entityType
                WorkflowType.ORDER,
                undefined, // otherWorkflowType
                true,
              );

            const htlcSecret =
              order[WorkflowInstanceKeys.DATA]?.[
                WorkflowInstanceKeys.DATA__DVP
              ]?.[WorkflowInstanceKeys.DATA__DVP__HTLC]?.[HTLCKeys.SECRET_HASH];

            const paymentTokenId =
              order[WorkflowInstanceKeys.DATA]?.[
                WorkflowInstanceKeys.DATA__DVP
              ]?.[WorkflowInstanceKeys.DATA__DVP__PAYMENT]?.[
                WorkflowInstanceKeys.DATA__DVP__PAYMENT__TOKEN_ID
              ];

            await this.tokenTxHelperService.hold(
              tenantId,
              undefined,
              TokenCategory.HYBRID,
              hookCallbackData[HookKeys.CALLER_ID],
              order[WorkflowInstanceKeys.RECIPIENT_ID], // investorId
              order[WorkflowInstanceKeys.USER_ID], // recipientId
              paymentTokenId, // tokenId,
              TokenState.ISSUED,
              order[WorkflowInstanceKeys.ASSET_CLASS],
              undefined, // tokenIdentifier
              order[WorkflowInstanceKeys.QUANTITY], // quantity
              order[WorkflowInstanceKeys.PRICE], // forcePrice
              24, // nbHoursBeforeExpiration
              htlcSecret,
              {
                [WorkflowInstanceKeys.DATA__AUTOMATE_PAYMENT]:
                  order[WorkflowInstanceKeys.DATA]?.[
                    WorkflowInstanceKeys.DATA__AUTOMATE_PAYMENT
                  ],
                [WorkflowInstanceKeys.DATA__ACCEPTED_ORDER_ID]:
                  order[WorkflowInstanceKeys.ID],
              }, //data
              UserType.INVESTOR, // typeFunctionUser
              hookCallbackData[HookKeys.AUTH_TOKEN],
            );
          } else if (
            hookCallbackData[HookKeys.ACTION]?.[WorkflowInstanceKeys.DATA]?.[
              WorkflowInstanceKeys.DATA__AUTOMATE_PAYMENT
            ] &&
            hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION] ===
              FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT &&
            hookCallbackData[HookKeys.FUNCTION_NAME] === FunctionName.HOLD
          ) {
            const investor = await this.apiEntityCallService.fetchEntity(
              tenantId,
              hookCallbackData[HookKeys.USER_ID],
              true,
            );
            const holdAction = hookCallbackData[HookKeys.ACTION];
            const orderId =
              holdAction?.[WorkflowInstanceKeys.DATA]?.[
                WorkflowInstanceKeys.DATA__ACCEPTED_ORDER_ID
              ];
            const sendNotification = true; //automate payment case will always have sendNotification as true
            const paymentHoldId =
              holdAction?.[WorkflowInstanceKeys.DATA]?.[
                WorkflowInstanceKeys.DATA__HOLD
              ]?.[WorkflowInstanceKeys.DATA__HOLD__HOLD_ID];

            await this.workFlowsSecondaryTradeService.holdTradeOrderPayment(
              tenantId,
              investor,
              orderId,
              paymentHoldId,
              undefined,
              sendNotification,
              hookCallbackData[HookKeys.AUTH_TOKEN],
            );
          }
        } catch (error) {
          this.logger.info(
            {},
            `****** Scheduled automated action: error fetching token ${
              hookCallbackData[HookKeys.TOKEN_ID]
            } after receipt of transaciton ${transactionId} (status: ${txStatus}) ******\n`,
          );
        }
      }
      /*******************************************************************************************/
      /*******************************************************************************************/

      if (hookCallbackData[HookKeys.SCHEDULED_ADDITIONAL_ACTION]) {
        // RACE CONDITION DANGER
        // Remove protection against race conditions.
        await endProtectionAgainstRaceCondition(funcName, funcParams);
      }

      return {
        workflowInstance: updatedWorkflowInstance,
        transactionId,
        message: `${
          txStatus === TxStatus.VALIDATED
            ? hookCallbackData[HookKeys.RESPONSE_VALIDATED]
            : hookCallbackData[HookKeys.RESPONSE_FAILURE]
        } (transaction ${txStatus})`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calling workflow instance callback hook function',
        'workflowInstance_hook',
        false,
        500,
      );
    }
  }
}
