/**
 * ISSUANCE WORKFLOW
 *
 * -- On-chain action-workflow --
 *
 * The indirect issuance workflow allows to issue assets for an investor by:
 *  1) Creating locked tokens for the investor,
 *  2) Allowing the investor to reserve the created tokens by signing a contract,
 *  3) Allowing the issuer to unlock the tokens once payment/deposit has been validated.
 *
 *     createLocked   ________    reserveTokens  __________  releaseTokens  ________
 *         -->       | LOCKED |       -->       | RESERVED |       -->       | ISSUED |
 *      [issuer]      --------    [investor]     ----------     [issuer]      --------
 *
 *  4) [OPTIONAL] If required, a notary can send a receipt to the investor, at the end of the
 *     issuance process.
 *
 *  sendNotaryReceipt   ___________
 *         -->         | NOTARIZED |
 *      [notary]        -----------
 *
 */
import { NestJSPinoLogger } from '@consensys/observability';

import { TokenState } from 'src/types/states';

import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { TxStatus } from 'src/types/transaction';

import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';

import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';

import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';

import { keys as TokenKeys, Token } from 'src/types/token';
import { keys as HookKeys, HookCallBack } from 'src/types/hook';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { FunctionName, TokenCategory } from 'src/types/smartContract';
import { EntityType } from 'src/types/entity';

import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { IssuanceWorkflow } from 'src/old/constants/workflows/issuance';
import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { Injectable } from '@nestjs/common';
import {
  CreateLockedTokenOutput,
  ReserveLockedTokenOutput,
  ReleaseReservedTokenOutput,
  SendReceiptOutput,
  DestroyUnreservedTokenOutput,
} from '../workflows.digitalasset.dto';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { Transaction } from 'src/types/transaction';
import { keys as TxKeys } from 'src/types/transaction';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { WorkflowType } from 'src/types/workflow/workflowInstances';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ActionService } from 'src/modules/v2Action/action.service';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.ISSUANCE;

