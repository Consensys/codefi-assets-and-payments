/**
 * DIRECT ISSUANCE WORKFLOW
 *
 * -- On-chain action-workflow --
 *
 * The issuance workflow allows to issue assets for an investor by:
 *  1) Creating locked tokens for the investor,
 *  2) Allowing the investor to reserve the created tokens by signing a contract,
 *  3) Allowing the issuer to unlock the tokens once payment/deposit has been validated.

 * The direct issuance workflow allows to issue assets for an investor
 * by creating unlocked tokens for the investor.
 *
 *    createUnlocked  ________
 *         -->       | ISSUED |
 *      [issuer]      --------
 *
 */
import { TokenState } from 'src/types/states';

import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { TxStatus } from 'src/types/transaction';

import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';

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
import { CreateUnLockedTokenOutput } from '../workflows.digitalasset.dto';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
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
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { ActionService } from 'src/modules/v2Action/action.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.ISSUANCE;

@Injectable()
export class WorkFlowsDirectIssuanceService {
  constructor(
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
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
   * [Issue unlocked tokens for an investor]
   *
   * This function can only be called by the issuer of the asset.
   * It starts a new action-workflow (issuance).
   * It allows the issuer to bypass the whole issuance workflow by creating unlocked tokens.
   *
   * Pre-requisite for the compliance/kyc middleware:
   *  - The token recipient needs to be validated (either kyc workflow finalized OR allowListed).
   *
   * On-chain:
   *  - Transaction sent: "issueByPartition" function of ERC1400 smart contract.
   *  - Owner of the tokens after transaction validation: the investor/the vehicle.
   *  - Token state after transaction validation: issued.
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: ISSUED
   */
  async createUnlockedTokens(
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
  ): Promise<CreateUnLockedTokenOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName = FunctionName.CREATE_UNLOCKED;
      const tokenState: TokenState = TokenState.ISSUED;
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

      const issuanceMessage = `Creation of ${newQuantity} unlocked token(s), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'issued';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
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
        functionName, // createUnlockedTokens
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
        functionName, // createUnlockedTokens
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
          undefined, // entityIssuer
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
          functionName, // createUnlockedTokens
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
        'creating unlocked tokens',
        'createUnlockedTokens',
        false,
        500,
      );
    }
  }
}
