import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import ErrorService from 'src/utils/errorService';

// APIs
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';

import web3Utils from 'web3-utils';

import { keys as HookKeys, HookCallBack } from 'src/types/hook';

import { TokenState } from 'src/types/states';
import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import { keys as TokenKeys, Token } from 'src/types/token';
import {
  addDecimalsAndConvertToHex,
  removeDecimalsFromBalances,
} from 'src/utils/number';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';
import { EntityType } from 'src/types/entity';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { LinkService } from 'src/modules/v2Link/link.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import {
  FunctionName,
  functionRules,
  FunctionRule,
  TokenCategory,
  EMPTY_CERTIFICATE,
} from 'src/types/smartContract';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { DECIMALS } from 'src/types/decimals';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { BasicWorkflow } from 'src/old/constants/workflows/basic';
import {
  WorkflowType,
  keys as ActionKeys,
} from 'src/types/workflow/workflowInstances';
import { TxStatus } from 'src/types/transaction';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import {
  BurnTokenOutput,
  ForceBurnTokenOutput,
  ForceTransferTokenOutput,
  TransferTokenOutput,
  MintTokenOutput,
  UpdateStateTokenOutput,
  UpdateClassTokenOutput,
  HoldTokenOutput,
  ForceHoldTokenOutput,
  ExecuteHoldTokenOutput,
  ReleaseHoldTokenOutput,
  ForceUpdateStateTokenOutput,
} from '../transaction.token.dto';
import { convertCategoryToDeprecatedEnum } from 'src/utils/deprecated';
import { Action } from 'src/types/workflow/workflowInstances/action';
import {
  keys as WorkFlowTemplateKeys,
  WorkflowTemplate,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { HOLD_NOTARY_ADDRESS } from 'src/utils/ethAccounts';
import { checkSolidityBytes32 } from 'src/utils/solidity';

import { keys as HTLCKeys } from 'src/types/htlc';
import { keys as HoldKeys, Hold } from 'src/types/hold';
import { checkSecretForHash } from 'src/utils/htlc';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { ActionService } from 'src/modules/v2Action/action.service';
import { keys as SupplyKeys } from 'src/types/supply';
import {
  AssetData,
  AssetDataKeys,
  ClassData,
  ClassDataKeys,
  CollectibleStorageType,
  DocumentKeys,
  GeneralDataKeys,
} from 'src/types/asset';
import { AssetType } from 'src/types/asset/template';
import { ApiExternalStorageCallService } from 'src/modules/v2ApiCall/api.call.service/externalStorage';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

@Injectable()
export class TokenTxHelperService {
  constructor(
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    @Inject(forwardRef(() => TransactionHelperService))
    private readonly transactionHelperService: TransactionHelperService,
    private readonly partitionService: PartitionService,
    private readonly balanceService: BalanceService,
    private readonly navService: NavService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly configService: ConfigService,
    private readonly actionHelperService: ActionService,
    private readonly externalStrorage: ApiExternalStorageCallService,
  ) {}

  /**
   * Retrieve the default basics workflow IDs
   */
  async retrieveDefaultBasicsWorkflowId(
    tenantId: string,
    tokenCategory: TokenCategory,
  ): Promise<number> {
    try {
      let workflowTemplate: WorkflowTemplate;
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        workflowTemplate =
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            WorkflowName.FUNGIBLE_BASICS,
          );
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        workflowTemplate =
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            WorkflowName.NON_FUNGIBLE_BASICS,
          );
      } else if (tokenCategory === TokenCategory.HYBRID) {
        workflowTemplate =
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            WorkflowName.HYBRID_BASICS,
          );
      } else {
        ErrorService.throwError(`invalid token category (${tokenCategory})`);
      }

      if (!workflowTemplate[WorkFlowTemplateKeys.ID]) {
        ErrorService.throwError('invalid workflow template object');
      }

      return workflowTemplate[WorkFlowTemplateKeys.ID];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving default basics workflow ID',
        'retrieveDefaultBasicsWorkflowId',
        false,
        500,
      );
    }
  }

  /**
   * [Mint tokens for an investor]
   *
   * This function can only be called by the issuer of the token.
   */
  async mint(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    tokenId: string,
    investorId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    scheduleAdditionalAction: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<MintTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      let functionName: FunctionName = FunctionName.MINT;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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

      const assetData: AssetData = token[TokenKeys.ASSET_DATA];
      let tokenUri;
      if (
        assetData &&
        assetData[AssetDataKeys.TYPE] === AssetType.COLLECTIBLE
      ) {
        const item = assetData[AssetDataKeys.CLASS].find(
          (c) => c[ClassDataKeys.KEY] === tokenIdentifier,
        );
        if (!item) {
          ErrorService.throwError('invalid token identifier');
        }
        const itemId = uuidv4();
        const storageType =
          assetData[AssetDataKeys.ASSET][GeneralDataKeys.STORAGE];
        const itemMetadata = this.craftItemMetadata(
          tenantId,
          item,
          storageType,
        );
        if (storageType === CollectibleStorageType.IPFS) {
          tokenUri = await this.externalStrorage.uploadIpfs(
            tenantId,
            itemId,
            itemMetadata,
          );
        } else {
          tokenUri = await this.externalStrorage.uploadPublic(
            tenantId,
            itemId,
            itemMetadata,
          );
        }

        functionName = FunctionName.MINT_AND_SET_TOKEN_URI;
      }

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

      const mintMessage: string = this.craftMintMessage(
        tokenCategory,
        investor,
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
      );

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${mintMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // mint
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

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // mint
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

      const body: any = this.craftMintBody(
        tokenCategory,
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        tokenUri,
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
          functionName, // mint
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = mintingResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          mintingResponse[ApiSCResponseKeys.TX_SERIALIZED],
          mintingResponse[ApiSCResponseKeys.TX],
        ),
      };

      if (tokenUri) {
        updatedData['tokenUri'] = tokenUri;
      }

      const mintingAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${mintMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${mintMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${mintMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: mintingResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: mintingResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: mintingResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: mintingAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: issuerId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: scheduleAdditionalAction,
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

      if (sendNotification) {
        this.apiMailingCallService.sendInvestorMintOrForceBurnNotification(
          tenantId,
          issuer,
          investor,
          token,
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: mintingAction,
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
        'minting token',
        'mint',
        false,
        500,
      );
    }
  }

  craftItemMetadata(
    tenantId: string,
    item: ClassData,
    storageType: CollectibleStorageType,
  ): {
    name: string;
    description: string;
    image: string;
    attributes: any[];
    external_url: string;
    animation_url: string;
    youtube_url: string;
  } {
    const imageKey = item[ClassDataKeys.IMAGE][DocumentKeys.KEY];
    let imageUrl;
    if (storageType === CollectibleStorageType.IPFS) {
      imageUrl = `https://ipfs.io/ipfs/${imageKey}`;
    } else {
      imageUrl = `${process.env.EXTERNAL_STORAGE_API}/public/${tenantId}/${imageKey}`;
    }
    return {
      name: item[ClassDataKeys.NAME],
      description: item[ClassDataKeys.DESCRIPTION],
      image: imageUrl,
      attributes: item[ClassDataKeys.ATTRIBUTES],
      external_url: 'https://www.consensys.net',
      animation_url: '',
      youtube_url: '',
    };
  }

  /**
   * [Craft minting transaction parameters according to the token category]
   */
  craftMintBody(
    tokenCategory: TokenCategory,
    token: Token,
    issuerWallet: Wallet,
    investorWallet: Wallet,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
    tokenUri: string, // only for non fungible
  ): any {
    try {
      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        ),
      };

      const investorAddress: string = web3Utils.toChecksumAddress(
        investorWallet[WalletKeys.WALLET_ADDRESS],
      );
      const hexAmount: string = addDecimalsAndConvertToHex(quantity, DECIMALS);
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        body.to = investorAddress;
        body.value = hexAmount;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        body.to = investorAddress;
        body.tokenId = tokenIdentifier;
        body.uri = tokenUri;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        const issuancePartition: string = this.partitionService.createPartition(
          tokenState,
          tokenClass,
        );
        body.partition = issuancePartition;
        body.tokenHolder = investorAddress;
        body.value = hexAmount;
        body.data = EMPTY_CERTIFICATE;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return body;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting mint body',
        'craftMintBody',
        false,
        500,
      );
    }
  }

  /**
   * [Craft transfer response message]
   */
  craftMintMessage(
    tokenCategory: TokenCategory,
    investor: User,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
  ): string {
    try {
      let message: string;
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        message = `Minting of ${quantity} ${tokenCategory.toLowerCase()} token(s), for investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        message = `Minting of ${tokenCategory.toLowerCase()} token with identifier ${tokenIdentifier}, for investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        message = `Minting of ${quantity} ${tokenState} ${tokenCategory.toLowerCase()} token(s), of class ${tokenClass}, for investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return message;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting minting message',
        'craftMintMessage',
        false,
        500,
      );
    }
  }

  /**
   * [Transfer tokens for an investor]
   *
   * This function can only be called by a token holder.
   */
  async transfer(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    investorId: string,
    tokenId: string,
    recipientId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<TransferTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.TRANSFER;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        recipient,
        issuer,
        token,
        investorTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, User, Token, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
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

      const transferMessage: string = this.craftTransferMessage(
        tokenCategory,
        investor,
        recipient,
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
      );

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${transferMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // transfer
        issuer,
        token,
        config,
        investor, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        tokenState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        tokenCategory === TokenCategory.NONFUNGIBLE
          ? 'transferFrom'
          : functionName, // FIXME: add "transfer" to list of authorized actions for non-fungible worklow in WorkflowAPI
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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

      let recipientWallet: Wallet = this.walletService.extractWalletFromUser(
        recipient,
        recipient[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
          undefined, // idFunctionUser
          recipient,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          tokenClass,
          recipientWallet,
        );
      const recipientTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        recipientWallet = this.walletService.extractWalletFromUserEntityLink(
          recipient,
          recipientTokenLink,
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

      const body: any = this.craftTransferBody(
        tokenCategory,
        token,
        investorWallet,
        recipientWallet,
        tokenState, // only for hybrid
        tokenClass, // only for hybrid
        tokenIdentifier,
        newQuantity, // only for fungible of hybrid
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
          recipient, // tokenRecipient
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          tokenState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // transfer
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = transferResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          investor[UserKeys.USER_ID],
          investorWallet,
          nextStatus,
          transactionId,
          ethService,
          transferResponse[ApiSCResponseKeys.TX_SERIALIZED],
          transferResponse[ApiSCResponseKeys.TX],
        ),
      };

      const transferAction: Action =
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
          recipient[UserKeys.USER_ID],
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          investorWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          investorId,
          recipientId,
          issuer[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${transferMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${transferMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${transferMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: transferResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: transferResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: transferResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: transferAction,
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
          tokenAction: transferAction,
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
        'transferring token',
        'transfer',
        false,
        500,
      );
    }
  }

  /**
   * [Craft transfer transaction parameters according to the token category]
   */
  craftTransferBody(
    tokenCategory: TokenCategory,
    token: Token,
    investorWallet: Wallet,
    recipientWallet: Wallet,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
  ): any {
    try {
      const signerAddress: string = web3Utils.toChecksumAddress(
        investorWallet[WalletKeys.WALLET_ADDRESS],
      );
      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: signerAddress,
      };

      const recipientAddress: string = web3Utils.toChecksumAddress(
        recipientWallet[WalletKeys.WALLET_ADDRESS],
      );
      const hexAmount: string = addDecimalsAndConvertToHex(quantity, DECIMALS);
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        body.to = recipientAddress;
        body.value = hexAmount;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        body.from = signerAddress;
        body.to = recipientAddress;
        body.tokenId = tokenIdentifier;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        const transferPartition: string = this.partitionService.createPartition(
          tokenState,
          tokenClass,
        );
        body.partition = transferPartition;
        body.to = recipientAddress;
        body.value = hexAmount;
        body.data = EMPTY_CERTIFICATE;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return body;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting transfer body',
        'craftTransferBody',
        false,
        500,
      );
    }
  }

  /**
   * [Craft transfer response message]
   */
  craftTransferMessage(
    tokenCategory: TokenCategory,
    investor: User,
    recipient: User,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
  ): string {
    try {
      let message: string;
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        message = `Transfer of ${quantity} ${tokenCategory.toLowerCase()} token(s), from investor ${
          investor[UserKeys.USER_ID]
        }, to investor ${recipient[UserKeys.USER_ID]}`;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        message = `Transfer of ${tokenCategory.toLowerCase()} token with identifier ${tokenIdentifier}, from investor ${
          investor[UserKeys.USER_ID]
        }, to investor ${recipient[UserKeys.USER_ID]}`;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        message = `Transfer of ${quantity} ${tokenState} ${tokenCategory.toLowerCase()} token(s), of class ${tokenClass}, from investor ${
          investor[UserKeys.USER_ID]
        }, to investor ${recipient[UserKeys.USER_ID]}`;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return message;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting transfer message',
        'craftTransferMessage',
        false,
        500,
      );
    }
  }

  /**
   * [Burn tokens for an investor]
   *
   * This function can only be called by a token holder.
   */
  async burn(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    investorId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<BurnTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.BURN;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        investorTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
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

      const burnMessage: string = this.craftBurnMessage(
        tokenCategory,
        investor,
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
      );

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${burnMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // burn
        issuer,
        token,
        config,
        investor, // token sender
        undefined, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        undefined, // destinationTokenState
        undefined, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // burn
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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

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

      const body: any = this.craftBurnBody(
        tokenCategory,
        token,
        investorWallet,
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
      );

      const burnResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          investor, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          undefined, // tokenRecipient
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          undefined, // destinationTokenState
          undefined, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // burn
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = burnResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          investor[UserKeys.USER_ID],
          investorWallet,
          nextStatus,
          transactionId,
          ethService,
          burnResponse[ApiSCResponseKeys.TX_SERIALIZED],
          burnResponse[ApiSCResponseKeys.TX],
        ),
      };

      const burnAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          investorWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${burnMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${burnMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${burnMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: burnResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: burnResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: burnResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: burnAction,
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
          tokenAction: burnAction,
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
        'burning token',
        'burn',
        false,
        500,
      );
    }
  }

  /**
   * [Craft burn transaction parameters according to the token category]
   */
  craftBurnBody(
    tokenCategory: TokenCategory,
    token: Token,
    investorWallet: Wallet,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
  ): any {
    try {
      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
      };

      const hexAmount: string = addDecimalsAndConvertToHex(quantity, DECIMALS);
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        body.value = hexAmount;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        body.tokenId = tokenIdentifier;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        const burnPartition: string = this.partitionService.createPartition(
          tokenState,
          tokenClass,
        );
        body.partition = burnPartition;
        body.value = hexAmount;
        body.data = EMPTY_CERTIFICATE;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return body;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting burn body',
        'craftBurnBody',
        false,
        500,
      );
    }
  }

  /**
   * [Craft burn response message]
   */
  craftBurnMessage(
    tokenCategory: TokenCategory,
    investor: User,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string,
    quantity: number, // only for fungible of hybrid
  ): string {
    try {
      let message: string;
      if (tokenCategory === TokenCategory.FUNGIBLE) {
        message = `Burn of ${quantity} ${tokenCategory.toLowerCase()} token(s), from investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else if (tokenCategory === TokenCategory.NONFUNGIBLE) {
        message = `Burn of ${tokenCategory.toLowerCase()} token with identifier ${tokenIdentifier}, from investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else if (tokenCategory === TokenCategory.HYBRID) {
        message = `Burn of ${quantity} ${tokenState} ${tokenCategory.toLowerCase()} token(s), of class ${tokenClass}, from investor ${
          investor[UserKeys.USER_ID]
        }`;
      } else {
        ErrorService.throwError(`unknown token category ${tokenCategory}`);
      }
      return message;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting burn message',
        'craftBurnMessage',
        false,
        500,
      );
    }
  }

  /**
   * [Transfer tokens for an investor]
   *
   * This function can only be called by a controller of the token (e.g. the issuer of the token).
   */
  async forceTransfer(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    investorId: string,
    recipientId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    sendNotification: boolean,
    authToken: string,
  ): Promise<ForceTransferTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.FORCE_TRANSFER;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        recipient,
        issuer,
        token,
        investorTokenLink,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, User, Token, Link, Link, Action, Config] =
        await Promise.all([
          this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
          this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            tokenId,
            EntityType.TOKEN,
          ),
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
            investorId,
            UserType.INVESTOR,
            tokenId,
            EntityType.TOKEN,
            tokenClass,
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

      const forceTransferMessage = `ForceTransfer of ${newQuantity} ${tokenState} ${tokenCategory} tokens, of class ${tokenClass}, from investor ${investorId}, to investor ${recipientId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${forceTransferMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // forceTransfer
        issuer,
        token,
        config,
        investor, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        tokenState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceTransfer
      );

      const transferPartition: string = this.partitionService.createPartition(
        tokenState,
        tokenClass,
      );

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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

      let recipientWallet: Wallet = this.walletService.extractWalletFromUser(
        recipient,
        recipient[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          recipient,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          tokenClass,
          recipientWallet,
        );
      const recipientTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        recipientWallet = this.walletService.extractWalletFromUserEntityLink(
          recipient,
          recipientTokenLink,
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

      const body = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        partition: transferPartition,
        from: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        to: web3Utils.toChecksumAddress(
          recipientWallet[WalletKeys.WALLET_ADDRESS],
        ),
        value: addDecimalsAndConvertToHex(newQuantity, DECIMALS),
        data: '0x',
        operatorData: EMPTY_CERTIFICATE,
      };

      const forceTransferResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          recipient, // tokenRecipient
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          tokenState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // forceTransfer
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        forceTransferResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          forceTransferResponse[ApiSCResponseKeys.TX_SERIALIZED],
          forceTransferResponse[ApiSCResponseKeys.TX],
        ),
      };

      const forceTransferAction: Action =
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
          recipient[UserKeys.USER_ID],
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuerId,
          investorId,
          recipientId,
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${forceTransferMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${forceTransferMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${forceTransferMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            forceTransferResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            forceTransferResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: forceTransferResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: forceTransferAction,
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

      if (sendNotification) {
        this.apiMailingCallService.sendRecipientForceTransferNotification(
          tenantId,
          issuer,
          recipient,
          investor,
          token,
          String(newQuantity),
          authToken,
        );

        this.apiMailingCallService.sendSenderForceTransferNotification(
          tenantId,
          issuer,
          investor,
          recipient,
          token,
          String(newQuantity),
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: forceTransferAction,
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
        'forcing token transfer',
        'forceTransfer',
        false,
        500,
      );
    }
  }

  /**
   * [Force burn of an investor's tokens]
   *
   * This function can only be called by a controller of the token (e.g. the issuer of the token).
   */
  async forceBurn(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    investorId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    sendNotification: boolean,
    authToken: string,
  ): Promise<ForceBurnTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.FORCE_BURN;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        investorTokenLink,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
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

      const forceBurnMessage = `ForceBurn transaction of ${newQuantity} ${tokenState} ${tokenCategory} tokens, of class ${tokenClass}, from investor ${investorId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${forceBurnMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // forceBurn
        issuer,
        token,
        config,
        investor, // token sender
        undefined, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        undefined, // destinationTokenState
        undefined, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceBurn
      );

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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

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

      const body = this.craftForceBurnBody(
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        tokenClass,
        newQuantity,
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
          tokenClass, // originTokenClass
          undefined, // destinationTokenState
          undefined, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // forceBurn
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = forceBurnResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          forceBurnResponse[ApiSCResponseKeys.TX_SERIALIZED],
          forceBurnResponse[ApiSCResponseKeys.TX],
        ),
      };

      const forceBurnAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${forceBurnMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${forceBurnMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${forceBurnMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: forceBurnResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: forceBurnResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: forceBurnResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: forceBurnAction,
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

      if (sendNotification) {
        this.apiMailingCallService.sendInvestorMintOrForceBurnNotification(
          tenantId,
          issuer,
          investor,
          token,
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: forceBurnAction,
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
        'forcing token burn',
        'forceBurn',
        false,
        500,
      );
    }
  }

  /**
   * [Craft forceBurn transaction parameters]
   */
  craftForceBurnBody(
    token: Token,
    signerWallet: Wallet,
    investorWallet: Wallet,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    quantity: number, // only for fungible of hybrid
  ): any {
    try {
      const burnPartition: string = this.partitionService.createPartition(
        tokenState,
        tokenClass,
      );

      const body = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          signerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        partition: burnPartition,
        tokenHolder: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        value: addDecimalsAndConvertToHex(quantity, DECIMALS),
        data: '0x',
        operatorData: EMPTY_CERTIFICATE,
      };

      return body;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting forceBurn body',
        'craftForceBurnBody',
        false,
        500,
      );
    }
  }

  /**
   * [Update state of tokens]
   *
   * This function can only be called by a token holder.
   */
  async updateState(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    investorId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    destinationState: TokenState,
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    emailRemarks: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<UpdateStateTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.UPDATE_STATE;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        investorTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ACTION,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Retrieve the initial investor who creates the token and use it in the email
      // notification at the bottom of this function.
      let initialInvestor: User;
      const initialInvestorId =
        token[TokenKeys.DATA]?.[TokenKeys.DATA__INITIAL_SUPPLIES]?.[0]?.[
          SupplyKeys.USER_ID
        ];
      if (initialInvestorId) {
        initialInvestor = await this.apiEntityCallService.fetchEntity(
          tenantId,
          initialInvestorId,
          true,
        );
      }

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

      const updateStateMessage = `UpdateState transaction of ${newQuantity} ${tokenState} ${tokenCategory} tokens, of class ${tokenClass}, from investor ${investorId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${updateStateMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      // only updating to a downgraded token state is allowed
      if (destinationState !== TokenState.COLLATERAL) {
        ErrorService.throwError(
          `provided destinationState (${destinationState}) can only be ${TokenState.COLLATERAL}`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // updateState
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        destinationState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // updateState
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
        tokenState,
        tokenClass,
        undefined,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

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

      const body = this.craftUpdateStateBody(
        token,
        investorWallet,
        investorWallet,
        tokenState,
        destinationState,
        tokenClass,
        newQuantity,
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
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          destinationState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // updateState
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        updateStateResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          investor[UserKeys.USER_ID],
          investorWallet,
          nextStatus,
          transactionId,
          ethService,
          updateStateResponse[ApiSCResponseKeys.TX_SERIALIZED],
          updateStateResponse[ApiSCResponseKeys.TX],
        ),
        [ActionKeys.DATA__FROM_STATE]: tokenState,
        [ActionKeys.DATA__TO_STATE]: destinationState,
      };

      const updateStateAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          investorWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${updateStateMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${updateStateMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${updateStateMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            updateStateResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            updateStateResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: updateStateResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updateStateAction,
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

      if (sendNotification) {
        if (initialInvestor !== investor) {
          // send email notification for retirement to the initial investor who created the token
          this.apiMailingCallService.sendInvestorAssetTokenRetiredMail(
            tenantId,
            initialInvestor,
            issuer,
            investor,
            quantity,
            token,
            tokenClass,
            emailRemarks,
            authToken,
          );
        }

        // send email notification to the investor who retired the token credits
        this.apiMailingCallService.sendInvestorAssetTokenRetiredMail(
          tenantId,
          investor,
          issuer,
          investor,
          quantity,
          token,
          tokenClass,
          emailRemarks,
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: updateStateAction,
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
        'updating token state',
        'updateState',
        false,
        500,
      );
    }
  }

  /**
   * [Force update state of tokens]
   *
   * This function can only be called by a controller of the token (e.g. the issuer of the token).
   */
  async forceUpdateState(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    investorId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    destinationState: TokenState,
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    sendNotification: boolean,
    authToken: string,
  ): Promise<ForceUpdateStateTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.FORCE_UPDATE_STATE;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        investorTokenLink,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
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

      // Retrieve the initial investor who creates the token and use it in the email
      // notification at the bottom of this function.
      let initialInvestor: User;
      const initialInvestorId =
        token[TokenKeys.DATA]?.[TokenKeys.DATA__INITIAL_SUPPLIES]?.[0]?.[
          SupplyKeys.USER_ID
        ];
      if (initialInvestorId) {
        initialInvestor = await this.apiEntityCallService.fetchEntity(
          tenantId,
          initialInvestorId,
          true,
        );
      }

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

      const forceUpdateStateMessage = `ForceUpdateState transaction of ${newQuantity} ${tokenState} ${tokenCategory} tokens, of class ${tokenClass}, from investor ${investorId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${forceUpdateStateMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // updateState
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        destinationState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceUpdateState
      );

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
        tokenState,
        tokenClass,
        undefined,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

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

      const body = this.craftUpdateStateBody(
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        destinationState,
        tokenClass,
        newQuantity,
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
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          destinationState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // forceUpdateState
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        updateStateResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          updateStateResponse[ApiSCResponseKeys.TX_SERIALIZED],
          updateStateResponse[ApiSCResponseKeys.TX],
        ),
        [ActionKeys.DATA__FROM_STATE]: tokenState,
        [ActionKeys.DATA__TO_STATE]: destinationState,
      };

      const forceUpdateStateAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${forceUpdateStateMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${forceUpdateStateMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${forceUpdateStateMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            updateStateResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            updateStateResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: updateStateResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: forceUpdateStateAction,
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

      if (sendNotification) {
        if (initialInvestor) {
          this.apiMailingCallService.sendInvestorAssetTokenRetiredMail(
            tenantId,
            initialInvestor,
            issuer,
            investor,
            quantity,
            token,
            tokenClass,
            undefined, // remarks
            authToken,
          );
        }

        this.apiMailingCallService.sendInvestorAssetTokenRetiredMail(
          tenantId,
          investor,
          issuer,
          investor,
          quantity,
          token,
          tokenClass,
          undefined, // remarks
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: forceUpdateStateAction,
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
        'forcing update token state',
        'forceUpdateState',
        false,
        500,
      );
    }
  }

  /**
   * [Craft updateState transaction parameters according to the token category]
   */
  craftUpdateStateBody(
    token: Token,
    signerWallet: Wallet,
    investorWallet: Wallet,
    originTokenState: TokenState,
    destinationTokenState: TokenState,
    tokenClass: string,
    quantity: number,
  ): any {
    try {
      const originPartition: string = this.partitionService.createPartition(
        originTokenState,
        tokenClass,
      );
      const destinationPartition: string =
        this.partitionService.createPartition(
          destinationTokenState,
          tokenClass,
        );

      const body = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          signerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        partition: originPartition,
        from: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        to: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        value: addDecimalsAndConvertToHex(quantity, DECIMALS),
        data: '0x' + 'f'.repeat(64) + destinationPartition.substring(2), // See smart contract code to understand this - Sending 'f'.repeat(64) is a signal to trigger a partition update
        operatorData: EMPTY_CERTIFICATE,
      };

      return body;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'crafting updateState body',
        'craftUpdateStateBody',
        false,
        500,
      );
    }
  }

  /**
   * [Update class of tokens]
   */
  async updateClass(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    investorId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    destinationClass: string,
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<UpdateClassTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.UPDATE_CLASS;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [
        investor,
        issuer,
        token,
        investorTokenLink,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, Token, Link, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId, // investor link with origin class
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
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

      const updateClassMessage = `UpdateClass transaction of ${newQuantity} ${tokenState} ${tokenCategory} tokens, of class ${tokenClass}, from investor ${investorId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${updateClassMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // updateClass
        issuer,
        token,
        config,
        investor, // token sender
        investor, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        tokenState, // destinationTokenState
        destinationClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // updateClass
      );

      const originPartition: string = this.partitionService.createPartition(
        tokenState,
        tokenClass,
      );
      const destinationPartition: string =
        this.partitionService.createPartition(tokenState, destinationClass);

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
        tokenState,
        tokenClass,
        undefined,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

      // Create link with the new asset class if required
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
        destinationClass,
        investorWallet,
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

      const body = {
        contractAddress: web3Utils.toChecksumAddress(
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        signerAddress: web3Utils.toChecksumAddress(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        partition: originPartition,
        from: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        to: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        value: addDecimalsAndConvertToHex(newQuantity, DECIMALS),
        data: '0x' + 'f'.repeat(64) + destinationPartition.substring(2), // See smart contract code to understand this - Sending 'f'.repeat(64) is a signal to trigger a partition update
        operatorData: EMPTY_CERTIFICATE,
      };

      const updateClassResponse: ApiSCResponse =
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
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          tokenState, // destinationTokenState
          destinationClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // updateClass
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        updateClassResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          updateClassResponse[ApiSCResponseKeys.TX_SERIALIZED],
          updateClassResponse[ApiSCResponseKeys.TX],
        ),
        [ActionKeys.DATA__FROM_CLASS]: tokenClass,
        [ActionKeys.DATA__TO_CLASS]: destinationClass,
      };

      const updateClassAction: Action =
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
          undefined,
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
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
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${updateClassMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${updateClassMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${updateClassMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            updateClassResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            updateClassResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: updateClassResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updateClassAction,
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
          tokenAction: updateClassAction,
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
        'updating token class',
        'updateClass',
        false,
        500,
      );
    }
  }

  /**
   * [Create token hold]
   *
   * This function can only be called by a token holder.
   */
  async hold(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    investorId: string,
    recipientId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    nbHoursBeforeExpiration: number,
    secretHash: string,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<HoldTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.HOLD;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      checkSolidityBytes32(secretHash);

      if (!nbHoursBeforeExpiration || nbHoursBeforeExpiration < 1) {
        ErrorService.throwError(
          `number of hours before hold expiration shall higher or equal to 1 (${nbHoursBeforeExpiration} instead)`,
        );
      }

      const [
        investor,
        recipient,
        issuer,
        token,
        investorTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, User, Token, Link, Action, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
        this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
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
          investorId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          tokenClass,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ACTION,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const holdId: string = web3Utils.soliditySha3(
        investor[UserKeys.USER_ID],
        new Date().toString(),
      ); // 'investorId' and 'date' are used as "salts" here

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

      const holdMessage = `Hold of ${newQuantity} ${tokenState} ${tokenCategory.toLowerCase()} token(s), of class ${tokenClass}, from investor ${
        investor[UserKeys.USER_ID]
      }, to investor ${recipient[UserKeys.USER_ID]}, with holdId ${holdId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${holdMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // hold
        issuer,
        token,
        config,
        investor, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        tokenState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // hold
      );

      const holdPartition: string = this.partitionService.createPartition(
        tokenState,
        tokenClass,
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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

      let recipientWallet: Wallet = this.walletService.extractWalletFromUser(
        recipient,
        recipient[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
          undefined, // idFunctionUser
          recipient,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          tokenClass,
          recipientWallet,
        );
      const recipientTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        recipientWallet = this.walletService.extractWalletFromUserEntityLink(
          recipient,
          recipientTokenLink,
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

      const extensionAddress: string =
        await this.apiSCCallService.retrieveTokenExtensionAddress(
          callerId,
          ethService,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        );

      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(extensionAddress),
        signerAddress: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        token: web3Utils.toChecksumAddress(token[TokenKeys.DEFAULT_DEPLOYMENT]),
        holdId: holdId,
        recipient: web3Utils.toChecksumAddress(
          recipientWallet[WalletKeys.WALLET_ADDRESS],
        ),
        notary: web3Utils.toChecksumAddress(HOLD_NOTARY_ADDRESS), // Shall be the ZERO_ADDRESS but is currently forbidden by the smart contract
        partition: holdPartition,
        value: addDecimalsAndConvertToHex(newQuantity, DECIMALS),
        timeToExpiration: nbHoursBeforeExpiration * 3600,
        secretHash: secretHash,
        certificate: EMPTY_CERTIFICATE,
      };

      const holdResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          investor, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          recipient, // tokenRecipient
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          tokenState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // hold
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = holdResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          investor[UserKeys.USER_ID],
          investorWallet,
          nextStatus,
          transactionId,
          ethService,
          holdResponse[ApiSCResponseKeys.TX_SERIALIZED],
          holdResponse[ApiSCResponseKeys.TX],
        ),
      };

      const holdAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName, // hold
          typeFunctionUser,
          investor[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          recipient[UserKeys.USER_ID],
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          investorWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          {
            ...updatedData,
            [ActionKeys.DATA__HOLD]: {
              [ActionKeys.DATA__HOLD__HOLD_ID]: holdId,
              [ActionKeys.DATA__HOLD__HTLC]: {
                [HTLCKeys.SECRET_HASH]: secretHash,
              },
            },
          },
        );

      // If required, schedule a payment submission on behalf of buyer after hold creation
      let scheduleAdditionalAction: string;

      if (data?.[ActionKeys.DATA__AUTOMATE_PAYMENT]) {
        scheduleAdditionalAction =
          FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT;
      }

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName, // hold
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          investorId,
          recipientId,
          issuer[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: investorWallet,
        [HookKeys.RESPONSE_PENDING]: `${holdMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${holdMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${holdMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: holdResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: holdResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: holdResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: holdAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: investorId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: scheduleAdditionalAction,
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
          tokenAction: holdAction,
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
        'creating token hold',
        'hold',
        false,
        500,
      );
    }
  }

  /**
   * [Force token hold creation]
   *
   * This function can only be called by a controller of the token (e.g. the issuer of the token).
   */
  async forceHold(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    issuerId: string,
    investorId: string,
    recipientId: string,
    tokenId: string,
    tokenState: TokenState, // only for hybrid
    tokenClass: string, // only for hybrid
    tokenIdentifier: string, // only for non-fungible
    quantity: number, // only for fungible of hybrid
    forcePrice: number,
    nbHoursBeforeExpiration: number,
    secretHash: string,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<ForceHoldTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.FORCE_HOLD;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      checkSolidityBytes32(secretHash);

      if (!nbHoursBeforeExpiration || nbHoursBeforeExpiration < 1) {
        ErrorService.throwError(
          `number of hours before hold expiration shall higher or equal to 1 (${nbHoursBeforeExpiration} instead)`,
        );
      }

      const [
        investor,
        recipient,
        issuer,
        token,
        investorTokenLink,
        issuerTokenLink,
        actionWithSameKey,
        config,
      ]: [User, User, User, Token, Link, Link, Action, Config] =
        await Promise.all([
          this.apiEntityCallService.fetchEntity(tenantId, investorId, true),
          this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            tokenId,
            EntityType.TOKEN,
          ),
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
            investorId,
            UserType.INVESTOR,
            tokenId,
            EntityType.TOKEN,
            tokenClass,
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

      const holdId: string = web3Utils.soliditySha3(
        investor[UserKeys.USER_ID],
        new Date().toString(),
      ); // 'investorId' and 'date' are used as "salts" here

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

      const forceHoldMessage = `ForceHold of ${newQuantity} ${tokenState} ${tokenCategory.toLowerCase()} token(s), of class ${tokenClass}, from investor ${
        investor[UserKeys.USER_ID]
      }, to investor ${recipient[UserKeys.USER_ID]}, with holdId ${holdId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${forceHoldMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

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
        functionName, // forceHold
        issuer,
        token,
        config,
        investor, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tokenClass, // originTokenClass
        tokenState, // destinationTokenState
        tokenClass, // destinationTokenClass
      );

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceHold
      );

      const holdPartition: string = this.partitionService.createPartition(
        tokenState,
        tokenClass,
      );

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
        tokenState,
        tokenClass,
        tokenIdentifier,
        newQuantity,
        true,
      );

      // ==> Step2: Send the transaction

      let recipientWallet: Wallet = this.walletService.extractWalletFromUser(
        recipient,
        recipient[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
          undefined, // idFunctionUser
          recipient,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          tokenClass,
          recipientWallet,
        );
      const recipientTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        recipientWallet = this.walletService.extractWalletFromUserEntityLink(
          recipient,
          recipientTokenLink,
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

      const extensionAddress: string =
        await this.apiSCCallService.retrieveTokenExtensionAddress(
          callerId,
          ethService,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        );

      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(extensionAddress),
        signerAddress: web3Utils.toChecksumAddress(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        token: web3Utils.toChecksumAddress(token[TokenKeys.DEFAULT_DEPLOYMENT]),
        holdId: holdId,
        sender: web3Utils.toChecksumAddress(
          investorWallet[WalletKeys.WALLET_ADDRESS],
        ),
        recipient: web3Utils.toChecksumAddress(
          recipientWallet[WalletKeys.WALLET_ADDRESS],
        ),
        notary: web3Utils.toChecksumAddress(HOLD_NOTARY_ADDRESS), // Shall be the ZERO_ADDRESS but is currently forbidden by the smart contract
        partition: holdPartition,
        value: addDecimalsAndConvertToHex(newQuantity, DECIMALS),
        timeToExpiration: nbHoursBeforeExpiration * 3600,
        secretHash: secretHash,
        certificate: EMPTY_CERTIFICATE,
      };

      const forceHoldResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer,
          token,
          config,
          investor, // tokenSender
          recipient, // tokenRecipient
          tokenState, // originTokenState
          tokenClass, // originTokenClass
          tokenState, // destinationTokenState
          tokenClass, // destinationTokenClass
          token[TokenKeys.STANDARD], // contractName
          functionName, // forceHold
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = forceHoldResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          investor[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          forceHoldResponse[ApiSCResponseKeys.TX_SERIALIZED],
          forceHoldResponse[ApiSCResponseKeys.TX],
        ),
      };

      const forceHoldAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName, // forceHold
          typeFunctionUser,
          investor[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          recipient[UserKeys.USER_ID],
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount,
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          {
            ...updatedData,
            [ActionKeys.DATA__HOLD]: {
              [ActionKeys.DATA__HOLD__HOLD_ID]: holdId,
              [ActionKeys.DATA__HOLD__HTLC]: {
                [HTLCKeys.SECRET_HASH]: secretHash,
              },
            },
          },
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuerId,
          investorId,
          recipientId,
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${forceHoldMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${forceHoldMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${forceHoldMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: forceHoldResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: forceHoldResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: forceHoldResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: forceHoldAction,
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
          tokenAction: forceHoldAction,
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
        'forcing token hold creation',
        'forceHold',
        false,
        500,
      );
    }
  }

  /**
   * [Execute token hold]
   *
   * This function can only be called by the owner of the htlc secret.
   */
  async executeHold(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    userId: string,
    tokenId: string,
    holdId: string,
    htlcSecret: string,
    forcePrice: number,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<ExecuteHoldTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.EXECUTE_HOLD;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      checkSolidityBytes32(htlcSecret);

      const [user, issuer, token, actionWithSameKey, config]: [
        User,
        User,
        Token,
        Action,
        Config,
      ] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, userId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ACTION,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const executeHoldMessage = `Execution of hold with ID ${holdId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${executeHoldMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // executeHold
      );

      // ==> Step2: Send the transaction

      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          userWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      // Check holdId is valid
      const hold: Hold = await this.apiSCCallService.retrieveHoldIfExisting(
        callerId,
        ethService,
        holdId,
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        false, // check token hold value
        0,
      );
      const quantity = removeDecimalsFromBalances(
        hold[HoldKeys.VALUE],
        DECIMALS,
      );
      const tokenClass: string =
        this.partitionService.retrieveAssetClassFromPartition(
          hold[HoldKeys.PARTITION],
        );

      // Check htlc secret is correct
      checkSecretForHash(htlcSecret, hold[HoldKeys.SECRET_HASH]);

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

      const executeHoldResponse: ApiSCResponse =
        await this.apiSCCallService.executeHold(
          tenantId,
          callerId,
          user, // Signer
          holdId,
          hold[HoldKeys.VALUE],
          htlcSecret,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          userWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId =
        executeHoldResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          user[UserKeys.USER_ID],
          userWallet,
          nextStatus,
          transactionId,
          ethService,
          executeHoldResponse[ApiSCResponseKeys.TX_SERIALIZED],
          executeHoldResponse[ApiSCResponseKeys.TX],
        ),
      };

      const executeHoldAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName, // executeHold
          typeFunctionUser,
          user[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          undefined, // FIXME: recipientId could be retrieved based on Ethereum address.
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          newQuantity,
          newAmount, // price - not used here
          undefined, // documentId - not used here
          userWallet[WalletKeys.WALLET_ADDRESS],
          tokenClass,
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          {
            ...updatedData,
            [ActionKeys.DATA__HOLD]: {
              [ActionKeys.DATA__HOLD__HOLD_ID]: holdId,
              [ActionKeys.DATA__HOLD__HTLC]: {
                [HTLCKeys.SECRET_HASH]: hold[HoldKeys.SECRET_HASH],
                [HTLCKeys.SECRET]: htlcSecret,
              },
            },
          },
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName, // executeHold
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuer[UserKeys.USER_ID]],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: userWallet,
        [HookKeys.RESPONSE_PENDING]: `${executeHoldMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${executeHoldMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${executeHoldMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            executeHoldResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            executeHoldResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: executeHoldResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: executeHoldAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: userId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        userId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: executeHoldAction,
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
        'executing hold',
        'executeHold',
        false,
        500,
      );
    }
  }

  /**
   * [Release token hold]
   *
   * This function can only be called by the owner of the htlc secret.
   */
  async releaseHold(
    tenantId: string,
    idempotencyKey: string,
    tokenCategory: TokenCategory,
    callerId: string,
    userId: string,
    tokenId: string,
    holdId: string,
    data: any,
    typeFunctionUser: UserType,
    authToken: string,
  ): Promise<ReleaseHoldTokenOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.RELEASE_HOLD;
      this.checkCategoryIsSupportedByFunction(tokenCategory, functionName);

      const [user, issuer, token, actionWithSameKey, config]: [
        User,
        User,
        Token,
        Action,
        Config,
      ] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, userId, true),
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ACTION,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const releaseHoldMessage = `Release of hold with ID ${holdId}`;

      // Idempotency
      const targetState = 'executed';
      if (actionWithSameKey) {
        // Action was already created (idempotency)
        return {
          tokenAction: actionWithSameKey,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            actionWithSameKey[ActionKeys.DATA],
            targetState,
          ),
          created: false,
          message: `${releaseHoldMessage} was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.checkTokenSmartContractIsDeployed(token);

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // releaseHold
      );

      // ==> Step2: Send the transaction

      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          userWallet,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      // Check holdId is valid
      const hold: Hold = await this.apiSCCallService.retrieveHoldIfExisting(
        callerId,
        ethService,
        holdId,
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        false, // check token hold value
        0,
      );

      const releaseHoldResponse: ApiSCResponse =
        await this.apiSCCallService.releaseHold(
          tenantId,
          callerId,
          user, // signer
          holdId,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          userWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId =
        releaseHoldResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId = await this.retrieveDefaultBasicsWorkflowId(
        tenantId,
        tokenCategory,
      );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          data,
          user[UserKeys.USER_ID],
          userWallet,
          nextStatus,
          transactionId,
          ethService,
          releaseHoldResponse[ApiSCResponseKeys.TX_SERIALIZED],
          releaseHoldResponse[ApiSCResponseKeys.TX],
        ),
      };

      const releaseHoldAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName, // releaseHold
          typeFunctionUser,
          user[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          undefined, // FIXME: recipientId could be retrieved based on Ethereum address.
          undefined, // brokerId
          undefined, // agentId
          basicsWorkflowId,
          removeDecimalsFromBalances(hold[HoldKeys.VALUE], DECIMALS),
          0, // price - not used here
          undefined, // documentId - not used here
          userWallet[WalletKeys.WALLET_ADDRESS],
          this.partitionService.retrieveAssetClassFromPartition(
            hold[HoldKeys.PARTITION],
          ),
          new Date(),
          BasicWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          {
            ...updatedData,
            [ActionKeys.DATA__HOLD]: {
              [ActionKeys.DATA__HOLD__HOLD_ID]: holdId,
              [ActionKeys.DATA__HOLD__HTLC]: {
                [HTLCKeys.SECRET_HASH]: hold[HoldKeys.SECRET_HASH],
              },
            },
          },
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName, // releaseHold
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuer[UserKeys.USER_ID]],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: userWallet,
        [HookKeys.RESPONSE_PENDING]: `${releaseHoldMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${releaseHoldMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${releaseHoldMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            releaseHoldResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            releaseHoldResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: releaseHoldResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: releaseHoldAction,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: userId,
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        userId,
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          tokenAction: releaseHoldAction,
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
        'releasing hold',
        'releaseHold',
        false,
        500,
      );
    }
  }

  /**
   * [Check whether or not token category is supported by the function]
   */
  checkCategoryIsSupportedByFunction(
    tokenCategory: TokenCategory,
    functionName: FunctionName,
  ): boolean {
    try {
      const supportedCategories: Array<TokenCategory> =
        functionRules[functionName][FunctionRule.SUPPORTED_TOKEN_CATEGORIES];

      if (!(supportedCategories && supportedCategories.length > 0)) {
        ErrorService.throwError(
          `function ${functionName} doesn't support any category`,
        );
      }

      const allCategoriesSupported: boolean =
        supportedCategories.indexOf(TokenCategory.ALL) >= 0;

      if (
        tokenCategory === TokenCategory.FUNGIBLE &&
        (supportedCategories.indexOf(TokenCategory.FUNGIBLE) >= 0 ||
          allCategoriesSupported)
      ) {
        return true;
      } else if (
        tokenCategory === TokenCategory.NONFUNGIBLE &&
        (supportedCategories.indexOf(TokenCategory.NONFUNGIBLE) >= 0 ||
          allCategoriesSupported)
      ) {
        return true;
      } else if (
        tokenCategory === TokenCategory.HYBRID &&
        (supportedCategories.indexOf(TokenCategory.HYBRID) >= 0 ||
          allCategoriesSupported)
      ) {
        return true;
      } else {
        ErrorService.throwError(
          `token category (${tokenCategory}) not supported by function ${functionName}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if category is supported by function',
        'checkCategoryIsSupportedByFunction',
        false,
        500,
      );
    }
  }

  /**
   * [Check whether or not token smart contract is deployed]
   */
  checkTokenSmartContractIsDeployed(token: Token): boolean {
    try {
      if (!token[TokenKeys.DEFAULT_DEPLOYMENT]) {
        ErrorService.throwError(
          `token ${
            token[TokenKeys.TOKEN_ID]
          } deployment is either not finalized or failed`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if token smart contract is deployed',
        'checkTokenSmartContractIsDeployed',
        false,
        500,
      );
    }
  }
}