@Injectable()
export class WorkFlowsIndirectIssuanceService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly transactionHelperService: TransactionHelperService,
    private readonly balanceService: BalanceService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly configService: ConfigService,
    private readonly navService: NavService,
    private readonly actionHelperService: ActionService,
  ) {}

  /**
   * [Issue locked tokens for an investor]
   *
   * This function can only be called by the issuer of the asset.
   * It starts a new action-workflow (issuance).
   * It allows the issuer to create locked tokens for an investor, who'll then have
   * the possibility to unlock them by signing a contract + sending a bank deposit
   * to pay for the tokens.
   * It starts a new user-entity-link-workflow (kyc) for the investor/vehicle if required.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - None.
   *
   * On-chain:
   *  - Transaction sent: "issueByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: locked.
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: LOCKED
   */
  async createLockedTokens(
    tenantId: string,
    idempotencyKey: string,
    tokenId: string,
    investorId: string,
    issuerId: string,
    callerId: string,
    quantity: number,
    forcePrice: number,
    tokenClass: string,
    data: string,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<CreateLockedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.CREATE_LOCKED;
      const tokenState: TokenState = TokenState.LOCKED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const [
        issuer,
        investor,
        token,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Action, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuerId,
          UserType.ISSUER,
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ACTION,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const nav: NAV =
        await this.navService.retrieveAppropriateNAVForAssetClass(
          tenantId,
          token,
          tokenCategory === TokenCategory.HYBRID ? tokenClass : undefined,
        );

      const [newQuantity, newAmount]: [number, number] =
        this.actionHelperService.craftQuantityAndAmount(
          undefined, // orderType
          quantity,
          undefined, // price
          token,
          nav,
          forcePrice,
        );

      const issuanceMessage = `Creation of ${newQuantity} locked token(s), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'locked';
      if (actionWithSameKey) {
        // Order was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${issuanceMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createLockedTokens
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createLockedTokens
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
        );

      let investorWallet: Wallet = this.walletService.extractWalletFromUser(
        investor,
        investor[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          investor,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityUser
          token, // entityToken
          tokenClass,
          investorWallet,
        );
      const investorTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        investorWallet = this.walletService.extractWalletFromUserEntityLink(
          investor,
          investorTokenLink,
        );
      }

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          issuerWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      const body: any = this.tokenTxHelperService.craftMintBody(
        tokenCategory,
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        tokenClass,
        undefined, // tokenIdentifier
        newQuantity,
        undefined, // tokenUri
      );

      const mintingResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer,
          token,
          config,
          undefined, // tokenSender
          investor, // tokenRecipient
          undefined, // originTokenState
          undefined, // originTokenClass
          tokenState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // createLockedTokens
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = mintingResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const issuanceWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextState,
          transactionId,
          ethService,
          mintingResponse[ApiSCResponseKeys.TX_SERIALIZED],
          mintingResponse[ApiSCResponseKeys.TX],
        ),
      };

      const tokenCreationAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          investor[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          undefined, // recipientId
          undefined, // brokerId
          undefined, // agentId
          issuanceWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          IssuanceWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuerId, investorId],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${issuanceMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${issuanceMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${issuanceMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: mintingResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: mintingResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: mintingResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: tokenCreationAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: issuerId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        issuerId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: tokenCreationAction,
          created: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response = await this.transactionHelperService.action_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return response;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating locked tokens',
        'createLockedTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Reserve the tokens (at legal agreement signature)]
   *
   * This function can only be called by the investor.
   * It can only be called for an action-workflow (issuance) in state LOCKED.
   * It allows the investor to reserve locked tokens (at legal agreement signature).
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - The token owner needs to be validated (either kyc workflow finalized OR allowListed).
   *
   * On-chain:
   *  - Transaction sent: "operatorTransferByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: reserved.
   *
   * Off-chain state machine:
   *  - Initial state: LOCKED
   *  - Destination state: RESERVED
   */
  async reserveTokens(
    tenantId: string,
    investorId: string,
    callerId: string,
    actionId: string,
    quantity: number,
    documentId: string,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<ReserveLockedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.RESERVE;
      const originTokenState: TokenState = TokenState.LOCKED;
      const destinationTokenState: TokenState = TokenState.RESERVED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const fetchedAction: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(actionId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          undefined, // otherWorkflowType
          true,
        );

      const [issuer, investor, token, investorTokenLink, config]: [
        User,
        User,
        Token,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          fetchedAction[ActionKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          UserType.INVESTOR,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
          fetchedAction[ActionKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // ==> Step1: Perform several checks before sending the transaction

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (investorId !== investor[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided userId (${investorId}) is not the user of the tokenAction (${
            fetchedAction[ActionKeys.USER_ID]
          })`,
        );
      }

      const amountToReserve: number = quantity
        ? quantity
        : fetchedAction[ActionKeys.QUANTITY];
      if (quantity > fetchedAction[ActionKeys.QUANTITY]) {
        throw new Error(
          `quantity (${quantity}) higher than number of available tokens (${
            fetchedAction[ActionKeys.QUANTITY]
          })`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory, // hybrid
        functionName, // reserveTokens
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        originTokenState, // originTokenState
        fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
        destinationTokenState, // destinationTokenState
        fetchedAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
      );

      const reservationMessage = `Reservation of ${amountToReserve} locked token(s), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'reserved';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        fetchedAction[ActionKeys.DATA],
        targetState,
      );
      if (
        fetchedAction[ActionKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Tokens reservation has been triggered, return token action without updating it (idempotency)
        return {
          tokenAction: fetchedAction,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            fetchedAction[ActionKeys.DATA],
            targetState,
          ),
          message: `${reservationMessage} was already done (tx ${txStatus})`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        fetchedAction[ActionKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // reserveTokens
      );

      // ==> Step2: Send the transaction

      const investorWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          investor,
          investorTokenLink,
        );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        investorWallet,
        token,
        originTokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        quantity,
        true,
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          investorWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      const body = this.tokenTxHelperService.craftUpdateStateBody(
        token,
        investorWallet,
        investorWallet,
        originTokenState,
        destinationTokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        amountToReserve,
      );

      const updateStateResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          investor, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          investor, // tokenRecipient
          originTokenState, // originTokenState
          fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
          destinationTokenState, // destinationTokenState
          fetchedAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // reserveTokens
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        updateStateResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          fetchedAction[ActionKeys.DATA],
          investor[UserKeys.USER_ID],
          investorWallet,
          nextState,
          transactionId,
          ethService,
          updateStateResponse[ApiSCResponseKeys.TX_SERIALIZED],
          updateStateResponse[ApiSCResponseKeys.TX],
        ),
        [ActionKeys.DATA__REMAINING]:
          fetchedAction[ActionKeys.QUANTITY] - amountToReserve,
      };

      const newAction = {
        ...fetchedAction,
        [ActionKeys.DOCUMENT_ID]: documentId, // Add documentId to action
        [ActionKeys.DATA]: updatedData,
      };

      const updatedAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          fetchedAction[ActionKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newAction,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          investorId,
          issuer[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${reservationMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${reservationMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${reservationMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            updateStateResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            updateStateResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: updateStateResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: investorId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        investorId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: updatedAction,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response: ReserveLockedTokenOutput =
          await this.transactionHelperService.action_hook(
            tenantId,
            hookCallbackData,
            transactionId,
            TxStatus.VALIDATED,
          );
        return response;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reserving tokens',
        'reserveTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Release tokens reserved by investor (once bank deposit is received)]
   *
   * This function can only be called by the issuer of the token.
   * It can only be called for a action-workflow (issuance) in state RESERVED.
   * It allows the issuer to unlock the investor's tokens by validating
   * the investor's bank deposit.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - The token owner needs to be validated (either kyc workflow finalized OR allowListed).
   *
   * On-chain:
   *  - Transaction sent: "operatorTransferByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: issued.
   *
   * Off-chain state machine:
   *  - Initial state: RESERVED
   *  - Destination state: ISSUED
   */
  async releaseTokens(
    tenantId: string,
    actionId: string,
    issuerId: string,
    callerId: string,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<ReleaseReservedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.RELEASE;
      const originTokenState: TokenState = TokenState.RESERVED;
      const destinationTokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const fetchedAction: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(actionId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          undefined, // otherWorkflowType
          true,
        );

      const [issuer, investor, token, investorTokenLink, config]: [
        User,
        User,
        Token,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          fetchedAction[ActionKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          UserType.INVESTOR,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
          fetchedAction[ActionKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const issuerTokenLink: Link =
        await this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuer[UserKeys.USER_ID],
          UserType.ISSUER,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
        );

      // ==> Step1: Perform several checks before sending the transaction

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // releaseTokens
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        originTokenState, // originTokenState
        fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
        destinationTokenState, // destinationTokenState
        fetchedAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
      );

      const amountRemaining: number =
        fetchedAction[ActionKeys.DATA][ActionKeys.DATA__REMAINING];
      const amountToRelease =
        fetchedAction[ActionKeys.QUANTITY] - amountRemaining;

      const releaseMessage = `Release of ${amountToRelease} reserved token(s), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'issued';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        fetchedAction[ActionKeys.DATA],
        targetState,
      );
      if (
        fetchedAction[ActionKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Tokens release has been triggered, return token action without updating it (idempotency)
        return {
          tokenAction: fetchedAction,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            fetchedAction[ActionKeys.DATA],
            targetState,
          ),
          message: `${releaseMessage} was already done (tx ${txStatus})`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        fetchedAction[ActionKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // releaseTokens
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
        );

      const investorWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          investor,
          investorTokenLink,
        );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        investorWallet,
        token,
        originTokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        amountToRelease,
        true,
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          issuerWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      const body = this.tokenTxHelperService.craftUpdateStateBody(
        token,
        issuerWallet,
        investorWallet,
        originTokenState,
        destinationTokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        amountToRelease,
      );

      const updateStateResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          investor, // tokenRecipient
          originTokenState, // originTokenState
          fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
          destinationTokenState, // destinationTokenState
          fetchedAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // releaseTokens
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        updateStateResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          fetchedAction[ActionKeys.DATA],
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextState,
          transactionId,
          ethService,
          updateStateResponse[ApiSCResponseKeys.TX_SERIALIZED],
          updateStateResponse[ApiSCResponseKeys.TX],
        ),
      };

      const newAction = {
        ...fetchedAction,
        [ActionKeys.DATA]: updatedData,
      };

      const updatedAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newAction[ActionKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newAction,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuerId,
          investor[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${releaseMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${releaseMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${releaseMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            updateStateResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            updateStateResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: updateStateResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: newAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: issuerId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        issuerId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: updatedAction,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response: ReleaseReservedTokenOutput =
          await this.transactionHelperService.action_hook(
            tenantId,
            hookCallbackData,
            transactionId,
            TxStatus.VALIDATED,
          );
        return response;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'releasing tokens',
        'releaseTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Destroy tokens which have not been reserved by investor]
   *
   * This function can only be called by the issuer of the token.
   * It can only be called for a action-workflow (issuance) in state ISSUED.
   * It allows the issuer to destroy the investor's tokens which have not been reserved.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - None
   *
   * On-chain:
   *  - Transaction sent: "operatorRedeemByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: issued.
   *
   * Off-chain state machine:
   *  - Initial state: ISSUED
   *  - Destination state: ISSUED
   */
  async destroyTokens(
    tenantId: string,
    actionId: string,
    issuerId: string,
    callerId: string,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<DestroyUnreservedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.DESTROY;
      const tokenState: TokenState = TokenState.LOCKED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const fetchedAction: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(actionId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          undefined, // otherWorkflowType
          true,
        );

      const [issuer, investor, token, investorTokenLink, config]: [
        User,
        User,
        Token,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          fetchedAction[ActionKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          UserType.INVESTOR,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
          fetchedAction[ActionKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const issuerTokenLink: Link =
        await this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuer[UserKeys.USER_ID],
          UserType.ISSUER,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
        );

      // ==> Step1: Perform several checks before sending the transaction

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // releaseTokens
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        tokenState, // originTokenState
        fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
        undefined, // destinationTokenState
        undefined, // destinationTokenClass
      );

      const amountRemaining: number = fetchedAction[ActionKeys.DATA][
        ActionKeys.DATA__REMAINING
      ]
        ? fetchedAction[ActionKeys.DATA][ActionKeys.DATA__REMAINING]
        : 0;

      const destroyMessage = `Destruction of ${amountRemaining} locked token(s), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'finalized';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        fetchedAction[ActionKeys.DATA],
        targetState,
      );
      if (
        fetchedAction[ActionKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Tokens destruction has been triggered, return token action without updating it (idempotency)
        return {
          tokenAction: fetchedAction,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            fetchedAction[ActionKeys.DATA],
            targetState,
          ),
          message: `${destroyMessage} was already done (tx ${txStatus})`,
        };
      }

      // FIXME: action to be added in Workflow-API
      await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        fetchedAction[ActionKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // destroyTokens
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
        );

      const investorWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          investor,
          investorTokenLink,
        );

      if (amountRemaining <= 0) {
        ErrorService.throwError('no tokens left to destroy');
      }

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        investorWallet,
        token,
        tokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        amountRemaining,
        true,
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          issuerWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      const body = this.tokenTxHelperService.craftForceBurnBody(
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        fetchedAction[ActionKeys.ASSET_CLASS],
        amountRemaining,
      );

      const forceBurnResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          undefined, // tokenRecipient
          tokenState, // originTokenState
          fetchedAction[ActionKeys.ASSET_CLASS], // originTokenClass
          undefined, // destinationTokenState
          undefined, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // destroyTokens
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = forceBurnResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          fetchedAction[ActionKeys.DATA],
          issuer[UserKeys.USER_ID],
          issuerWallet,
          'finalized', // FIXME: state to be added in Workflow-API
          transactionId,
          ethService,
          forceBurnResponse[ApiSCResponseKeys.TX_SERIALIZED],
          forceBurnResponse[ApiSCResponseKeys.TX],
        ),
        [ActionKeys.DATA__REMAINING]: 0,
      };

      const newAction = {
        ...fetchedAction,
        [ActionKeys.DATA]: updatedData,
      };

      const updatedAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newAction[ActionKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newAction,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuerId,
          investor[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: 'finalized', // FIXME: state to be added in Workflow-API
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${destroyMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${destroyMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${destroyMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: forceBurnResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: forceBurnResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: destroyMessage[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: issuerId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        issuerId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: updatedAction,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response: ReleaseReservedTokenOutput =
          await this.transactionHelperService.action_hook(
            tenantId,
            hookCallbackData,
            transactionId,
            TxStatus.VALIDATED,
          );
        return response;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'destroying tokens',
        'destroyTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Send notary receipt to investor]
   *
   * This function can only be called by the notary (if a notary has been attached
   * to the token by the issuer).
   * It can only be called for a action-workflow (issuance) in state ISSUED.
   * It can only be called if the transaction to unlock the tokens is more than 50 blocks old.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - None.
   *
   * On-chain:
   *  - Transaction sent: none.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: issued.
   *
   * Off-chain state machine:
   *  - Initial state: ISSUED
   *  - Destination state: NOTARIZED
   */
  async sendNotaryReceipt(
    tenantId: string,
    actionId: string,
    notaryId: string,
    typeFunctionUser: UserType,
    sendNotification: boolean,
  ): Promise<SendReceiptOutput> {
    try {
      const functionName: FunctionName = FunctionName.SEND_NOTARY_RECEIPT;

      // Preliminary step: Fetch all required data in databases

      const fetchedAction: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(actionId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          undefined, // otherWorkflowType
          true,
        );

      const [, , token, notary, notaryTokenLink]: [
        User,
        User,
        Token,
        User,
        Link,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          fetchedAction[ActionKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          fetchedAction[ActionKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.apiEntityCallService.fetchEntity(tenantId, notaryId, true),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          notaryId,
          UserType.NOTARY,
          fetchedAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
      ]);

      // Idempotency
      if (fetchedAction[ActionKeys.STATE] === 'notarized') {
        // Notary receipt has already been sent, return token action without updating it (idempotency)
        return {
          tokenAction: fetchedAction,
          updated: false,
          message: 'Notary receipt sending was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        fetchedAction[ActionKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // sendNotaryReceipt
      );

      const notaryWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          notary,
          notaryTokenLink,
        );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          notaryWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          false, // checkEthBalance
        );

      if (
        !(
          fetchedAction[ActionKeys.DATA][ActionKeys.DATA__TRANSACTION] &&
          fetchedAction[ActionKeys.DATA][ActionKeys.DATA__TRANSACTION][
            IssuanceWorkflow.ISSUED
          ] &&
          fetchedAction[ActionKeys.DATA][ActionKeys.DATA__TRANSACTION][
            IssuanceWorkflow.ISSUED
          ][ActionKeys.DATA__TRANSACTION__ID]
        )
      ) {
        throw new Error('txHash not stored in context');
      }

      const transactionId =
        fetchedAction[ActionKeys.DATA][ActionKeys.DATA__TRANSACTION][
          IssuanceWorkflow.ISSUED
        ][ActionKeys.DATA__TRANSACTION__ID];

      const txEnvelope: Transaction =
        await this.transactionHelperService.retrieveTransaction(
          tenantId,
          transactionId,
          true, // withContext
          false, // withTxReceipt
          true, // shallReturnResponse
        );
      const txHash: string = txEnvelope[TxKeys.ENV_IDENTIFIER_TX_HASH];

      const txBlockNumber: number =
        await this.apiSCCallService.getTxBlockNumber(txHash, ethService);

      const currentBlockNumber: number =
        await this.apiSCCallService.getCurrentBlockNumber(ethService);

      const MIN_DELTA = 50;
      const blockDelta: number = currentBlockNumber - txBlockNumber;
      this.logger.info({}, `Tx sent ${blockDelta} blocks ago\n`);

      if (blockDelta < MIN_DELTA) {
        return {
          tokenAction: fetchedAction,
          updated: false,
          message: `Notary receipt was not sent, still ${
            MIN_DELTA - blockDelta
          } blocks to wait`,
        };
      } else {
        if (sendNotification) {
          // [TODO] add notification
        }

        let updatedAction: Action;
        if (fetchedAction[ActionKeys.STATE] === IssuanceWorkflow.ISSUED) {
          updatedAction = await this.workflowService.updateWorkflowInstance(
            tenantId,
            fetchedAction[ActionKeys.ID],
            functionName,
            typeFunctionUser,
            nextState,
            fetchedAction,
          );
        }

        return {
          tokenAction: updatedAction,
          updated: true,
          message: `Notary receipt succesfully ${
            fetchedAction[ActionKeys.STATE] === IssuanceWorkflow.ISSUED
              ? ''
              : 're'
          }sent for action #${
            fetchedAction[ActionKeys.ID]
          }, already ${blockDelta} blocks past since transaction validation`,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending notary receipt',
        'sendNotaryReceipt',
        false,
        500,
      );
    }
  }
}
