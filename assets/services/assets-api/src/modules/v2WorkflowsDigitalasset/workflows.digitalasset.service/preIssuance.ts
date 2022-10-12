import { Injectable } from '@nestjs/common';

/**
 * PRE-ISSUANCE WORKFLOW
 *
 * -- On-chain action-workflow --
 *
 * The pre-issuance workflow allows to issue assets for an investor by:
 *  1) Creating locked tokens for an investor,
 *  2) Allowing the investor to distribute the locked tokens to "vehicles" (legal
 *     or natural persons), who have their own Ethereum account, and who'll be able
 *     to go through issuance process.
 *
 *        offer       _________     distribute    _____________
 *         -->       | OFFERED |       -->       | DISTRIBUTED |
 *      [issuer]      ---------     [investor]    -------------
 *
 */

import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { keys as HookKeys, HookCallBack } from 'src/types/hook';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';

import { keys as TxKeys, TxStatus } from 'src/types/transaction';

import { TokenState } from 'src/types/states';
import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { LinkService } from 'src/modules/v2Link/link.service';

import { PreIssuanceWorkflow } from 'src/old/constants/workflows/preissuance';
import { IssuanceWorkflow } from 'src/old/constants/workflows/issuance';
import { FunctionName, TokenCategory } from 'src/types/smartContract';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { EntityType } from 'src/types/entity';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import {
  OfferLockedTokenTokenOutput,
  DistributedLockedTokenOutput,
} from '../workflows.digitalasset.dto';
import { Transaction } from 'src/types/transaction';
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
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ActionService } from 'src/modules/v2Action/action.service';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.PRE_ISSUANCE;

