import { Injectable } from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { keys as HookKeys, HookCallBack } from 'src/types/hook';

import { Action } from 'src/types/workflow/workflowInstances/action';
import { keys as ActionKeys } from 'src/types/workflow/workflowInstances';

import { TokenHelperService } from './index';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import { TokenCategory, FunctionName } from 'src/types/smartContract';
import { LinkService } from 'src/modules/v2Link/link.service';
import { keys as UserKeys, User, UserType } from 'src/types/user';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import { EntityType } from 'src/types/entity';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import {
  AllowListOutput,
  ExtensionOutput,
  OwnershipOutput,
} from '../token.dto';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { convertCategoryToDeprecatedEnum } from 'src/utils/deprecated';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { ApiWorkflowWorkflowInstanceService } from 'src/modules/v2ApiCall/api.call.service/workflow';
import {
  WorkflowType,
  WorkflowInstance,
} from 'src/types/workflow/workflowInstances';
import { BasicWorkflow } from 'src/old/constants/workflows/basic';
import { TxStatus } from 'src/types/transaction';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';
import {
  AssetData,
  AssetDataKeys,
  CollectibleStorageType,
  GeneralDataKeys,
} from 'src/types/asset';
import { AssetType } from 'src/types/asset/template';
import { ApiExternalStorageCallService } from 'src/modules/v2ApiCall/api.call.service/externalStorage';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';

@Injectable()
export class TokenUpdateService {
  constructor(
    private readonly tokenHelperService: TokenHelperService,
    private readonly linkService: LinkService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly transactionHelperService: TransactionHelperService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly entityService: EntityService,
    private readonly configService: ConfigService,
    private readonly externalStrorage: ApiExternalStorageCallService,
    private readonly assetDataService: AssetDataService,
  ) {}

  /**
   * [update a token's metadata]
   */
  async updateToken(
    tenantId: string,
    tokenCategory: TokenCategory,
    userId: string,
    tokenId: string,
    updatedParameters: any,
  ): Promise<Token> {
    try {
      let token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      await this.entityService.checkEntityCanBeUpdatedOrDeleted(
        tenantId,
        userId,
        tokenId,
        EntityType.TOKEN,
        token,
      );

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      if (!updatedParameters) {
        ErrorService.throwError('wrong input format for parameters to update');
      }

      const { defaultContractAddress, data, elementInstances } =
        updatedParameters;
      let baseUri = null;
      if (elementInstances.length > 0) {
        // Extract workflow instance ID from token
        const workflowInstanceId: number =
          this.assetDataService.retrieveAssetWorkflowInstance(token);
        const [issuerTokenlink, issuer, workflowInstance] = await Promise.all([
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            userId,
            UserType.ISSUER,
            tokenId,
            EntityType.TOKEN,
            undefined, // assetClassKey
          ),
          this.apiEntityCallService.fetchEntity(tenantId, userId, true),
          this.workflowService.retrieveWorkflowInstances(
            tenantId,
            WorkflowInstanceEnum.id,
            workflowInstanceId,
            undefined, // idempotencyKey
            undefined,
            undefined,
            undefined,
            undefined, // entityType
            WorkflowType.TOKEN,
            undefined, // otherWorkflowType
            true,
          ),
        ]);
        // save elementInstances in DB
        await this.assetDataService.saveAssetData(
          tenantId,
          issuer,
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
          elementInstances,
          {},
        );

        token = await this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tokenId,
          true,
          undefined,
          undefined,
          true,
        );

        const assetData: AssetData = token[TokenKeys.ASSET_DATA];
        if (
          assetData &&
          assetData[AssetDataKeys.TYPE] === AssetType.COLLECTIBLE
        ) {
          const storageType =
            assetData[AssetDataKeys.ASSET][GeneralDataKeys.STORAGE];
          // Retrieve Wallet
          const issuerWallet: Wallet =
            this.walletService.extractWalletFromUserEntityLink(
              issuer,
              issuerTokenlink,
            );
          const contractMetadata =
            this.tokenHelperService.craftContractMetadata(
              tenantId,
              assetData,
              issuerWallet[WalletKeys.WALLET_ADDRESS],
              storageType,
            );
          if (storageType === CollectibleStorageType.IPFS) {
            if (workflowInstance[ActionKeys.STATE] === 'deployed') {
              baseUri = await this.externalStrorage.updateIpfs(
                tenantId,
                token[TokenKeys.TOKEN_ID],
                contractMetadata,
              );
            } else {
              baseUri = await this.externalStrorage.uploadIpfs(
                tenantId,
                token[TokenKeys.TOKEN_ID],
                contractMetadata,
              );
            }
          } else {
            if (workflowInstance[ActionKeys.STATE] === 'deployed') {
              baseUri = await this.externalStrorage.updatePublic(
                tenantId,
                token[TokenKeys.TOKEN_ID],
                contractMetadata,
              );
            } else {
              baseUri = await this.externalStrorage.uploadPublic(
                tenantId,
                token[TokenKeys.TOKEN_ID],
                contractMetadata,
              );
            }
          }
        }
      }

