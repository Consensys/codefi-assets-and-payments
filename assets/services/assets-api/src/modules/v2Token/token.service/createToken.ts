import { Injectable } from '@nestjs/common';
import { NestJSPinoLogger } from '@consensys/observability';

import ErrorService from 'src/utils/errorService';

import {
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { keys as KycTemplateKeys } from 'src/types/kyc/template';

import { keys as UserKeys, User, UserType } from 'src/types/user';
import { keys as TokenKeys, Token } from 'src/types/token';

import { keys as NetworkKeys } from 'src/types/network';

import { TokenHelperService } from './index';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';

import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { LinkService } from 'src/modules/v2Link/link.service';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { keys as TxKeys, TxStatus } from 'src/types/transaction';
import { keys as HookKeys, HookCallBack, EmailFunctions } from 'src/types/hook';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import { setToLowerCaseExceptFirstLetter } from 'src/utils/case';
import { CreateTokenOutput } from '../token.dto';
import { EntityType } from 'src/types/entity';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import {
  keys as ActionKeys,
  keys as WorkflowInstanceKeys,
  WorkflowType,
  WorkflowInstance,
} from 'src/types/workflow/workflowInstances';
import {
  FunctionName,
  TokenCategory,
  SmartContract,
  CertificateType,
} from 'src/types/smartContract';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';
import { AssetCreationWorkflow } from 'src/old/constants/workflows/assetCreation';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { CERTIFICATE_SIGNER_ADDRESS } from 'src/utils/ethAccounts';
import { keys as SupplyKeys, InitialSupply } from 'src/types/supply';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import { MintTokenOutput } from 'src/modules/v2Transaction/transaction.token.dto';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { checkIntegerFormat } from 'src/utils/number';
import { AssetCreationFlow } from 'src/types/asset';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.ASSET_CREATION;

@Injectable()
export class TokenCreationService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly tokenHelperService: TokenHelperService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly configService: ConfigService,
  ) {}

  async createToken(
    tenantId: string,
    callerId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    issuerWalletAddress: string,
    tokenCategory: TokenCategory,
    tokenStandard: SmartContract,
    tokenName: string,
    tokenSymbol: string,
    chainId: string, // TO BE DEPRECATED (replaced by 'networkKey')
    networkKey: string,
    assetClasses: Array<string>,
    description: string,
    certificateActivated: boolean, // DEPRECATED (replaced by certificateType)
    certificateType: CertificateType,
    unregulatedERC20transfersActivated: boolean,
    picture: string,
    bankDepositDetail: any,
    kycTemplateId: string,
    data: any,
    notaryId: string,
    sendNotification: boolean,
    tokenAddress: string, // optional (token address in case token is already deployed
    customExtensionAddress: string, // optional (custom extension address, in case generic extension shall not be used)
    initialOwnerAddress: string, // optional (owner address in case contract ownership shall be transferred)
    bypassSecondaryTradeIssuerApproval: boolean, // optional (if true, the issuer approval of secondary trade order is not required)
    initialSupplies: Array<InitialSupply>, // optional
    authToken: string,
  ): Promise<CreateTokenOutput> {
    try {
      const functionName: FunctionName = FunctionName.CREATE_TOKEN;

      // ------------- Format all input data (beginning) -------------
      const _tokenStandard: SmartContract =
        this.tokenHelperService.retrieveTokenStandardIfValidOrRetrieveDefaultOne(
          tokenCategory,
          tokenStandard,
        );
      const _assetClasses: Array<string> =
        tokenCategory === TokenCategory.HYBRID
          ? this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
              assetClasses,
            )
          : undefined;
      const _tokenName: string =
        this.tokenHelperService.retrieveTokenNameIfValidOrRetrieveDefaultOne(
          tokenName,
        );
      const _tokenSymbol: string =
        this.tokenHelperService.retrieveTokenSymbolIfValidOrRetrieveDefaultOne(
          tokenSymbol,
        );
      const _description: string =
        this.tokenHelperService.retrieveTokenDescriptionIfValid(description);
      const _certificateTypeAsNumber: number =
        this.tokenHelperService.retrieveCertificateTypeIfValid(
          certificateType,
          tokenStandard,
        );

      // ------------- Format all input data (end) -------------

      // Fetch issuer, and notary (if there is a notary)
      const [issuer, notary, config]: [User, User, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        notaryId
          ? this.apiEntityCallService.fetchEntity(tenantId, notaryId, true)
          : Promise.resolve(undefined),
        this.configService.retrieveTenantConfig(tenantId),
      ]);
      if (notary && notary[UserKeys.USER_TYPE] !== UserType.NOTARY) {
        ErrorService.throwError(
          `user ${
            notary[UserKeys.USER_ID]
          } exists, but is not a notary (${notary[
            UserKeys.USER_TYPE
          ].toLowerCase()} instead)`,
        );
      }

      const _data: any = {
        ...data,
        [TokenKeys.DATA__ASSET_CREATION_FLOW]: AssetCreationFlow.SINGLE_PARTY,
        [TokenKeys.DATA__KYC_TEMPLATE_ID]: (
          await this.kycTemplateService.retrieveKycTemplateIfExistingOrRetrieveIssuerKycTemplate(
            tenantId,
            kycTemplateId,
            issuer,
          )
        )?.[KycTemplateKeys.TEMPLATE_ID],
        [TokenKeys.DATA__BYPASS_KYC_CHECKS]: kycTemplateId ? undefined : true,
        [TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL]:
          bypassSecondaryTradeIssuerApproval || undefined,
        [TokenKeys.DATA__CERTIFICATE_ACTIVATED]: certificateActivated
          ? true
          : false,
        [TokenKeys.DATA__CERTIFICATE_TYPE_AS_NUMBER]: _certificateTypeAsNumber,
        [TokenKeys.DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED]:
          unregulatedERC20transfersActivated ? true : false,
        [TokenKeys.DATA__INITIAL_SUPPLIES]: initialSupplies || undefined,
      };

      const assetCreationWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];

      // If there are initial supplies to be minted, we need to check if investors exist
      if (initialSupplies && initialSupplies.length > 0) {
        await this.checkInitialSupplies(
          tenantId,
          tokenCategory,
          issuer,
          undefined, // token
          config,
          initialSupplies,
        );
      }

      // Retrieve Wallet
      const issuerWallet: Wallet = this.walletService.extractWalletFromUser(
        issuer,
        issuerWalletAddress,
      );

      // Create Ethereum service
      const ethService: EthService =
        await this.ethHelperService.createEthServiceForWallet(
          tenantId,
          issuerWallet,
          chainId, // TO BE DEPRECATED (replaced by 'networkKey')
          networkKey,
          true, // checkEthBalance
          authToken,
        );

      // If contract is already deployed, verify contract exists and issuer is indeed a minter for it
      if (tokenAddress) {
        const minterCheck = await this.apiSCCallService.isMinter(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          tokenAddress,
          ethService,
          _tokenStandard,
        );
        if (!minterCheck) {
          ErrorService.throwError(
            `user's address ${
              issuerWallet[WalletKeys.WALLET_ADDRESS]
            } is not minter for token deployed at address ${tokenAddress} on ${
              ethService[EthServiceKeys.DATA][NetworkKeys.NAME]
            }`,
          );
        }
      }

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createToken
      );

      // Create token in off-chain DB
      const token: Token = await this.apiMetadataCallService.createTokenInDB(
        tenantId,
        _tokenName,
        _tokenSymbol,
        _tokenStandard,
        tokenAddress, // tokenAddress in the case where a new smart contract needs to be deployed
        ethService[EthServiceKeys.DATA][NetworkKeys.CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
        ethService[EthServiceKeys.DATA][NetworkKeys.KEY], // networkKey
        picture,
        _description,
        bankDepositDetail,
        _assetClasses,
        undefined,
        issuerId,
        issuerId,
        undefined,
        _data,
      );

      // Create link between issuer and token
      await this.linkService.createUserEntityLinkIfRequired(
        tenantId,
        typeFunctionUser,
        undefined, // idFunctionUser
        issuer,
        FunctionName.KYC_ADD_ISSUER,
        EntityType.TOKEN,
        undefined, // project
        undefined, // issuer
        token,
        undefined, // assetClassKey --> issuer is issuer of all asset classes
        issuerWallet,
      );

      // Create link between notary and token (if there is a notary)
      if (notaryId) {
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          typeFunctionUser,
          undefined, // idFunctionUser
          notary,
          FunctionName.KYC_ADD_NOTARY,
          EntityType.TOKEN,
          undefined, // project
          undefined, // issuer
          token,
          undefined, // assetClassKey --> notary is notary of all asset classes
          undefined, // wallet
        );
      }

      // IF contract is already deployed, verify contract exists and issuer is indeed a minter for it
      // ELSE deploy a new contract
      if (tokenAddress) {
        // Create workflow instance in off-chain DB
        const workflowInstance: WorkflowInstance =
          await this.workflowService.createWorkflowInstance(
            tenantId,
            undefined, // idempotencyKey
            WorkflowType.TOKEN,
            functionName,
            typeFunctionUser,
            issuer[UserKeys.USER_ID],
            token[TokenKeys.TOKEN_ID],
            EntityType.TOKEN,
            undefined, // objectId
            undefined, // recipientId
            undefined, // brokerId
            undefined, // agentId
            assetCreationWorkflowId,
            0, // quantity
            0, // price
            undefined, // documentId
            issuerWallet[WalletKeys.WALLET_ADDRESS],
            undefined, // assetClass
            new Date(),
            AssetCreationWorkflow.DEPLOYED, // AssetCreationWorkflow.NOT_STARTED,
            undefined, //offerId
            undefined, //orderSide
            data,
          );

        return {
          token: token,
          transactionId: undefined, // smart contract was already deployed
          tokenAction: workflowInstance,
          updated: true,
          message: `${setToLowerCaseExceptFirstLetter(tokenCategory)} token ${
            token[TokenKeys.TOKEN_ID]
          } created successfully (token found on ${
            ethService[EthServiceKeys.DATA][NetworkKeys.NAME]
          } at address ${tokenAddress})`,
        };
      }

      // Deploy a new smart contract
      const deploymentResponse: ApiSCResponse =
        await this.apiSCCallService.deploySmartContract(
          tenantId,
          issuer, // signer
          _tokenStandard,
          issuerWallet[WalletKeys.WALLET_ADDRESS], // signerAddress
          ethService,
          await this.tokenHelperService.createParametersForTokenDeployment(
            callerId,
            ethService,
            _tokenStandard,
            _tokenName,
            _tokenSymbol,
            issuerWallet[WalletKeys.WALLET_ADDRESS], // only for ERC1400 (controller)
            CERTIFICATE_SIGNER_ADDRESS, // only for ERC1400
            certificateActivated, // DEPRECATED (replaced by certificateTypeAsNumber)
            _certificateTypeAsNumber,
            unregulatedERC20transfersActivated, // only for ERC1400
            _assetClasses, // only for ERC1400
            customExtensionAddress, // optional
            initialOwnerAddress, // optional
            '', // only for ERC721
            '', // only for ERC721
          ),
          authToken,
          config,
        );

      const transactionId = deploymentResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      const updatedData = {
        ...this.transactionHelperService.addPendingTxToData(
          {}, // token[TokenKeys.DATA] ==> CAUTION: here we used to copy token's data, but we don't do it anymore. Otherwise it erases token data later in "appendWorflowDataToToken" function
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          deploymentResponse[ApiSCResponseKeys.TX_SERIALIZED],
          deploymentResponse[ApiSCResponseKeys.TX],
        ),
      };

      // Create workflow instance in off-chain DB
      const workflowInstance: WorkflowInstance =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          undefined, // idempotencyKey
          WorkflowType.TOKEN,
          functionName,
          typeFunctionUser,
          issuer[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          undefined, // recipientId
          undefined, // brokerId
          undefined, // agentId
          assetCreationWorkflowId,
          0, // quantity
          0, // price
          undefined, // documentId
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          undefined, // assetClass
          new Date(),
          AssetCreationWorkflow.NOT_STARTED, // AssetCreationWorkflow.NOT_STARTED,
          undefined, //offerId
          undefined, //orderSide
          updatedData,
        );

      const tokenUpdates = {
        [TokenKeys.DATA]: {
          ...token[TokenKeys.DATA],
          [TokenKeys.DATA__WORKFLOW_INSTANCE_ID]:
            workflowInstance[WorkflowInstanceKeys.ID],
        },
      };

      // In case of synchronous web3 transactions, we already have the token address and can store it in the data
      if (ethService[EthServiceKeys.TYPE] === EthServiceType.WEB3) {
        const deployedTokenAddress: string =
          deploymentResponse[ApiSCResponseKeys.TX][TxKeys.WEB3_RECEIPT][
            TxKeys.RECEIPT_CONTRAT_ADDRESS
          ];

        if (deployedTokenAddress) {
          tokenUpdates[TokenKeys.DEFAULT_DEPLOYMENT] = deployedTokenAddress;
        }
      }

      // Update token state in off-chain DB
      const updatedToken: Token =
        await this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          tokenUpdates,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: sendNotification
          ? [EmailFunctions.TOKEN_CREATION]
          : undefined,
        [HookKeys.USERS_TO_REFRESH]: [callerId, issuerId],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextStatus,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${setToLowerCaseExceptFirstLetter(
          tokenCategory,
        )} token ${
          token[TokenKeys.TOKEN_ID]
        } created successfully (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${setToLowerCaseExceptFirstLetter(
          tokenCategory,
        )} token ${updatedToken[TokenKeys.TOKEN_ID]} creation succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${setToLowerCaseExceptFirstLetter(
          tokenCategory,
        )} token ${updatedToken[TokenKeys.TOKEN_ID]} creation failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: deploymentResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: deploymentResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: deploymentResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: workflowInstance,
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

      // Check initial supplies & create links between investors and token.
      // This step can potentially fail if users are not valid, which is why we put it in
      // last position as we don't want it to block token creation
      if (initialSupplies && initialSupplies.length > 0) {
        // Check initial supplies - this step can potentially fail if users are not valid
        const initialUsersAndWallets: {
          [userId: string]: { user: User; wallet: Wallet };
        } = await this.checkInitialSupplies(
          tenantId,
          tokenCategory,
          issuer,
          token,
          config,
          initialSupplies,
        );

        // Create user-token links
        await Promise.all(
          initialSupplies.map((initialSupply: InitialSupply) => {
            const userId = initialSupply[SupplyKeys.USER_ID];
            const user = initialUsersAndWallets[userId].user;
            const userWallet = initialUsersAndWallets[userId].wallet;
            return this.linkService.createUserEntityLinkIfRequired(
              tenantId,
              typeFunctionUser,
              undefined, // idFunctionUser
              user,
              FunctionName.KYC_INVITE,
              EntityType.TOKEN,
              undefined, // entityProject
              undefined, // entityIssuer
              token, // entityToken
              initialSupply[SupplyKeys.TOKEN_CLASS],
              userWallet,
            );
          }),
        );
      }

      // Return response
      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          token: updatedToken,
          tokenAction: workflowInstance,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response: CreateTokenOutput = await this.tokenCreation_hook(
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
        'creating token',
        'createToken',
        false,
        500,
      );
    }
  }

  /**
   * [Create a new token - Hook callback function trigerred after transaction validation]
   * Finalizes token creation workflow once the smart contract has been deployed
   * on the blockchain.
   */
  async tokenCreation_hook(
    tenantId,
    hookCallbackData: HookCallBack,
    identifierOrTxHash: string,
    txStatus: TxStatus,
  ): Promise<CreateTokenOutput> {
    try {
      this.logger.info(
        {},
        `****** TX RECEIPT (token creation hook) (${txStatus}) ******\n`,
      );

      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        hookCallbackData[HookKeys.TOKEN_ID],
        true,
        undefined,
        undefined,
        true,
      );

      const tokenUpdates: Token = {
        ...token,
        [TokenKeys.DEFAULT_DEPLOYMENT]:
          hookCallbackData[HookKeys.CONTRACT_ADDRESS], // Contract address has been injected in 'hookCallbackData' just before, when /hook endpoint was called
      };

      // Update token in off-chain DB (to register address) + unpdate workflow instance by triggering action hook
      const [updatedToken, workflowInstanceHookResponse]: [
        Token,
        {
          workflowInstance: WorkflowInstance;
          transactionId: string;
          message: string;
        },
      ] = await Promise.all([
        // "updateToken" is called a first time here, because we want to make sure this operation succeeds.
        // It will potentially be called a second time down there in case there is an initial supply to mint (which can potentially fail)
        this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          tokenUpdates[TokenKeys.TOKEN_ID],
          tokenUpdates,
        ),
        this.transactionHelperService.workflowInstance_hook(
          tenantId,
          hookCallbackData,
          identifierOrTxHash,
          txStatus,
        ),
      ]);

      /*******************************************************************************************/
      /*******************************************************************************************/
      // Check if token initial supplies need to be minted after smart contract deployment
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_SUPPLIES]
      ) {
        const initialSupplies: Array<InitialSupply> =
          token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_SUPPLIES];

        // Schedule a token update after minting, to update token.data an
        // inform end user, the initial supplies have been minted
        const scheduleAdditionalAction = FunctionName.UPDATE_TOKEN_DATA;

        if (initialSupplies && initialSupplies.length > 0) {
          const mintingResponses: Array<MintTokenOutput> = await Promise.all(
            initialSupplies.map(async (initialSupply: InitialSupply) => {
              // Initial supply minting can potentially fail (ex: if investor is not allowlisted, etc.), which is why we use a try/catch here
              try {
                this.logger.info(
                  {},
                  `****** Mint initial supply of ${
                    initialSupply[SupplyKeys.QUANTITY]
                  } tokens for user ${
                    initialSupply[SupplyKeys.USER_ID]
                  } ******\n`,
                );
                const mintingResponse: MintTokenOutput =
                  await this.tokenTxHelperService.mint(
                    tenantId,
                    undefined, // idempotencyKey
                    hookCallbackData[HookKeys.TOKEN_CATEGORY],
                    hookCallbackData[HookKeys.CALLER_ID],
                    hookCallbackData[HookKeys.USER_ID], // issuerId
                    token[TokenKeys.TOKEN_ID],
                    initialSupply[SupplyKeys.USER_ID],
                    initialSupply[SupplyKeys.TOKEN_STATE], // only for hybrid
                    initialSupply[SupplyKeys.TOKEN_CLASS], // only for hybrid
                    initialSupply[SupplyKeys.TOKEN_IDENTIFIER], // only for non-fungible
                    initialSupply[SupplyKeys.QUANTITY], // only for fungible of hybrid
                    initialSupply[SupplyKeys.FORCE_PRICE],
                    initialSupply[SupplyKeys.DATA],
                    hookCallbackData[HookKeys.TYPE_FUNCTION_USER],
                    scheduleAdditionalAction, // scheduleAdditionalAction
                    false, // sendNotification
                    hookCallbackData[HookKeys.AUTH_TOKEN],
                  );
                return mintingResponse;
              } catch (error) {
                const errorMessage = error?.message ? error.message : error;
                this.logger.info(
                  {},
                  `****** Error minting initial supply of ${
                    initialSupply[SupplyKeys.QUANTITY]
                  } tokens for user ${
                    initialSupply[SupplyKeys.USER_ID]
                  } : ${errorMessage} ******\n`,
                );

                return {
                  tokenAction: undefined,
                  created: false,
                  transactionId: undefined,
                  message: `Error minting initial supply: ${errorMessage}`,
                };
              }
            }),
          );

          const updatedInitialSupplies: Array<InitialSupply> =
            initialSupplies.map(
              (initialSupply: InitialSupply, index: number) => {
                if (mintingResponses[index].transactionId) {
                  return {
                    ...initialSupply,
                    [SupplyKeys.WORKFLOW_INSTANCE_ID]:
                      mintingResponses[index].tokenAction[ActionKeys.ID],
                    [SupplyKeys.TRANSACTION_ID]:
                      mintingResponses[index].transactionId,
                    [SupplyKeys.TRANSACTION_STATUS]: TxStatus.PENDING,
                  };
                } else {
                  // Case when error got caught when minting tokens
                  return initialSupply;
                }
              },
            );

          // Fetch updated token (if we were to use the initially fetched token, it would not include an updated address)
          const token2 = await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            hookCallbackData[HookKeys.TOKEN_ID],
            true,
            undefined,
            undefined,
            true,
          );

          // Save updated initialSupplies in token data
          const tokenUpdates2: Token = {
            ...token2,
            [TokenKeys.DATA]: {
              ...token2[TokenKeys.DATA],
              [TokenKeys.DATA__INITIAL_SUPPLIES]: updatedInitialSupplies, // Override initial supplies with
            },
          };

          // Here we call "updateToken" because we don't want the first call to fail in case there's an issue with miniting of initialSupplies (which can potentially occur..)
          await this.apiMetadataCallService.updateTokenInDB(
            tenantId,
            tokenUpdates2[TokenKeys.TOKEN_ID],
            tokenUpdates2,
          );
        }
      }
      /*******************************************************************************************/
      /*******************************************************************************************/

      return {
        token: updatedToken,
        tokenAction: workflowInstanceHookResponse.workflowInstance,
        updated: true,
        transactionId: workflowInstanceHookResponse.transactionId,
        message: workflowInstanceHookResponse.message,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calling token creation callback hook function',
        'tokenCreation_hook',
        false,
        500,
      );
    }
  }

  /**
   * [Check initial supplies]
   */
  async checkInitialSupplies(
    tenantId: string,
    tokenCategory: TokenCategory,
    issuer: User,
    token: Token,
    config: Config,
    initialSupplies: Array<InitialSupply>,
  ): Promise<{ [userId: string]: { user: User; wallet: Wallet } }> {
    try {
      const MAX_INITIAL_SUPPLIES_LENGTH = 3;
      if (
        initialSupplies &&
        initialSupplies.length > MAX_INITIAL_SUPPLIES_LENGTH
      ) {
        ErrorService.throwError(
          `Length of initialSupplies shall not exceed ${MAX_INITIAL_SUPPLIES_LENGTH} (${initialSupplies.length})`,
        );
      }

      const initialUsers: Array<{
        user: User;
        wallet: Wallet;
      }> = await Promise.all(
        initialSupplies.map((initialSupply: InitialSupply) => {
          return this.checkInitialSupply(
            tenantId,
            tokenCategory,
            issuer,
            token,
            config,
            initialSupply,
          );
        }),
      );
      return initialUsers.reduce(
        (map, curr: { user: User; wallet: Wallet }) => ({
          ...map,
          [curr.user[UserKeys.USER_ID]]: curr,
        }),
        {},
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking initial supplies',
        'checkInitialSupplies',
        false,
        500,
      );
    }
  }

  /**
   * [Check initial supply]
   */
  async checkInitialSupply(
    tenantId: string,
    tokenCategory: TokenCategory,
    issuer: User,
    token: Token,
    config: Config,
    initialSupply: InitialSupply,
  ): Promise<{ user: User; wallet: Wallet }> {
    try {
      // Check if user exists
      const userId = initialSupply[SupplyKeys.USER_ID];
      const user = await this.apiEntityCallService.fetchEntity(
        tenantId,
        userId,
        true,
      );

      // Check if user has valid wallet to receive tokens
      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        user[UserKeys.DEFAULT_WALLET],
      );

      // Check quantity and price are properly formatted
      checkIntegerFormat(
        initialSupply[SupplyKeys.QUANTITY],
        initialSupply[SupplyKeys.FORCE_PRICE],
      );

      // If token is already defiend, we want to check if user is allowed to receive tokens
      if (token) {
        await this.transactionHelperService.checkTxCompliance(
          tenantId,
          tokenCategory,
          FunctionName.MINT, // mint
          issuer,
          token,
          config,
          undefined, // token sender
          user, // token recipient
          undefined, // originTokenState
          undefined, // originTokenClass
          initialSupply[SupplyKeys.TOKEN_STATE], // destinationTokenState
          initialSupply[SupplyKeys.TOKEN_CLASS], // destinationTokenClass
        );
      }

      return {
        user,
        wallet: userWallet,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking initial supply',
        'checkInitialSupply',
        false,
        500,
      );
    }
  }
}