@Injectable()
export class WorkFlowsPreIssuanceService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly transactionHelperService: TransactionHelperService,
    private readonly balanceService: BalanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly configService: ConfigService,
    private readonly navService: NavService,
    private readonly actionHelperService: ActionService,
  ) {}

  /**
   * [Offer tokens to an investor (pre-issuance)]
   * [Create locked tokens for an investor (pre-issuance)]
   *
   * This function can only be called by the issuer of the token.
   * It starts a new workflow instance (pre-issuance workflow).
   * It allows the issuer to create locked tokens for an investor, who'll then
   * be able to distribute the locked tokens to "vehicles" (legal or natural persons).
   * The vehicles will then be able to go through the traditional issuance
   * workflow (sign a contract + send a bank deposit), cf. issuance.ts.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - None.
   *
   * On-chain:
   *  - Transaction sent: "issueByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor.
   *  - Token state after transaction validation: locked.
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: OFFERED
   */
  async offerTokens(
    tenantId: string,
    idempotencyKey: string,
    tokenId: string,
    investorId: string,
    issuerId: string,
    callerId: string,
    quantity: number,
    forcePrice: number,
    tokenClass: string,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<OfferLockedTokenTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.OFFER;
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

      const offerMessage = `Creation of ${newQuantity} locked token(s) (pre-issuance), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'offered';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${offerMessage} was already done (idempotencyKey)`,
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
        tokenCategory, // hybrid
        functionName, // offer
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
        functionName, // offer
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
          functionName, // offer
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = mintingResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const preissuanceWorkflowId: number = (
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
      const updatedData2: any = {
        ...updatedData,
        [ActionKeys.DATA__REMAINING]: quantity,
      };

      const offerAction: Action =
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
          preissuanceWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          PreIssuanceWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData2,
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
        [HookKeys.RESPONSE_PENDING]: `${offerMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${offerMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${offerMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: mintingResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: mintingResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: mintingResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: offerAction,
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
          tokenAction: offerAction,
          transactionId: transactionId,
          created: true,
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
        'offering tokens',
        'offerTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Distribute tokens to vehicle]
   *
   * Hook function called once the transaction is validated.
   */
  async distribute_hook(
    tenantId: string,
    hookCallbackData: HookCallBack,
    identifierOrTxHash: string,
    txStatus: TxStatus,
  ) {
    try {
      this.logger.info(
        {},
        `****** TX RECEIPT (distribute hook) (${txStatus}) ******\n`,
      );

      const updateToNextState: boolean = txStatus === TxStatus.VALIDATED;

      // Token action needs to be refetched because remaining quantity can have been updated during
      // tx validation (in the case when multiple distributions are launched in parallel
      const preIssuanceAction: Action = hookCallbackData[HookKeys.ACTION];
      const issuanceAction: Action = hookCallbackData[HookKeys.ACTION2];

      const fetchedPreIssuanceAction: Action =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          preIssuanceAction[ActionKeys.ID],
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ACTION,
          undefined, // otherWorkflowType
          true,
        );

      // The counter has to be fetched from issuanceAction (and NOT issuanceActionRefreshed) because its value can potentially have changed in the meanwhile
      const counter: number =
        preIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__COUNTER];

      const remainingQuantity: number =
        fetchedPreIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__REMAINING];

      const ongoingQuantity: number =
        fetchedPreIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__ONGOING];

      const newOngoingQuantity: number =
        ongoingQuantity -
        (txStatus === TxStatus.VALIDATED
          ? issuanceAction[ActionKeys.QUANTITY]
          : 0);

      const updatedPreIssuanceData =
        this.transactionHelperService.updateTxStatusInData(
          fetchedPreIssuanceAction[ActionKeys.DATA],
          hookCallbackData[HookKeys.NEXT_STATE].concat(counter.toString()),
          identifierOrTxHash,
          txStatus,
        );

      const newPreissuanceAction = {
        ...fetchedPreIssuanceAction,
        [ActionKeys.DATA]: {
          ...updatedPreIssuanceData,
          [ActionKeys.DATA__ONGOING]: newOngoingQuantity,
        },
      };

      // Update existing pre-issuance action
      const nextState =
        remainingQuantity === 0 && newOngoingQuantity === 0
          ? hookCallbackData[HookKeys.NEXT_STATE]
          : undefined;

      const updatedPreIssuanceAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newPreissuanceAction.id,
          updateToNextState
            ? hookCallbackData[HookKeys.FUNCTION_NAME]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState
            ? hookCallbackData[HookKeys.TYPE_FUNCTION_USER]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState ? nextState : undefined, // Only update to next state if transaction is a success
          newPreissuanceAction,
        );

      // Update existing issuance action
      const updatedIssuanceData =
        this.transactionHelperService.updateTxStatusInData(
          issuanceAction[ActionKeys.DATA],
          hookCallbackData[HookKeys.NEXT_STATE2],
          identifierOrTxHash,
          txStatus,
        );

      const newIssuanceAction = {
        ...issuanceAction,
        [ActionKeys.DATA]: updatedIssuanceData,
      };

      const updatedIssuanceAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newIssuanceAction.id,
          updateToNextState
            ? hookCallbackData[HookKeys.FUNCTION_NAME]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState
            ? hookCallbackData[HookKeys.TYPE_FUNCTION_USER]
            : undefined, // Only update to next state if transaction is a success
          updateToNextState
            ? hookCallbackData[HookKeys.NEXT_STATE2]
            : undefined, // Only update to next state if transaction is a success
          newIssuanceAction,
        );

      const updatedTx: Transaction =
        await this.transactionHelperService.updateTransaction(
          tenantId,
          identifierOrTxHash,
          txStatus,
        );

      return {
        tokenAction1: updatedPreIssuanceAction,
        tokenAction2: updatedIssuanceAction,
        updated: true,
        transactionId: updatedTx[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
        message: `${
          txStatus === TxStatus.VALIDATED
            ? hookCallbackData[HookKeys.RESPONSE_VALIDATED]
            : hookCallbackData[HookKeys.RESPONSE_FAILURE]
        } (transaction ${txStatus})`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calling token distribution callback hook function',
        'distribute_hook',
        false,
        500,
      );
    }
  }

  /**
   * [Distribute locked tokens to vehicle]
   *
   * This function can only be called by the investor.
   * It allows the investor to distribute the locked tokens to "vehicles" (legal
   * or natural persons). The vehicles will then be able to go through the
   * traditional issuance workflow (sign a contract + send a bank deposit), cf. issuance.js.
   * It starts a new action-workflow (issuance) for the vehicle.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - None.
   *
   * On-chain:
   *  - Transaction sent: "transferByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the vehicle.
   *  - Token state after transaction validation: locked.
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: DISTRIBUTED (or OFFERED)
   *      --> In case all the locked tokens have been distributed to vehicles, the
   *          state switches to DISTRIBUTED.
   *      --> In case all the locked tokens have not been distributed to vehicles, the
   *          state remains to OFFERED.
   */
  async distributeTokens(
    tenantId: string,
    actionId: string,
    vehicleId: string,
    callerId: string,
    quantity: number,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<DistributedLockedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.DISTRIBUTE;
      const tokenState: TokenState = TokenState.LOCKED;

      // Preliminary step: Fetch all required data in databases

      const preIssuanceAction: Action =
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

      const [issuer, investor, vehicle, token, investorTokenLink, config]: [
        User,
        User,
        User,
        Token,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          preIssuanceAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          preIssuanceAction[ActionKeys.USER_ID],
          true,
        ),
        this.apiEntityCallService.fetchEntity(tenantId, vehicleId, true),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          preIssuanceAction[ActionKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          preIssuanceAction[ActionKeys.USER_ID],
          UserType.INVESTOR,
          preIssuanceAction[ActionKeys.ENTITY_ID],
          EntityType.TOKEN,
          preIssuanceAction[ActionKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // ==> Step1: Perform several checks before sending the transaction

      if (vehicle[UserKeys.SUPER_USER_ID] !== investor[UserKeys.USER_ID]) {
        ErrorService.throwError('vehicle does not belong to this user');
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory, // hybrid
        functionName, // distribute
        issuer,
        token,
        config,
        investor, // token sender
        vehicle, // token recipient
        tokenState, // originTokenState
        preIssuanceAction[ActionKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        preIssuanceAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
      );

      const distributeMessage = `Distribution of ${quantity} locked token(s) (pre-issuance), from investor ${
        investor[UserKeys.USER_ID]
      }, to vehicle ${vehicle[UserKeys.USER_ID]},`;

      // Idempotency
      const targetState = 'distributed';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        preIssuanceAction[ActionKeys.DATA],
        targetState,
      );
      if (
        preIssuanceAction[ActionKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Tokens distribution has been triggered, return token action without updating it (idempotency)
        return {
          tokenAction1: preIssuanceAction,
          tokenAction2: undefined,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            preIssuanceAction[ActionKeys.DATA],
            targetState,
          ),
          message: `${distributeMessage} was already done (tx ${txStatus})`,
        };
      }

      // Process check - PreIssuance process
      const nextState1: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        preIssuanceAction[ActionKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // distribute
      );

      // Process check - Issuance process
      const nextState2: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        'issuance',
        undefined, // workflow instance ID
        UserType.INVESTOR,
        functionName, // distribute
      );

      if (
        !(
          preIssuanceAction[ActionKeys.DATA] &&
          preIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__REMAINING]
        )
      ) {
        ErrorService.throwError('missing remaining quantity in action data');
      }

      await this.checkRemainingQuantity(preIssuanceAction, quantity);

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
        tokenState,
        preIssuanceAction[ActionKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        quantity,
        true,
      );

      // ==> Step2: Send the transaction

      let vehicleWallet: Wallet = this.walletService.extractWalletFromUser(
        vehicle,
        vehicle[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
          undefined, // idFunctionUser
          vehicle,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityUser
          token, // entityToken
          preIssuanceAction[ActionKeys.ASSET_CLASS],
          vehicleWallet,
        );
      const vehicleTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        vehicleWallet = this.walletService.extractWalletFromUserEntityLink(
          vehicle,
          vehicleTokenLink,
        );
      }

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

      const body: any = this.tokenTxHelperService.craftTransferBody(
        tokenCategory,
        token,
        investorWallet,
        vehicleWallet,
        tokenState, // only for hybrid
        preIssuanceAction[ActionKeys.ASSET_CLASS], // only for hybrid
        undefined, // tokenIdentifier
        quantity, // only for fungible of hybrid
      );

      const transferResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          investor, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          vehicle, // tokenRecipient
          tokenState, // originTokenState
          preIssuanceAction[ActionKeys.ASSET_CLASS], // originTokenClass
          tokenState, // destinationTokenState
          preIssuanceAction[ActionKeys.ASSET_CLASS], // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // distribute
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = transferResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      /********PREISSUANCE START*******/

      const remainingQuantity: number =
        preIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__REMAINING];
      const ongoingQuantity = preIssuanceAction[ActionKeys.DATA][
        ActionKeys.DATA__ONGOING
      ]
        ? preIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__ONGOING]
        : 0;

      const distributedQuantity: number = quantity;

      if (remainingQuantity === distributedQuantity) {
        this.logger.info(
          {},
          `distribution finalized: ${distributedQuantity} over ${remainingQuantity} distributed\n`,
        );
      } else if (remainingQuantity < distributedQuantity) {
        ErrorService.throwError(
          'shall never happen - remaining quantity too low',
        );
      } else {
        this.logger.info(
          {},
          `distribution still on-going: ${distributedQuantity} over ${remainingQuantity} distributed\n`,
        );
      }

      const counter: number = preIssuanceAction[ActionKeys.DATA][
        ActionKeys.DATA__COUNTER
      ]
        ? 1 + preIssuanceAction[ActionKeys.DATA][ActionKeys.DATA__COUNTER]
        : 1;

      const updatedPreIssuanceData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          preIssuanceAction[ActionKeys.DATA],
          investor[UserKeys.USER_ID],
          investorWallet,
          nextState1.concat(counter.toString()),
          transactionId,
          ethService,
          transferResponse[ApiSCResponseKeys.TX_SERIALIZED],
          transferResponse[ApiSCResponseKeys.TX],
        ),
      };

      const newPreissuanceAction = {
        ...preIssuanceAction,
        [ActionKeys.DATA]: {
          ...updatedPreIssuanceData,
          [ActionKeys.DATA__COUNTER]: counter,
          [ActionKeys.DATA__REMAINING]: remainingQuantity - distributedQuantity,
          [ActionKeys.DATA__ONGOING]: ongoingQuantity + distributedQuantity,
        },
      };

      const updatedPreIssuanceAction: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newPreissuanceAction.id,
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newPreissuanceAction,
        );
      /********PREISSUANCE END*******/

      /********ISSUANCE START*******/
      const issuanceWorkflowId = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          WorkflowName.ISSUANCE,
        )
      )[WorkflowTemplateKeys.ID];

      // Transfer additional data to issuance workflow (excepted the remaining quantity)
      const issuanceData = {
        ...newPreissuanceAction[ActionKeys.DATA],
        ...data,
      };
      delete issuanceData[ActionKeys.DATA__REMAINING];
      delete issuanceData[ActionKeys.DATA__ONGOING];
      delete issuanceData[ActionKeys.DATA__COUNTER];
      delete issuanceData[ActionKeys.DATA__TRANSACTION];

      const issuanceData2: any = {
        ...this.transactionHelperService.addPendingTxToData(
          issuanceData,
          investor[UserKeys.USER_ID],
          investorWallet,
          nextState2,
          transactionId,
          ethService,
          transferResponse[ApiSCResponseKeys.TX_SERIALIZED],
          transferResponse[ApiSCResponseKeys.TX],
        ),
      };

      const issuanceAction = await this.workflowService.createWorkflowInstance(
        tenantId,
        undefined, // idempotencyKey
        WorkflowType.ACTION,
        functionName,
        typeFunctionUser,
        vehicle[UserKeys.USER_ID],
        token[TokenKeys.TOKEN_ID],
        EntityType.TOKEN,
        undefined, // objectId
        undefined, // recipientId
        undefined, // brokerId
        undefined, // agentId
        issuanceWorkflowId,
        quantity,
        newPreissuanceAction[ActionKeys.PRICE],
        undefined, // documentId
        investorWallet[WalletKeys.WALLET_ADDRESS],
        newPreissuanceAction[ActionKeys.ASSET_CLASS],
        new Date(),
        IssuanceWorkflow.NOT_STARTED,
        undefined, //offerId
        undefined, //orderSide
        issuanceData2,
      );

      /********ISSUANCE END*******/

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuer[UserKeys.USER_ID],
          investor[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState1,
        [HookKeys.NEXT_STATE2]: nextState2,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${distributeMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${distributeMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${distributeMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: transferResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: transferResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: transferResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: newPreissuanceAction,
        [HookKeys.ACTION2]: issuanceAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: investor[UserKeys.USER_ID],
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        investor[UserKeys.USER_ID],
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction1: updatedPreIssuanceAction,
          tokenAction2: issuanceAction,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response = await this.distribute_hook(
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
        'distributing tokens',
        'distributeTokens',
        false,
        500,
      );
    }
  }

  /**
   * [Check remaining quantity of tokens to distribute (data stored in action data)]
   *
   * This function is used as a middleware to check the remaining quantity of available tokens,
   * before a user wants to distribute those tokens into vehicle, in the frame of the
   * pre-issuance process.
   * The check is performed off-chain only. It only checks if the action in the
   * workflow DB contains a sufficient balance.
   *
   */
  checkRemainingQuantity(action: Action, distributedQuantity: number) {
    try {
      const remainingQuantity: number =
        action[ActionKeys.DATA][ActionKeys.DATA__REMAINING];

      if (distributedQuantity <= 0) {
        ErrorService.throwError('quantity has to be positive');
      } else if (remainingQuantity < distributedQuantity) {
        ErrorService.throwError(
          `quantity too large --> ${distributedQuantity} larger than ${remainingQuantity} remaining`,
        );
      } else {
        this.logger.info(
          {},
          `quantity ok --> ${distributedQuantity} smaller than ${remainingQuantity} remaining\n`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking remaining quantity',
        'checkRemainingQuantity',
        false,
        500,
      );
    }
  }
}