      const newData = {
        ...token[TokenKeys.DATA],
        ...data,
        baseUri,
      };
      // cleanup data by removing keys with null values
      Object.keys(newData).forEach((key) => {
        if (newData[key] === null) {
          delete newData[key];
        }
      });

      const updatedToken: Token =
        await this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          {
            defaultContractAddress,
            data: newData,
          },
        );

      return updatedToken;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating token',
        'updateToken',
        false,
        500,
      );
    }
  }

  async allowlistOnChain(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    tokenId: string,
    submitterId: string,
    addOnAllowlist: boolean,
    authToken: string,
  ): Promise<AllowListOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = addOnAllowlist
        ? FunctionName.ADD_ALLOWLISTED
        : FunctionName.REMOVE_ALLOWLISTED;

      const [
        issuer,
        submitter,
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
        this.apiEntityCallService.fetchEntity(tenantId, submitterId, true),
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

      const allowlistedMessage = `User ${submitterId} 's ${
        addOnAllowlist ? 'addition' : 'removal'
      } on token ${tokenId} 's on-chain allowlist`;

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
          message: `${allowlistedMessage} was already done (idempotencyKey)`,
        };
      }

      let tokenCategory;
      if (token[TokenKeys.STANDARD].includes('ERC1400')) {
        tokenCategory = TokenCategory.HYBRID;
      } else if (token[TokenKeys.STANDARD].includes('ERC721')) {
        tokenCategory = TokenCategory.NONFUNGIBLE;
      } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
        tokenCategory = TokenCategory.FUNGIBLE;
      } else {
        ErrorService.throwError(
          `unknown token standard: ${token[TokenKeys.STANDARD]}`,
        );
      }

      if (tokenCategory !== TokenCategory.HYBRID) {
        ErrorService.throwError(
          `On-chain allowlists can only be configured for tokens of ${TokenCategory.HYBRID} category`,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // addAllowlisted/removeAllowlisted
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
        );

      let submitterWallet: Wallet = this.walletService.extractWalletFromUser(
        submitter,
        submitter[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          submitter,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          undefined, // assetClassKey
          submitterWallet,
        );
      const submitterTokenLink: Link = linkCreation.link;

      // If link already existed, we need to retrieve the wallet that was stored in it
      if (!linkCreation.newLink) {
        submitterWallet = this.walletService.extractWalletFromUserEntityLink(
          submitter,
          submitterTokenLink,
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

      // Check if issuer is an allowlist admin on-chain
      const canUpdateOnChainAllowlist =
        await this.tokenHelperService.canUpdateAllowlist(
          callerId, // required for cache management
          ethService,
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          token[TokenKeys.STANDARD],
        );

      if (!canUpdateOnChainAllowlist) {
        ErrorService.throwError(
          `issuer ${issuer[UserKeys.USER_ID]} 's address ${
            issuerWallet[WalletKeys.WALLET_ADDRESS]
          } is not an allowlist admin address, thus can not add/remove addresses on the on-chain allowlist`,
        );
      }

      // Check if submitter is already allowlisted on-chain or not
      const isOnChainAllowlisted = await this.apiSCCallService.isAllowlisted(
        callerId,
        submitterWallet[WalletKeys.WALLET_ADDRESS],
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        ethService,
      );
      if (addOnAllowlist && isOnChainAllowlisted) {
        ErrorService.throwError(
          `users ${submitter[UserKeys.USER_ID]} 's address ${
            submitterWallet[WalletKeys.WALLET_ADDRESS]
          } is already added on on-chain allowlist`,
        );
      }
      if (!addOnAllowlist && !isOnChainAllowlisted) {
        ErrorService.throwError(
          `users ${submitter[UserKeys.USER_ID]} 's address ${
            submitterWallet[WalletKeys.WALLET_ADDRESS]
          } is already removed from on-chain allowlist`,
        );
      }

      const allowlistResponse: ApiSCResponse = addOnAllowlist
        ? await this.apiSCCallService.addAllowlisted(
            tenantId,
            callerId,
            issuer, // signer
            submitterWallet[WalletKeys.WALLET_ADDRESS],
            token[TokenKeys.DEFAULT_DEPLOYMENT],
            issuerWallet[WalletKeys.WALLET_ADDRESS],
            ethService,
            authToken,
            config,
          )
        : await this.apiSCCallService.removeAllowlisted(
            tenantId,
            callerId,
            issuer, // signer
            submitterWallet[WalletKeys.WALLET_ADDRESS],
            token[TokenKeys.DEFAULT_DEPLOYMENT],
            issuerWallet[WalletKeys.WALLET_ADDRESS],
            ethService,
            authToken,
            config,
          );
      const transactionId = allowlistResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId =
        await this.tokenTxHelperService.retrieveDefaultBasicsWorkflowId(
          tenantId,
          tokenCategory,
        );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          {}, // data
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          allowlistResponse[ApiSCResponseKeys.TX_SERIALIZED],
          allowlistResponse[ApiSCResponseKeys.TX],
        ),
      };

      const allowlistedAction: WorkflowInstance =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          issuer[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId - not used here
          undefined, // recipientID - not used here
          undefined, // brokerId - not used here
          undefined, // agentId - not used here
          basicsWorkflowId,
          0, // quantity - not used here
          0, // price - not used here
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          undefined, // tokenClass - not used here
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
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuerId, submitterId],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${allowlistedMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${allowlistedMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${allowlistedMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: allowlistResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: allowlistResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: allowlistResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: allowlistedAction,
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
          tokenAction: allowlistedAction,
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
        'adding/removing allowlisted on-chain',
        'allowlistOnChain',
        false,
        500,
      );
    }
  }

  async transferContractOwnership(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    tokenId: string,
    newOwnerAddress: string,
    authToken: string,
  ): Promise<ExtensionOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName = FunctionName.TRANSFER_OWNERSHIP;

      const [issuer, token, issuerTokenLink, actionWithSameKey, config]: [
        User,
        Token,
        Link,
        Action,
        Config,
      ] = await Promise.all([
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

      const ownershipTransferMessage = `Contract ownership transfer of token ${tokenId} to address ${newOwnerAddress}`;

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
          message: `${ownershipTransferMessage} was already done (idempotencyKey)`,
        };
      }

      let tokenCategory;
      if (token[TokenKeys.STANDARD].includes('ERC1400')) {
        tokenCategory = TokenCategory.HYBRID;
      } else if (token[TokenKeys.STANDARD].includes('ERC721')) {
        tokenCategory = TokenCategory.NONFUNGIBLE;
      } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
        tokenCategory = TokenCategory.FUNGIBLE;
      } else {
        ErrorService.throwError(
          `unknown token standard: ${token[TokenKeys.STANDARD]}`,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // transferOwnership
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
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

      const ownerWallet = await this.apiSCCallService.owner(
        callerId,
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        ethService,
        token[TokenKeys.STANDARD],
      );

      if (ownerWallet !== issuerWallet[WalletKeys.WALLET_ADDRESS]) {
        ErrorService.throwError(
          `contract ownership has already been transferred: it now belongs to address ${ownerWallet}, while issuers wallet is ${
            issuerWallet[WalletKeys.WALLET_ADDRESS]
          }`,
        );
      }

      const ownershipTransferResponse: ApiSCResponse =
        await this.apiSCCallService.transferOwnership(
          tenantId,
          issuer, // signer
          token[TokenKeys.STANDARD],
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          newOwnerAddress,
          ethService,
          authToken,
          config,
        );
      const transactionId =
        ownershipTransferResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId =
        await this.tokenTxHelperService.retrieveDefaultBasicsWorkflowId(
          tenantId,
          tokenCategory,
        );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          {}, // data
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          ownershipTransferResponse[ApiSCResponseKeys.TX_SERIALIZED],
          ownershipTransferResponse[ApiSCResponseKeys.TX],
        ),
      };

      const ownershipTransferAction: WorkflowInstance =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          issuer[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId - not used here
          undefined, // recipientID - not used here
          undefined, // brokerId - not used here
          undefined, // agentId - not used here
          basicsWorkflowId,
          0, // quantity - not used here
          0, // price - not used here
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          undefined, // tokenClass - not used here
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
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuerId],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${ownershipTransferMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${ownershipTransferMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${ownershipTransferMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            ownershipTransferResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            ownershipTransferResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]:
          ownershipTransferResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: ownershipTransferAction,
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
          tokenAction: ownershipTransferAction,
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
        'transferring contract ownership',
        'transferContractOwnership',
        false,
        500,
      );
    }
  }

  async setCustomTokenExtension(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    tokenId: string,
    customExtensionAddress: string,
    authToken: string,
  ): Promise<OwnershipOutput> {
    try {
      // Preliminary step: Fetch all required data in databases

      const functionName: FunctionName =
        FunctionName.SET_CUSTOM_TOKEN_EXTENSION;

      const [issuer, token, issuerTokenLink, actionWithSameKey, config]: [
        User,
        Token,
        Link,
        Action,
        Config,
      ] = await Promise.all([
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

      const customExtensionMessage = `Setup of custom extension ${customExtensionAddress} for token ${tokenId}`;

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
          message: `${customExtensionMessage} was already done (idempotencyKey)`,
        };
      }

      let tokenCategory;
      if (token[TokenKeys.STANDARD].includes('ERC1400')) {
        tokenCategory = TokenCategory.HYBRID;
      } else if (token[TokenKeys.STANDARD].includes('ERC721')) {
        tokenCategory = TokenCategory.NONFUNGIBLE;
      } else if (token[TokenKeys.STANDARD].includes('ERC20')) {
        tokenCategory = TokenCategory.FUNGIBLE;
      } else {
        ErrorService.throwError(
          `unknown token standard: ${token[TokenKeys.STANDARD]}`,
        );
      }

      if (tokenCategory !== TokenCategory.HYBRID) {
        ErrorService.throwError(
          `Token extensions can only be setup for tokens of ${TokenCategory.HYBRID} category`,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the token (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        convertCategoryToDeprecatedEnum(tokenCategory),
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // setCustomTokenExtension
      );

      // ==> Step2: Send the transaction

      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenLink,
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

      // Check if custom token extension address is valid
      await this.tokenHelperService.checkValidExtensionAddress(
        callerId, // required for cache management
        ethService,
        customExtensionAddress,
      );

      // Check if custom token extension is not already setup
      const currentExtensionContract =
        await this.apiSCCallService.retrieveTokenExtensionAddress(
          callerId,
          ethService,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
        );
      if (currentExtensionContract === customExtensionAddress) {
        ErrorService.throwError(
          `token is already linked to extension at address ${customExtensionAddress}`,
        );
      }

      // Check if issuer is the token owner (only the owner can set a custom token extension)
      const ownerWallet = await this.apiSCCallService.owner(
        callerId,
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        ethService,
        token[TokenKeys.STANDARD],
      );
      if (issuerWallet[WalletKeys.WALLET_ADDRESS] !== ownerWallet) {
        ErrorService.throwError(
          `issuer's key (${
            issuerWallet[WalletKeys.WALLET_ADDRESS]
          }) is different from token smart contract owner (${ownerWallet}). This is an issue because only the token owner can update the token's extension`,
        );
      }

      const customExtensionResponse: ApiSCResponse =
        await this.apiSCCallService.setCustomTokenExtension(
          tenantId,
          issuer, // signer
          customExtensionAddress,
          token[TokenKeys.STANDARD],
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId =
        customExtensionResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const basicsWorkflowId =
        await this.tokenTxHelperService.retrieveDefaultBasicsWorkflowId(
          tenantId,
          tokenCategory,
        );

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          {}, // data
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          customExtensionResponse[ApiSCResponseKeys.TX_SERIALIZED],
          customExtensionResponse[ApiSCResponseKeys.TX],
        ),
      };

      const customExtensionAction: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          issuer[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId - not used here
          undefined, // recipientID - not used here
          undefined, // brokerId - not used here
          undefined, // agentId - not used here
          basicsWorkflowId,
          0, // quantity - not used here
          0, // price - not used here
          undefined, // documentId - not used here
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          undefined, // tokenClass - not used here
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
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuerId],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${customExtensionMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${customExtensionMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${customExtensionMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            customExtensionResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            customExtensionResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]:
          customExtensionResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: customExtensionAction,
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
          tokenAction: customExtensionAction,
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
        'setting custom extension',
        'setCustomTokenExtension',
        false,
        500,
      );
    }
  }
}
