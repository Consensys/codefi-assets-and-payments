/**
 * There are 3 possible asset creation flows.
 *
 * 1) ***** SINGLE-PARTY ASSET CREATION FLOW *****
 *
 * The single-party asset creation workflow allows an issuer to initialize the creation of a new asset by:
 *  1) Issuer initializes asset off-chain
 *  2) Issuer updates asset off-chain (optional)
 *  3) Issuer deploys the asset on-chain
 *
 *  initializeAssetInstance  _____________   deployAssetInstance   __________
 *          -->             | INITIALIZED |          -->          | DEPLOYED |
 *       [issuer]            -------------         [issuer]        ----------
 *
 *
 *
 *
 * 2) ***** BI-PARTY ASSET CREATION FLOW *****
 *
 * The bi-party asset creation workflow allows an investor to initialize the creation of a new asset by:
 *  1) Investor initializes asset off-chain
 *  2) Investor updates asset off-chain (optional)
 *  3) Investor submits asset off-chain
 *  4) Issuer updates asset off-chain (optional)
 *  5) After review, issuer deploys the asset on-chain (or issuer rejects the submitted asset)
 *
 *  initializeAssetInstance  _________________     submitAssetInstance   ___________   deployAssetInstance   __________
 *          -->             | PRE_INITIALIZED |          -->            | SUBMITTED |         -->           | DEPLOYED |
 *       [investor]          -----------------         [investor]        -----------        [issuer]         ----------
 *
 *
 *
 *
 * 3) ***** TRI-PARTY ASSET CREATION FLOW *****
 *
 * The tri-party asset creation workflow allows an underwrite to initialize the creation of a new asset by:
 *  1) Underwriter initializes asset off-chain
 *  2) Underwriter updates asset off-chain (optional)
 *  3) Underwriter submits asset off-chain
 *  3) After review, investor submits asset off-chain (or investor rejects the submitted asset)
 *  4) Issuer updates asset off-chain (optional)
 *  5) After review, issuer deploys the asset on-chain (or issuer rejects the submitted asset)
 *
 *  initializeAssetInstance  ___________________    submitAssetInstance      _________________     submitAssetInstance   ___________   deployAssetInstance   __________
 *            -->           | PRE_INITIALIZED_2 |           -->             | PRE_INITIALIZED |          -->            | SUBMITTED |         -->           | DEPLOYED |
 *       [underwriter]       -------------------      [underwriter]          -----------------         [investor]        -----------        [issuer]         ----------
 *
 */

import web3Utils from 'web3-utils';

import {
  WorkflowInstanceEnum,
  TokenIdentifierEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';
import { keys as TokenKeys, Token } from 'src/types/token';
import { InitialSupply, keys as SupplyKeys } from 'src/types/supply';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { Injectable } from '@nestjs/common';
import {
  InitAssetInstanceOutput,
  DeployAssetOutput,
} from '../workflows.digitalasset.dto';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import { TokenHelperService } from 'src/modules/v2Token/token.service';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as NetworkKeys, Network } from 'src/types/network';

import { TokenCreationService } from 'src/modules/v2Token/token.service/createToken';

import { keys as KycTemplateKeys } from 'src/types/kyc/template';

import {
  FunctionName,
  SmartContract,
  CertificateType,
} from 'src/types/smartContract';
import {
  keys as WorkflowInstanceKeys,
  keys as ActionKeys,
  OrderType,
  OrderSide,
  EventType,
} from 'src/types/workflow/workflowInstances';
import { keys as TxKeys, TxStatus } from 'src/types/transaction';
import {
  ClassDataKeys,
  ClassData,
  AssetData,
  SubscriptionRules,
  Currency,
  AssetDataKeys,
  GeneralDataKeys,
  CalendarType,
  SubscriptionRedemptionKeys,
  combineDateAndTime,
  retrieveCouponIfValid,
  AssetCreationFlow,
  craftAssetCycleTemplate,
  assetClassRules,
  AssetClassRule,
  CollectibleStorageType,
} from 'src/types/asset';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import { EntityType } from 'src/types/entity';
import { Link } from 'src/types/workflow/workflowInstances/link';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { keys as HookKeys, HookCallBack, EmailFunctions } from 'src/types/hook';
import {
  keys as LinkKeys,
  WorkflowType,
} from 'src/types/workflow/workflowInstances';
import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import {
  keys as CycleKeys,
  AssetCycleOffset,
  OffsetType,
  CycleDate,
  AssetCycleTemplate,
  PaymentOption,
  DAY_IN_MILLISECONDS,
} from 'src/types/asset/cycle';
import { Coupon } from 'src/types/coupon';
import { Recurrence } from 'src/types/recurrence';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { AssetTemplate, AssetType } from 'src/types/asset/template';
import { KYCTemplateService } from 'src/modules/v2KYCTemplate/kyc.template.service';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';
import { CERTIFICATE_SIGNER_ADDRESS } from 'src/utils/ethAccounts';
import { Participants, keys as ParticipantKeys } from 'src/types/participants';
import {
  BaseInterestRate,
  BaseInterestRateType,
  Interest,
  keys as InterestKeys,
} from 'src/types/interest';
import {
  Source as ExtImporterSrc,
  keys as ExtImporterKeys,
} from 'src/types/externalImporter';
import { KYCWorkflowAllowListService } from 'src/modules/v2KYCWorkflow/kyc.workflow.service/allowList';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { keys as ConfigKeys, Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { WorkFlowsEventService } from './event';
import { couponsScheduler, dayCounter } from '@codefi-assets-and-payments/day-counter';
import {
  addDate,
  dateAmountType,
  getFractionFromFrequency,
} from 'src/utils/date';
import { NestJSPinoLogger } from '@codefi-assets-and-payments/observability';
import { AssetElementInstance } from 'src/types/asset/elementInstance';
import { checkUserType } from 'src/utils/checks/userType';
import { ApiExternalStorageCallService } from 'src/modules/v2ApiCall/api.call.service/externalStorage';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.ASSET_CREATION;

@Injectable()
export class WorkFlowsFundCreationService {
  constructor(
    private readonly logger: NestJSPinoLogger,
    private readonly kycTemplateService: KYCTemplateService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenCreationService: TokenCreationService,
    private readonly networkService: NetworkService,
    private readonly tokenHelperService: TokenHelperService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly assetDataService: AssetDataService,
    private readonly cycleService: CycleService,
    private readonly kycWorkflowAllowListService: KYCWorkflowAllowListService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly configService: ConfigService,
    private readonly workFlowsEventService: WorkFlowsEventService,
    private readonly externalStrorage: ApiExternalStorageCallService,
  ) {
    logger.setContext(WorkFlowsFundCreationService.name);
  }

  /**
   * [Initialize asset instance]
   *
   * There are 3 possible asset creation flows.
   *
   * 1) ***** SINGLE-PARTY ASSET CREATION FLOW *****
   *
   *    This function is called by an issuer.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: NOT_STARTED
   *     - Destination state: INITIALIZED
   *
   *
   *
   * 2) ***** BI-PARTY ASSET CREATION FLOW *****
   *
   *    This function is called by an investor.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: NOT_STARTED
   *     - Destination state: PRE_INITIALIZED
   *
   *
   *
   * 3) ***** TRI-PARTY ASSET CREATION FLOW *****
   *
   *    This function is called by an underwriter.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: NOT_STARTED
   *     - Destination state: PRE_INITIALIZED_2
   */
  async initializeAssetInstance(
    tenantId: string,
    typeFunctionUser: UserType,
    user: User,
    userWalletAddress: string,
    tokenStandard: SmartContract,
    tokenName: string,
    tokenSymbol: string,
    chainId: string, // TO BE DEPRECATED (replaced by 'networkKey')
    networkKey: string,
    kycTemplateId: string,
    certificateActivated: boolean, // DEPRECATED (replaced by certificateType)
    certificateType: CertificateType,
    unregulatedERC20transfersActivated: boolean,
    assetTemplateId: string,
    customExtensionAddress: string, // optional (custom extension address, in case generic extension shall not be used)
    initialOwnerAddress: string, // optional (owner address in case contract ownership shall be transferred)
    bypassSecondaryTradeIssuerApproval: boolean, // optional (bypass Issuer's approval of secondary trade orders)
    automateHoldCreation: boolean, // [Optional] flag to automatically create hold on credits on order acceptance
    automateSettlement: boolean, // [Optional] flag to automatically transfer credits on payment Confirmation
    automateRetirement: boolean, // [Optional] flag to automatically retire credits for applicable tokens like Project Carbon flagged for immediate retirements
    automateForceBurn: Array<OrderSide>, // [Optional] flag to automatically burn tokens after dvp settlement (only for specified order sides)
    initialSupplies: Array<InitialSupply>, // optional
    data: any,
    issuerId: string, // Only required when asset creation is initialized by an investor (bi-party flow)
    reviewerId: string, // Only required when asset creation is initialized by an underwriter, (tri-party flow)
    elementInstances: Array<AssetElementInstance> = [],
    assetClasses: string[] = [],
    authToken: string,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const functionName: FunctionName = FunctionName.INIT_ASSET_INSTANCE;

      // Check if asset template exists, and retrieve asset type from it
      const { assetType, tokenCategory } =
        await this.assetDataService.retrieveAssetTypeAndTokenCategoryFromTemplate(
          tenantId,
          assetTemplateId,
        );

      let assetCreationFlow: AssetCreationFlow;
      if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
        assetCreationFlow = AssetCreationFlow.SINGLE_PARTY;
      } else if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
        assetCreationFlow = AssetCreationFlow.BI_PARTY;
      } else if (user[UserKeys.USER_TYPE] === UserType.UNDERWRITER) {
        assetCreationFlow = AssetCreationFlow.TRI_PARTY;
      } else {
        ErrorService.throwError(
          `Invalid user type (${
            user[UserKeys.USER_TYPE]
          }). An asset creation can only be initialized by a user of type ${
            UserType.ISSUER
          }, ${UserType.UNDERWRITER} or ${UserType.INVESTOR}`,
        );
      }

      // ------------- Format all input data (beginning) -------------
      const _tokenStandard: string =
        this.tokenHelperService.retrieveTokenStandardIfValidOrRetrieveDefaultOne(
          tokenCategory,
          tokenStandard,
        );
      const _tokenName: string =
        this.tokenHelperService.retrieveTokenNameIfValidOrRetrieveDefaultOne(
          tokenName,
        );
      const _tokenSymbol: string =
        this.tokenHelperService.retrieveTokenSymbolIfValidOrRetrieveDefaultOne(
          tokenSymbol,
        );

      const _assetClasses =
        this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
          assetClasses,
        );

      const _certificateTypeAsNumber: number =
        this.tokenHelperService.retrieveCertificateTypeIfValid(
          certificateType,
          tokenStandard,
        );

      const _automateForceBurn: Array<OrderSide> =
        this.tokenHelperService.retrieveOrderSideArray(
          'automateForceBurn',
          automateForceBurn,
        );

      if (elementInstances.length > 0) {
        // check asset data completion
        const [assetDataValidity, assetDataValidityMessage]: [boolean, string] =
          await this.apiMetadataCallService.checkAssetDataValidity(
            tenantId,
            assetTemplateId,
            elementInstances,
          );

        if (!assetDataValidity) {
          ErrorService.throwError(
            `initializeAssetInstance: ${assetDataValidityMessage}`,
          );
        }
      }

      const network: Network =
        chainId || networkKey
          ? await this.networkService.retrieveNetwork(
              tenantId,
              chainId, // TO BE DEPRECATED (replaced by 'networkKey')
              networkKey,
              true, // networkShallExist
            )
          : await this.networkService.retrieveDefaultNetwork(
              tenantId,
              true, // checkNetworkIsAlive
            );

      if (
        customExtensionAddress &&
        !web3Utils.isAddress(customExtensionAddress)
      ) {
        ErrorService.throwError(
          `${customExtensionAddress} is an invalid Ethereum address`,
        );
      }

      if (initialOwnerAddress && !web3Utils.isAddress(initialOwnerAddress)) {
        ErrorService.throwError(
          `${initialOwnerAddress} is an invalid Ethereum address`,
        );
      }

      if (assetCreationFlow !== AssetCreationFlow.SINGLE_PARTY && !issuerId) {
        ErrorService.throwError(
          `missing parameter: please provide an 'issuerId', this is mandatory to start an asset creation flow of type ${assetCreationFlow}`,
        );
      }

      // Fetch issuer and config
      const [issuer, investor, underwriter, config]: [
        User,
        User,
        User,
        Config,
      ] = await Promise.all([
        assetCreationFlow === AssetCreationFlow.SINGLE_PARTY
          ? user // For the single-party flow, the user initializing the asset creation is the issuer
          : this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        assetCreationFlow === AssetCreationFlow.BI_PARTY
          ? user // For the bi-party flow, the user initializing the asset creation is the investor
          : assetCreationFlow === AssetCreationFlow.TRI_PARTY && reviewerId // For the tri-party flow, the reviewer is optional (it can be provided later, in the updateAssetInstance function)
          ? this.apiEntityCallService.fetchEntity(tenantId, reviewerId, true)
          : undefined,
        assetCreationFlow === AssetCreationFlow.TRI_PARTY ? user : undefined, // For the tri-party flow, the user initializing the asset creation is the underwriter
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Only the single-party flow is enabled, if marketplace is not enabled
      this.checkMarketplaceEnabled(config, assetCreationFlow, true);

      // Only the bi-party flow is enabled for assets of type carbon credits
      if (
        assetClassRules[assetType][AssetClassRule.FLOWS].indexOf(
          assetCreationFlow,
        ) === -1
      ) {
        ErrorService.throwError(
          `Invalid userType (${user[UserKeys.USER_TYPE]}). For assets of type ${
            AssetType.CARBON_CREDITS
          } the asset creation flow needs to be initialized by a user of type ${
            UserType.INVESTOR
          } (bi-party asset creation flow)`,
        );
      }

      const _data: any = {
        ...data,
        [TokenKeys.DATA__ASSET_CREATION_FLOW]: assetCreationFlow,
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
        [TokenKeys.DATA__AUTOMATE_HOLD_CREATION]:
          automateHoldCreation || undefined,
        [TokenKeys.DATA__AUTOMATE_SETTLEMENT]: automateSettlement || undefined,
        [TokenKeys.DATA__AUTOMATE_RETIREMENT]: automateRetirement || undefined,
        [TokenKeys.DATA__AUTOMATE_FORCE_BURN]: _automateForceBurn || undefined,
        [TokenKeys.DATA__CERTIFICATE_ACTIVATED]: certificateActivated
          ? true
          : false,
        [TokenKeys.DATA__CERTIFICATE_TYPE_AS_NUMBER]: _certificateTypeAsNumber,
        [TokenKeys.DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED]:
          unregulatedERC20transfersActivated ? true : false,
        [TokenKeys.DATA__CUSTOM_EXTENSION_ADDRESS]: customExtensionAddress,
        [TokenKeys.DATA__INITIAL_OWNER_ADDRESS]: initialOwnerAddress,
        [TokenKeys.DATA__INITIAL_SUPPLIES]: initialSupplies || undefined,
      };
      // ------------- Format all input data (end) -------------

      // Retrieve user (could be issuer/investor based who is creating asset) Wallet
      const userWallet: Wallet = this.walletService.extractWalletFromUser(
        user,
        userWalletAddress,
      );

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // initializeAssetInstance
      );

      // Create token in off-chain DB
      const token: Token = await this.apiMetadataCallService.createTokenInDB(
        tenantId,
        _tokenName,
        _tokenSymbol,
        _tokenStandard,
        undefined, // tokenAddress in the case where a new smart contract needs to be deployed
        network[NetworkKeys.CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
        network[NetworkKeys.KEY], // networkKey
        undefined, // picture
        undefined, // description
        undefined, // bankDepositDetail
        _assetClasses,
        assetTemplateId,
        issuer[UserKeys.USER_ID],
        user[UserKeys.USER_ID],
        reviewerId,
        _data,
      );

      // Create workflow instance in Workflow-API
      const assetCreationWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];

      const workflowInstance: Action =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          undefined, // idempotencyKey
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          user[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          assetCreationFlow === AssetCreationFlow.TRI_PARTY && reviewerId
            ? reviewerId
            : undefined, // recipientId (in the case of the tri-party flow, we indicate the reviewer's id as recipient ID, in order to allow him to retrieve the workflow instance)
          undefined, // brokerId
          undefined, // agentId
          assetCreationWorkflowId,
          0, // quantity
          0, // price
          undefined, // documentId
          userWallet[WalletKeys.WALLET_ADDRESS],
          undefined, // assetClass
          new Date(),
          nextStatus, // AssetCreationWorkflow.INITIALIZED if called by Issuer / AssetCreationWorkflow.PRE_INITIALIZED if called by Investor
          undefined, //offerId
          undefined, //orderSide
          {},
        );

      if (assetCreationFlow === AssetCreationFlow.SINGLE_PARTY) {
        // In case the asset is initialized by an ISSUER, we need to create a link between the issuer and the token
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER,
          user[UserKeys.USER_ID], //idFunctionUser
          user,
          FunctionName.KYC_ADD_ISSUER,
          EntityType.TOKEN,
          undefined, // project
          undefined, // issuer
          token,
          undefined, // assetClassKey --> issuer is issuer of all asset classes
          userWallet,
        );
      } else if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
        // In case the asset is initialized by an INVESTOR, we need to:
        //   - create a link between the investor and the token
        //   - allowlist the investor for the token
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          tenantId,
          user,
          investor[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
          null,
          null,
          null,
          null,
          false,
          functionName,
          authToken,
        );
      } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
        // In case the asset is initialized by an UNDERWRITER, we need to:
        //   - create a link between the underwriter and the token
        //   - allowlist the underwriter for the token
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          tenantId,
          user,
          underwriter[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
          null,
          null,
          null,
          null,
          false,
          functionName,
          authToken,
        );
      }

      // save elementInstances in DB
      if (assetTemplateId) {
        await this.assetDataService.saveAssetData(
          tenantId,
          issuer,
          assetTemplateId,
          token[TokenKeys.TOKEN_ID],
          elementInstances,
          {},
        );
      }

      const tokenUpdates = {
        [TokenKeys.DATA]: {
          ...token[TokenKeys.DATA],
          [TokenKeys.DATA__WORKFLOW_INSTANCE_ID]:
            workflowInstance[WorkflowInstanceKeys.ID],
        },
      };

      // Update token state in off-chain DB
      const updatedToken: Token =
        await this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          tokenUpdates,
        );

      if (assetType === AssetType.SYNDICATED_LOAN) {
        const participants =
          updatedToken[TokenKeys.ASSET_DATA]?.[AssetDataKeys.ASSET]?.[
            GeneralDataKeys.PARTICIPANTS
          ];
        this.checkParticipants(tenantId, null, participants, false);
      }

      // Check initial supplies - this step can potentially fail if users are not valid, which
      // is why we put it in last position as we don't want it to block asset initialization
      // If there are initial supplies to be minted, we need to check if investors exist
      if (initialSupplies && initialSupplies.length > 0) {
        await this.tokenCreationService.checkInitialSupplies(
          tenantId,
          tokenCategory,
          issuer,
          token,
          config,
          initialSupplies,
        );
      }
      return {
        token: updatedToken,
        tokenAction: workflowInstance,
        message: `Asset instance ${
          token[TokenKeys.TOKEN_ID]
        } initialized successfully (${assetCreationFlow})`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'initializing asset instance',
        'initializeAssetInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Update asset instance]
   *
   * There are 3 possible asset creation flows.
   *
   * 1) ***** SINGLE-PARTY ASSET CREATION FLOW *****
   *
   *    This function is called by the issuer of the asset.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: INITIALIZED
   *     - Destination state: INITIALIZED
   *
   *
   *
   * 2) ***** BI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the investor who initialized the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED
   *     - Destination state: PRE_INITIALIZED
   *
   *    This function can also called by the issuer of the asset.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: SUBMITTED
   *     - Destination state: SUBMITTED
   *
   *
   *
   * 3) ***** TRI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the underwriter who initialized the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED_2
   *     - Destination state: PRE_INITIALIZED_2
   *
   *    This function can also called by the issuer of the asset.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: SUBMITTED
   *     - Destination state: SUBMITTED
   */
  async updateAssetInstance(
    tenantId: string,
    tokenId: string,
    typeFunctionUser: UserType,
    user: User,
    newUserWalletAddress: string,
    newTokenStandard: SmartContract,
    newTokenName: string,
    newTokenSymbol: string,
    newChainId: string, // TO BE DEPRECATED (replaced by 'networkKey')
    newNetworkKey: string,
    newKycTemplateId: string,
    newCertificateActivated: boolean, // DEPRECATED (replaced by certificateType)
    newCertificateType: CertificateType,
    newUnregulatedERC20transfersActivated: boolean,
    newAssetTemplateId: string,
    newData: any,
    newCustomExtensionAddress: string, // optional (custom extension address, in case generic extension shall not be used)
    newInitialOwnerAddress: string, // optional (onwer address in case contract ownership shall be transferred)
    newBypassSecondaryTradeIssuerApproval: boolean, // optional (bypass Issuer's approval of secondary trade orders)
    newAutomateHoldCreation: boolean, // [Optional] flag to automatically create hold on credits on order acceptance
    newAutomateSettlement: boolean, // [Optional] flag to automatically transfer credits on payment Confirmation
    newAutomateRetirement: boolean, // [Optional] flag to automatically retire credits for applicable tokens like Project Carbon flagged for immediate retirements
    newAutomateForceBurn: Array<OrderSide>, // [Optional] flag to automatically burn tokens after dvp settlement (only for specified order sides)
    newInitialSupplies: Array<InitialSupply>, // optional
    newReviewerId: string, // reviewer of the asset when created by an underwriter
    elementInstances: Array<AssetElementInstance> = [],
    assetClasses: string[],
  ): Promise<InitAssetInstanceOutput> {
    try {
      const functionName: FunctionName = FunctionName.UPDATE_ASSET_INSTANCE;

      // Preliminary step: Fetch all required data in databases

      // Retrieve token from off-chain DB
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      // If assets type === 'OPEN_END_FUND'...
      if (token['assetData']['type'] === AssetType.OPEN_END_FUND) {
        // If it has been specified to use the "initial subscription cut off date" as the
        // "subsequent subscription start date"...
        if (
          elementInstances.find(
            (elementInstance) =>
              elementInstance.key.endsWith(
                'subsequentSubscription_startDateCheck',
              ) && elementInstance.value[0] === 'INITIAL_CUT_OFF',
          )
        ) {
          this.copyAutomaticStartDates(elementInstances, 'Subscription');
        }

        // If it has been specified to use the "initial redemption cut off date" as the
        // "subsequent redemption start date"...
        if (
          elementInstances.find(
            (elementInstance) =>
              elementInstance.key.endsWith(
                'subsequentRedemption_startDateCheck',
              ) && elementInstance.value[0] === 'INITIAL_CUT_OFF',
          )
        ) {
          this.copyAutomaticStartDates(elementInstances, 'Redemption');
        }
      }

      const _newAssetTemplateId =
        newAssetTemplateId || token[TokenKeys.ASSET_TEMPLATE_ID];
      const { tokenCategory } =
        await this.assetDataService.retrieveAssetTypeAndTokenCategoryFromTemplate(
          tenantId,
          _newAssetTemplateId,
        );

      const {
        assetCreationFlow,
        creatorId,
        issuerId,
      }: {
        assetCreationFlow: AssetCreationFlow;
        creatorId: string;
        reviewerId: string;
        issuerId: string;
      } = this.assetDataService.retrieveAssetCreationFlowData(
        token,
        token[TokenKeys.TOKEN_ID],
        false, // reviewerIdRequired
      );

      // Extract workflow instance ID from token
      const workflowInstanceId: number =
        this.assetDataService.retrieveAssetWorkflowInstance(token);

      const [workflowInstance, issuer, userTokenLink, config]: [
        Action,
        User,
        Link,
        Config,
      ] = await Promise.all([
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
        this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        this.linkService.retrieveStrictUserEntityLink(
          // Check user is properly linked to token
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Only the single-party flow is enabled, if marketplace is not enabled
      this.checkMarketplaceEnabled(config, assetCreationFlow, false);

      if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
        // The issuer can update the asset in the single-party, the bi-party and the tri-party asset creation flow
        if (!(issuerId === user[UserKeys.USER_ID])) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is not the issuer of the asset (${issuer?.[UserKeys.USER_ID]})`,
          );
        }
      } else if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
        checkUserType(UserType.INVESTOR, user);
        if (creatorId !== user[UserKeys.USER_ID]) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is not the creator of the asset (${creatorId})`,
          );
        }
      } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
        checkUserType(UserType.UNDERWRITER, user);
        if (creatorId !== user[UserKeys.USER_ID]) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is not the creator of the asset (${creatorId})`,
          );
        }
      }

      if (newUserWalletAddress) {
        const newWallet: Wallet = this.walletService.extractWalletFromUser(
          user,
          newUserWalletAddress,
        );

        await this.workflowService.updateWorkflowInstance(
          tenantId,
          userTokenLink[LinkKeys.ID],
          undefined, // No state transition triggered here, just a wallet update
          undefined, // No state transition triggered here, just a wallet update
          undefined, // No state transition triggered here, just a wallet update
          {
            ...userTokenLink,
            [LinkKeys.WALLET]: newWallet[WalletKeys.WALLET_ADDRESS],
          },
        );
      }

      // ------------- Format all input data (beginning) -------------
      const _newTokenStandard: SmartContract = newTokenStandard
        ? this.tokenHelperService.retrieveTokenStandardIfValidOrRetrieveDefaultOne(
            tokenCategory,
            newTokenStandard,
          )
        : undefined;

      const _newTokenName: string = newTokenName
        ? this.tokenHelperService.retrieveTokenNameIfValidOrRetrieveDefaultOne(
            newTokenName,
          )
        : undefined;
      const _newTokenSymbol: string = newTokenSymbol
        ? this.tokenHelperService.retrieveTokenSymbolIfValidOrRetrieveDefaultOne(
            newTokenSymbol,
          )
        : undefined;

      const newNetwork: Network =
        newChainId || newNetworkKey
          ? await this.networkService.retrieveNetwork(
              tenantId,
              newChainId, // TO BE DEPRECATED (replaced by 'networkKey')
              newNetworkKey,
              true, // networkShallExist
            )
          : undefined;
      const _newChainId: string = // TO BE DEPRECATED (replaced by 'networkKey')
        newNetwork && newNetwork[NetworkKeys.CHAIN_ID]
          ? newNetwork[NetworkKeys.CHAIN_ID]
          : undefined;
      const _newNetworkKey: string =
        newNetwork && newNetwork[NetworkKeys.KEY]
          ? newNetwork[NetworkKeys.KEY]
          : undefined;

      const _assetClasses = assetClasses
        ? this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
            assetClasses,
          )
        : token[TokenKeys.ASSET_CLASSES];

      // reviewer is required in the Tri-party flow
      if (newReviewerId) {
        // Check reviewer exists in database
        await this.apiEntityCallService.fetchEntity(
          tenantId,
          newReviewerId,
          true,
        );
      }

      const _newKycTemplateId: string = (
        await this.kycTemplateService.retrieveKycTemplateIfExistingOrRetrieveIssuerKycTemplate(
          tenantId,
          newKycTemplateId,
          issuer,
        )
      )?.[KycTemplateKeys.TEMPLATE_ID];

      const _newData: any = {
        ...token[TokenKeys.DATA],
        ...(newData || {}),
      };

      // check asset data completion
      if (elementInstances.length > 0) {
        const [assetDataValidity, assetDataValidityMessage]: [boolean, string] =
          await this.apiMetadataCallService.checkAssetDataValidity(
            tenantId,
            _newAssetTemplateId,
            elementInstances,
          );

        if (!assetDataValidity) {
          ErrorService.throwError(
            `updateAssetInstance: ${assetDataValidityMessage}`,
          );
        }
      }

      if (newKycTemplateId !== undefined) {
        _newData[TokenKeys.DATA__KYC_TEMPLATE_ID] = _newKycTemplateId;
        _newData[TokenKeys.DATA__BYPASS_KYC_CHECKS] =
          newKycTemplateId === null ? true : undefined;
      }

      if (newCertificateActivated !== undefined) {
        _newData[TokenKeys.DATA__CERTIFICATE_ACTIVATED] =
          newCertificateActivated;
      }

      if (newCertificateType !== undefined) {
        const _newCertificateTypeAsNumber: number =
          this.tokenHelperService.retrieveCertificateTypeIfValid(
            newCertificateType,
            _newTokenStandard || token[TokenKeys.STANDARD],
          );
        _newData[TokenKeys.DATA__CERTIFICATE_TYPE_AS_NUMBER] =
          _newCertificateTypeAsNumber;
      }

      if (newUnregulatedERC20transfersActivated !== undefined) {
        _newData[TokenKeys.DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED] =
          newUnregulatedERC20transfersActivated;
      }

      if (newCustomExtensionAddress) {
        if (!web3Utils.isAddress(newCustomExtensionAddress)) {
          ErrorService.throwError(
            `${newCustomExtensionAddress} is an invalid Ethereum address`,
          );
        }
        _newData[TokenKeys.DATA__CUSTOM_EXTENSION_ADDRESS] =
          newCustomExtensionAddress;
      }

      if (newInitialOwnerAddress) {
        if (!web3Utils.isAddress(newInitialOwnerAddress)) {
          ErrorService.throwError(
            `${newInitialOwnerAddress} is an invalid Ethereum address`,
          );
        }
        _newData[TokenKeys.DATA__INITIAL_OWNER_ADDRESS] =
          newInitialOwnerAddress;
      }

      if (newBypassSecondaryTradeIssuerApproval !== undefined) {
        _newData[TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL] =
          newBypassSecondaryTradeIssuerApproval || null;
      }

      if (newAutomateHoldCreation !== undefined) {
        _newData[TokenKeys.DATA__AUTOMATE_HOLD_CREATION] =
          newAutomateHoldCreation || null;
      }
      if (newAutomateSettlement !== undefined) {
        _newData[TokenKeys.DATA__AUTOMATE_SETTLEMENT] =
          newAutomateSettlement || null;
      }
      if (newAutomateRetirement !== undefined) {
        _newData[TokenKeys.DATA__AUTOMATE_RETIREMENT] =
          newAutomateRetirement || null;
      }
      if (newAutomateForceBurn !== undefined) {
        const _newAutomateForceBurn: Array<OrderSide> =
          this.tokenHelperService.retrieveOrderSideArray(
            'automateForceBurn',
            newAutomateForceBurn,
          );
        _newData[TokenKeys.DATA__AUTOMATE_FORCE_BURN] =
          _newAutomateForceBurn || null;
      }

      if (newInitialSupplies !== undefined) {
        // Check initial supplies - this step can potentially fail if users are not valid
        await this.tokenCreationService.checkInitialSupplies(
          tenantId,
          tokenCategory,
          issuer,
          token,
          config,
          newInitialSupplies,
        );
        _newData[TokenKeys.DATA__INITIAL_SUPPLIES] = newInitialSupplies || null;
      }

      // cleanup data by removing keys with null values
      Object.keys(_newData).forEach((key) => {
        if (_newData[key] === null) {
          delete _newData[key];
        }
      });
      // ------------- Format all input data (end) -------------

      // Check if state transition is possible, by asking Workflow-API
      await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        workflowInstance[WorkflowInstanceKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // updateAssetInstance
      );

      // save elementInstances in DB
      await this.assetDataService.saveAssetData(
        tenantId,
        issuer,
        _newAssetTemplateId,
        token[TokenKeys.TOKEN_ID],
        elementInstances,
        {},
      );

      // Update asset
      const updatedToken: Token =
        await this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          {
            [TokenKeys.STANDARD]: _newTokenStandard,
            [TokenKeys.NAME]: _newTokenName,
            [TokenKeys.SYMBOL]: _newTokenSymbol,
            [TokenKeys.DEFAULT_CHAIN_ID]: _newChainId, // TO BE DEPRECATED (replaced by 'networkKey')
            [TokenKeys.DEFAULT_NETWORK_KEY]: _newNetworkKey,
            [TokenKeys.ASSET_TEMPLATE_ID]: _newAssetTemplateId,
            [TokenKeys.DATA]: _newData,
            [TokenKeys.ASSET_CLASSES]: _assetClasses,
            [TokenKeys.REVIEWER_ID]: newReviewerId || undefined,
          },
        );

      // Update workflow instance
      if (assetCreationFlow === AssetCreationFlow.TRI_PARTY && newReviewerId) {
        const newWorkflowInstance = {
          ...workflowInstance,
          [ActionKeys.RECIPIENT_ID]: newReviewerId,
        };
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newWorkflowInstance[ActionKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newWorkflowInstance,
        );
      }

      const assetType = updatedToken[TokenKeys.ASSET_DATA][AssetDataKeys.TYPE];
      if (assetType === AssetType.SYNDICATED_LOAN) {
        const participants =
          updatedToken[TokenKeys.ASSET_DATA]?.[AssetDataKeys.ASSET]?.[
            GeneralDataKeys.PARTICIPANTS
          ];
        this.checkParticipants(tenantId, null, participants, false);
      }

      return {
        token: updatedToken,
        tokenAction: workflowInstance,
        message: `Asset instance ${
          token[TokenKeys.TOKEN_ID]
        } updated successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating asset instance',
        'updateAssetInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Add asset instance class]
   *
   * This function can only be called by the issuer of the asset.
   * It can only be called for a action-workflow (assetCreation) in state DEPLOYED.
   *
   * On-chain:
   *  - Hybrid token smart contract deployment
   *
   * Off-chain state machine:
   *  - Initial state: DEPLOYED
   *  - Destination state: DEPLOYED
   */

  async addAssetInstanceClass(
    tenantId: string,
    tokenId: string,
    typeFunctionUser: UserType,
    user: User,
    assetClasses: string[],
  ): Promise<InitAssetInstanceOutput> {
    try {
      const functionName: FunctionName = FunctionName.ADD_ASSET_INSTANCE_CLASS;

      // Preliminary step: Fetch all required data in databases

      // Retrieve token from off-chain DB
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      // retrieve token category
      const { tokenCategory } =
        await this.assetDataService.retrieveAssetTypeAndTokenCategoryFromTemplate(
          tenantId,
          token[TokenKeys.ASSET_TEMPLATE_ID],
        );

      // check asset data completion
      const [assetDataComplete, assetDataCompletionMessage]: [boolean, string] =
        await this.apiMetadataCallService.checkAssetDataCompletion(
          tenantId,
          user[UserKeys.USER_ID],
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
        );

      if (!assetDataComplete) {
        ErrorService.throwError(
          `deployAssetInstance:${assetDataCompletionMessage}`,
        );
      }

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      const {
        assetCreationFlow,
        creatorId,
        reviewerId,
        issuerId,
      }: {
        assetCreationFlow: AssetCreationFlow;
        creatorId: string;
        reviewerId: string;
        issuerId: string;
      } = this.assetDataService.retrieveAssetCreationFlowData(
        token,
        token[TokenKeys.TOKEN_ID],
        true, // reviewerIdRequired
      );

      const assetType = assetData.type;

      // Extract workflow instance ID from token
      const workflowInstanceId: number =
        this.assetDataService.retrieveAssetWorkflowInstance(token);
      const workflowInstance: Action =
        await this.workflowService.retrieveWorkflowInstances(
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
        );

      const issuer = await this.apiEntityCallService.fetchEntity(
        tenantId,
        issuerId,
        true,
      );

      const assetTemplateData: AssetTemplate =
        await this.assetDataService.retrieveSavedAssetData(
          tenantId,
          issuer,
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
        );

      if (!assetTemplateData) {
        ErrorService.throwError(
          `no asset template data was found for token with ID ${
            token[TokenKeys.TOKEN_ID]
          }`,
        );
      }

      const classData = assetData[AssetDataKeys.CLASS];

      this.checkAssetClassesData(classData, assetType);

      // Perform several checks before updating the asset
      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        workflowInstance[WorkflowInstanceKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // addAssetInstanceClass
      );

      // ------------- Format all input data (beginning) -------------
      const _assetClasses = assetClasses
        ? this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
            assetClasses,
          )
        : token[TokenKeys.ASSET_CLASSES];
      // ------------- Format all input data (end) -------------

      //Add only new classes, do not remove already existing classes
      const _newAssetClasses = _assetClasses.filter(
        (classToClean) =>
          !token.assetClasses.find(
            (originalClass) => classToClean === originalClass,
          ),
      );

      // Update asset
      const updatedToken: Token =
        await this.apiMetadataCallService.updateTokenInDB(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          {
            [TokenKeys.ASSET_CLASSES]: [
              ...token.assetClasses,
              ..._newAssetClasses,
            ],
          },
        );

      return {
        token: updatedToken,
        tokenAction: workflowInstance,
        message: `Asset instance class ${
          token[TokenKeys.TOKEN_ID]
        } updated successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'adding asset instance class',
        'addAssetInstanceClass',
        false,
        500,
      );
    }
  }

  /**
   * [Submit asset instance]
   *
   * There are 3 possible asset creation flows.
   *
   * 1) ***** SINGLE-PARTY ASSET CREATION FLOW *****
   *
   *    This function is not called
   *
   *
   *
   * 2) ***** BI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the investor who initialized the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED
   *     - Destination state: SUBMITTED
   *
   *
   *
   * 3) ***** TRI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the underwriter who initialized the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED_2
   *     - Destination state: PRE_INITIALIZED
   *
   *    This function can also called by the investor who reviews the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED
   *     - Destination state: SUBMITTED
   */
  async submitAssetInstance(
    tenantId: string,
    tokenId: string,
    typeFunctionUser: UserType,
    user: User,
    sendNotification: boolean,
    authToken: string,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const functionName: FunctionName = FunctionName.SUBMIT_ASSET_INSTANCE;

      // Retrieve token from off-chain DB
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      // check asset data completion
      const [assetDataComplete, assetDataCompletionMessage]: [boolean, string] =
        await this.apiMetadataCallService.checkAssetDataCompletion(
          tenantId,
          token[TokenKeys.ISSUER_ID],
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
        );

      if (!assetDataComplete) {
        ErrorService.throwError(
          `submitAssetInstance: ${assetDataCompletionMessage}`,
        );
      }

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      this.checkAssetClassesData(
        assetData[AssetDataKeys.CLASS],
        assetData[AssetDataKeys.TYPE],
      );

      const {
        assetCreationFlow,
        creatorId,
        reviewerId,
        issuerId,
      }: {
        assetCreationFlow: AssetCreationFlow;
        creatorId: string;
        reviewerId: string;
        issuerId: string;
      } = this.assetDataService.retrieveAssetCreationFlowData(
        token,
        token[TokenKeys.TOKEN_ID],
        true, // reviewerIdRequired
      );

      // Extract workflow instance ID from token
      const workflowInstanceId: number =
        this.assetDataService.retrieveAssetWorkflowInstance(token);

      const [workflowInstance, , issuer, reviewer, config]: [
        Action,
        Link,
        User,
        User,
        Config,
      ] = await Promise.all([
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
        this.linkService.retrieveStrictUserEntityLink(
          // Check user is properly linked to token
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        assetCreationFlow === AssetCreationFlow.TRI_PARTY
          ? this.apiEntityCallService.fetchEntity(tenantId, reviewerId, true)
          : undefined,
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Only the single-party flow is enabled, if marketplace is not enabled
      this.checkMarketplaceEnabled(config, assetCreationFlow, false);

      // Perform checks before updating the workflow instance
      if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
        checkUserType(UserType.INVESTOR, user);
        if (creatorId !== user[UserKeys.USER_ID]) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is not the creator of the asset (${creatorId})`,
          );
        }
      } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
        if (user[UserKeys.USER_TYPE] === UserType.UNDERWRITER) {
          if (creatorId !== user[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided userId (${
                user[UserKeys.USER_ID]
              }) is not the creator of the asset (${creatorId})`,
            );
          }
        } else if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
          if (reviewerId !== user[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided userId (${
                user[UserKeys.USER_ID]
              }) is not the reviewer of the asset (${creatorId})`,
            );
          }
        } else {
          ErrorService.throwError(
            `Invalid user type. Asset can only be submitted by user of type ${UserType.UNDERWRITER} or ${UserType.INVESTOR}`,
          );
        }
      }

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        workflowInstance[WorkflowInstanceKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // submitAssetInstance
      );

      const updatedWorkflowInstance: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          workflowInstance[WorkflowInstanceKeys.ID],
          functionName,
          typeFunctionUser,
          nextStatus,
          workflowInstance,
        );

      if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
        // In case the asset is submitted by an INVESTOR, we need to:
        //   - create a link between the issuer and the token
        //   - allowlist the investor for the token

        // Retrieve issuer's default wallet (to add it in the link)
        const issuerWallet: Wallet =
          await this.walletService.extractWalletFromUser(issuer, undefined);

        // Create a link between token and issuer, to allow review/deploy/reject the asset creation
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER,
          issuerId,
          issuer,
          FunctionName.KYC_ADD_ISSUER,
          EntityType.TOKEN,
          undefined, // project
          undefined, // issuer
          token,
          undefined, // assetClassKey --> issuer is issuer of all asset classes
          issuerWallet,
        );
      } else if (user[UserKeys.USER_TYPE] === UserType.UNDERWRITER) {
        // In case the asset is submitted by an UNDERWRITER, we need to:
        //   - create a link between the reviewer(investor) and the token
        //   - allowlist the reviewer(investor) for the token
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          tenantId,
          user,
          reviewer[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
          null,
          null,
          null,
          null,
          false,
          functionName,
          authToken,
        );
      } else {
        ErrorService.throwError(
          `Invalid userType(${
            user[UserKeys.USER_TYPE]
          }). An asset can only be submitted by a user of type ${
            UserType.UNDERWRITER
          } or ${UserType.INVESTOR}`,
        );
      }

      // Send email notification
      if (sendNotification) {
        let importedFromMsg = ' ';
        let approveForMsg = 'issuance';

        if (token[TokenKeys.DATA]?.[TokenKeys.DATA__EXTERNAL_IMPORTER]) {
          const importSrc =
            token[TokenKeys.DATA][TokenKeys.DATA__EXTERNAL_IMPORTER]?.[
              ExtImporterKeys.SOURCE
            ];
          const sourceName =
            importSrc === ExtImporterSrc.DAPHNE ? 'Daphne' : 'Registry';
          importedFromMsg = ` to import from ${sourceName}`;
          approveForMsg = 'import and credit tokenization';
        }

        if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
          this.apiMailingCallService.sendAssetReviewMail(
            tenantId,
            tokenId,
            issuer,
            user,
            importedFromMsg,
            approveForMsg,
            authToken,
          );
        } else if (user[UserKeys.USER_TYPE] === UserType.UNDERWRITER) {
          // TRI-PARTY send the reviewer(Investor) an email
          this.apiMailingCallService.sendAssetReviewMail(
            tenantId,
            tokenId,
            reviewer,
            user,
            importedFromMsg,
            approveForMsg,
            authToken,
          );
        }
      }

      return {
        token: token,
        tokenAction: updatedWorkflowInstance,
        message: `Asset instance ${
          token[TokenKeys.TOKEN_ID]
        } submitted successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting asset instance',
        'submitAssetInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Reject asset instance]
   *
   * There are 3 possible asset creation flows.
   *
   * 1) ***** SINGLE-PARTY ASSET CREATION FLOW *****
   *
   *    This function is not called
   *
   *
   *
   * 2) ***** BI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the issuer who reviews the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: SUBMITTED
   *     - Destination state: REJECTED
   *
   *
   *
   * 3) ***** TRI-PARTY ASSET CREATION FLOW *****
   *
   *    This function can be called by the issuer who reviews the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: SUBMITTED
   *     - Destination state: REJECTED
   *
   *    This function can also called by the investor who reviews the asset creation.
   *
   *    On-chain:
   *     - None
   *
   *    Off-chain state machine:
   *     - Initial state: PRE_INITIALIZED
   *     - Destination state: REJECTED
   */
  async rejectAssetInstance(
    tenantId: string,
    tokenId: string,
    comment: string,
    typeFunctionUser: UserType,
    user: User,
    sendNotification: boolean,
    authToken: string,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const functionName: FunctionName = FunctionName.REJECT_ASSET_INSTANCE;

      // Retrieve token from off-chain DB
      const token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      const {
        assetCreationFlow,
        creatorId,
        reviewerId,
        issuerId,
      }: {
        assetCreationFlow: AssetCreationFlow;
        creatorId: string;
        reviewerId: string;
        issuerId: string;
      } = this.assetDataService.retrieveAssetCreationFlowData(
        token,
        token[TokenKeys.TOKEN_ID],
        false, // reviewerIdRequired
      );

      // Extract workflow instance ID from token
      const workflowInstanceId: number =
        this.assetDataService.retrieveAssetWorkflowInstance(token);

      const [workflowInstance, , creator, issuer, reviewer, config]: [
        Action,
        Link,
        User,
        User,
        User,
        Config,
      ] = await Promise.all([
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
        this.linkService.retrieveStrictUserEntityLink(
          // Check user is properly linked to token
          tenantId,
          user[UserKeys.USER_ID],
          user[UserKeys.USER_TYPE],
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.apiEntityCallService.fetchEntity(tenantId, creatorId, true),
        this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        assetCreationFlow === AssetCreationFlow.TRI_PARTY && reviewerId
          ? this.apiEntityCallService.fetchEntity(tenantId, reviewerId, true)
          : undefined,
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Only the single-party flow is enabled, if marketplace is not enabled
      this.checkMarketplaceEnabled(config, assetCreationFlow, false);

      // Perform checks before updating the workflow instance
      if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
        checkUserType(UserType.ISSUER, user);
        if (issuerId !== user[UserKeys.USER_ID]) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is not the issuer of the asset (${creatorId})`,
          );
        }
      } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
        if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
          if (issuerId !== user[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided userId (${
                user[UserKeys.USER_ID]
              }) is not the issuer of the asset (${creatorId})`,
            );
          }
        } else if (user[UserKeys.USER_TYPE] === UserType.INVESTOR) {
          if (reviewerId !== user[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided userId (${
                user[UserKeys.USER_ID]
              }) is not the reviewer of the asset (${creatorId})`,
            );
          }
        } else {
          ErrorService.throwError(
            `Invalid user type. Asset can only be rejected by user of type ${UserType.ISSUER} or ${UserType.INVESTOR}`,
          );
        }
      }

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        workflowInstance[WorkflowInstanceKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // RejectAssetInstance
      );

      const updateForWorkflowInstance: Action = {
        ...workflowInstance,
        [WorkflowInstanceKeys.DATA]: {
          ...workflowInstance[WorkflowInstanceKeys.DATA],
          [WorkflowInstanceKeys.COMMENT]: comment,
        },
      };

      const updatedWorkflowInstance =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          workflowInstance[WorkflowInstanceKeys.ID],
          functionName,
          typeFunctionUser,
          nextStatus,
          updateForWorkflowInstance,
        );

      // Send email notification
      if (sendNotification) {
        // Notify creator
        this.apiMailingCallService.sendInvestorAssetReviewRejectedMail(
          tenantId,
          tokenId,
          creator,
          comment,
          authToken,
        );
        if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
          if (user[UserKeys.USER_TYPE] === UserType.ISSUER) {
            // Notify reviewer as well
            this.apiMailingCallService.sendInvestorAssetReviewRejectedMail(
              tenantId,
              tokenId,
              reviewer,
              comment,
              authToken,
            );
          }
        }
      }

      return {
        token: token,
        tokenAction: updatedWorkflowInstance,
        message: `Asset instance ${
          token[TokenKeys.TOKEN_ID]
        } rejected successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting asset instance',
        'rejectAssetInstance',
        false,
        500,
      );
    }
  }

  /**
   * [Deploy asset instance on the blockchain]
   *
   * This function can only be called by the issuer of the asset.
   * It can only be called for a action-workflow (assetCreation) in state INITIALIZED.
   *
   * On-chain:
   *  - Hybrid token smart contract deployment
   *
   * Off-chain state machine:
   *  - Initial state: INITIALIZED/SUBMITTED
   *  - Destination state: DEPLOYED
   */
  async deployAssetInstance(
    tenantId: string,
    tokenId: string,
    typeFunctionUser: UserType,
    user: User,
    callerId: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<DeployAssetOutput> {
    try {
      const functionName: FunctionName = FunctionName.DEPLOY_ASSET_INSTANCE;

      // Preliminary step: Fetch all required data in databases

      // Retrieve token from off-chain DB
      let token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        tokenId,
        true,
        undefined,
        undefined,
        true,
      );

      // retrieve token category
      const { tokenCategory } =
        await this.assetDataService.retrieveAssetTypeAndTokenCategoryFromTemplate(
          tenantId,
          token[TokenKeys.ASSET_TEMPLATE_ID],
        );

      // check asset data completion
      const [assetDataComplete, assetDataCompletionMessage]: [boolean, string] =
        await this.apiMetadataCallService.checkAssetDataCompletion(
          tenantId,
          user[UserKeys.USER_ID],
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
        );

      if (!assetDataComplete) {
        ErrorService.throwError(
          `deployAssetInstance:${assetDataCompletionMessage}`,
        );
      }

      const assetData: AssetData =
        this.assetDataService.retrieveAssetData(token);

      const {
        assetCreationFlow,
        creatorId,
        reviewerId,
        issuerId,
      }: {
        assetCreationFlow: AssetCreationFlow;
        creatorId: string;
        reviewerId: string;
        issuerId: string;
      } = this.assetDataService.retrieveAssetCreationFlowData(
        token,
        token[TokenKeys.TOKEN_ID],
        true, // reviewerIdRequired
      );

      const assetType = assetData.type;

      // Extract workflow instance ID from token
      const workflowInstanceId: number =
        this.assetDataService.retrieveAssetWorkflowInstance(token);
      const workflowInstance: Action =
        await this.workflowService.retrieveWorkflowInstances(
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
        );

      const [issuerTokenlink, creator, issuer, reviewer, config]: [
        Link,
        User,
        User,
        User,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuerId,
          UserType.ISSUER,
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.apiEntityCallService.fetchEntity(tenantId, creatorId, true),
        this.apiEntityCallService.fetchEntity(tenantId, issuerId, true),
        assetCreationFlow === AssetCreationFlow.TRI_PARTY
          ? this.apiEntityCallService.fetchEntity(tenantId, reviewerId, true)
          : undefined,
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const assetTemplateData: AssetTemplate =
        await this.assetDataService.retrieveSavedAssetData(
          tenantId,
          issuer,
          token[TokenKeys.ASSET_TEMPLATE_ID],
          token[TokenKeys.TOKEN_ID],
        );

      if (!assetTemplateData) {
        ErrorService.throwError(
          `no asset data was found for token with ID ${
            token[TokenKeys.TOKEN_ID]
          }`,
        );
      }

      const generalData = assetData[AssetDataKeys.ASSET];
      const classData = assetData[AssetDataKeys.CLASS];

      this.checkAssetClassesData(classData, assetType);

      const participants =
        token[TokenKeys.ASSET_DATA]?.[AssetDataKeys.ASSET]?.[
          GeneralDataKeys.PARTICIPANTS
        ];
      if (assetType === AssetType.SYNDICATED_LOAN) {
        this.checkParticipants(tenantId, null, participants, true);
      }

      // Update asset
      token = await this.apiMetadataCallService.updateTokenInDB(
        tenantId,
        token[TokenKeys.TOKEN_ID],
        {
          [TokenKeys.NAME]: generalData[GeneralDataKeys.NAME],
          [TokenKeys.SYMBOL]: generalData[GeneralDataKeys.SYMBOL],
        },
      );

      // Perform several checks before updating the asset
      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      const _tokenStandard: SmartContract =
        this.tokenHelperService.retrieveTokenStandardIfValidOrRetrieveDefaultOne(
          tokenCategory,
          token[TokenKeys.STANDARD],
        );
      const _assetClasses: Array<string> =
        this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
          token[TokenKeys.ASSET_CLASSES],
        );
      const _tokenName: string =
        this.tokenHelperService.retrieveTokenNameIfValidOrRetrieveDefaultOne(
          token[TokenKeys.NAME],
        );
      const _tokenSymbol: string =
        this.tokenHelperService.retrieveTokenSymbolIfValidOrRetrieveDefaultOne(
          token[TokenKeys.SYMBOL],
        );

      const _certificateActivated: boolean =
        token[TokenKeys.DATA][TokenKeys.DATA__CERTIFICATE_ACTIVATED];
      const _certificateTypeAsNumber: number =
        token[TokenKeys.DATA][TokenKeys.DATA__CERTIFICATE_TYPE_AS_NUMBER];

      const _unregulatedERC20transfersActivated: boolean =
        token[TokenKeys.DATA][
          TokenKeys.DATA__UNREGULATED_ERC20_TRANSFERS_ACTIVATED
        ];

      const customExtensionAddress: string =
        token[TokenKeys.DATA][TokenKeys.DATA__CUSTOM_EXTENSION_ADDRESS];

      const initialOwnerAddress: string =
        token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_OWNER_ADDRESS];

      const initialSupplies: Array<InitialSupply> =
        token[TokenKeys.DATA][TokenKeys.DATA__INITIAL_SUPPLIES];
      if (initialSupplies && initialSupplies.length > 0) {
        // Check initial supplies - this step can potentially fail if users are not valid
        const initialUsersAndWallets: {
          [userId: string]: { user: User; wallet: Wallet };
        } = await this.tokenCreationService.checkInitialSupplies(
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

      // Idempotency
      const targetState = 'deployed';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        workflowInstance[ActionKeys.DATA],
        targetState,
      );
      if (
        workflowInstance[ActionKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Token deployment has already been triggered, return action without updating it (idempotency)
        return {
          token,
          tokenAction: workflowInstance,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            workflowInstance[ActionKeys.DATA],
            targetState,
          ),
          message: `Asset instance deployment was already done (tx ${txStatus})`,
        };
      }

      // Retrieve Wallet
      const issuerWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          issuer,
          issuerTokenlink,
        );

      let baseUri;
      if (assetType === AssetType.COLLECTIBLE) {
        const storageType =
          assetData[AssetDataKeys.ASSET][GeneralDataKeys.STORAGE];
        const contractMetadata = this.tokenHelperService.craftContractMetadata(
          tenantId,
          assetData,
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          storageType,
        );
        if (storageType === CollectibleStorageType.IPFS) {
          baseUri = await this.externalStrorage.uploadIpfs(
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

      // Check if state transition is possible, by asking Workflow-API
      const nextStatus: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        workflowInstance[WorkflowInstanceKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // deployAssetInstance
      );

      if (assetType === AssetType.SYNDICATED_LOAN) {
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          tenantId,
          user,
          participants[ParticipantKeys.BORROWER_ID],
          tokenId,
          EntityType.TOKEN,
          _assetClasses[0], // assetClassKey
          null,
          null,
          null,
          null,
          sendNotification,
          FunctionName.KYC_INVITE,
          authToken,
        );
        await this.kycWorkflowAllowListService.allowListSubmitterForEntityandCreateLinkIfRequired(
          tenantId,
          user,
          participants[ParticipantKeys.UNDERWRITER_ID],
          tokenId,
          EntityType.TOKEN,
          undefined, // assetClassKey
          null,
          null,
          null,
          null,
          sendNotification,
          FunctionName.KYC_INVITE,
          authToken,
        );
      }

      // Create NAV value if defined
      await this.createAllNAVDataIfRequired(
        tenantId,
        issuerId,
        typeFunctionUser,
        functionName,
        token,
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
            _certificateActivated, // DEPRECATED (replaced by certificateType)
            _certificateTypeAsNumber, // only for ERC1400
            _unregulatedERC20transfersActivated, // only for ERC1400
            _assetClasses, // only for ERC1400
            customExtensionAddress, // optional
            initialOwnerAddress, // optional,
            '', // only for ERC721
            baseUri, // only for ERC721
          ),
          authToken,
          config,
        );

      const transactionId = deploymentResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      const updatedTokenData = this.transactionHelperService.addPendingTxToData(
        token[TokenKeys.DATA],
        issuer[UserKeys.USER_ID],
        issuerWallet,
        nextStatus,
        transactionId,
        ethService,
        deploymentResponse[ApiSCResponseKeys.TX_SERIALIZED],
        deploymentResponse[ApiSCResponseKeys.TX],
      );

      if (baseUri) {
        updatedTokenData['baseUri'] = baseUri;
      }

      const tokenUpdates = {
        [TokenKeys.DATA]: updatedTokenData,
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

      // Update workflow instance in off-chain DB
      const updatedWorkflowInstanceData = {
        ...this.transactionHelperService.addPendingTxToData(
          workflowInstance[ActionKeys.DATA],
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextStatus,
          transactionId,
          ethService,
          deploymentResponse[ApiSCResponseKeys.TX_SERIALIZED],
          deploymentResponse[ApiSCResponseKeys.TX],
        ),
      };

      const newWorkflowInstance = {
        ...workflowInstance,
        [ActionKeys.DATA]: updatedWorkflowInstanceData,
      };
      const updatedWorkflowInstance: Action =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          newWorkflowInstance[ActionKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newWorkflowInstance,
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
        [HookKeys.RESPONSE_PENDING]: `Asset instance ${
          token[TokenKeys.TOKEN_ID]
        } created successfully (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `Asset instance ${
          updatedToken[TokenKeys.TOKEN_ID]
        } creation succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `Asset instance ${
          updatedToken[TokenKeys.TOKEN_ID]
        } creation failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: deploymentResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: deploymentResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: deploymentResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedWorkflowInstance,
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

      // Create coupon events for each asset class
      for (const cData of classData) {
        if (cData[ClassDataKeys.COUPON_RATE]) {
          const valuationDate = combineDateAndTime(
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.VALUATION_DATE
            ],
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.VALUATION_HOUR
            ],
          );

          const settlementDate = combineDateAndTime(
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.SETTLEMENT_DATE
            ],
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.SETTLEMENT_HOUR
            ],
          );

          const maturityDate = combineDateAndTime(
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.UNPAID_FLAG_DATE
            ],
            cData[ClassDataKeys.INITIAL_SUBSCRIPTION][
              SubscriptionRedemptionKeys.UNPAID_FLAG_HOUR
            ],
          );
          const coupon = retrieveCouponIfValid(cData, settlementDate);
          this.createCouponEvents(
            tenantId,
            tokenId,
            typeFunctionUser,
            issuer[UserKeys.USER_ID],
            cData[ClassDataKeys.KEY],
            cData[ClassDataKeys.RULES][
              ClassDataKeys.RULES__MAX_SUBSCRIPTION_AMOUNT
            ],
            coupon,
            valuationDate,
            maturityDate,
          );
        }
      }

      if (sendNotification) {
        if (assetCreationFlow === AssetCreationFlow.BI_PARTY) {
          if (token[TokenKeys.DATA]?.[TokenKeys.DATA__EXTERNAL_IMPORTER]) {
            this.apiMailingCallService.sendInvestorImportedAssetReviewApprovedMail(
              tenantId,
              creator,
              initialSupplies[0]?.[SupplyKeys.QUANTITY] ?? 0,
              token,
              _assetClasses[0],
              authToken,
            );
          } else {
            this.apiMailingCallService.sendInvestorAssetReviewApprovedMail(
              tenantId,
              tokenId,
              creator,
              authToken,
            );
          }
        } else if (assetCreationFlow === AssetCreationFlow.TRI_PARTY) {
          this.apiMailingCallService.sendInvestorAssetReviewApprovedMail(
            tenantId,
            tokenId,
            creator,
            authToken,
          );

          this.apiMailingCallService.sendInvestorAssetReviewApprovedMail(
            tenantId,
            tokenId,
            reviewer,
            authToken,
          );
        }
      }

      if (asyncTx) {
        // Return response
        // Aynchronous transaction - waiting for transaction validation...
        return {
          token: updatedToken,
          tokenAction: updatedWorkflowInstance,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response: DeployAssetOutput =
          await this.tokenCreationService.tokenCreation_hook(
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
        'deploying asset instance',
        'deployAssetInstance',
        false,
        500,
      );
    }
  }

  /**
   * [check asset classes data]
   */
  checkAssetClassesData(
    classData: Array<ClassData>,
    assetType: AssetType,
  ): void {
    try {
      if (
        assetType === AssetType.PHYSICAL_ASSET ||
        assetType === AssetType.CLOSED_END_FUND ||
        assetType === AssetType.OPEN_END_FUND ||
        assetType === AssetType.SYNDICATED_LOAN ||
        assetType === AssetType.FIXED_RATE_BOND ||
        assetType === AssetType.CARBON_CREDITS ||
        assetType === AssetType.CURRENCY ||
        assetType === AssetType.COLLECTIBLE
      ) {
        const keysToCheck: Array<string> =
          assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK];

        for (const currentClassData of classData) {
          if (!currentClassData[ClassDataKeys.KEY]) {
            ErrorService.throwError(
              `missing key for asset class with name ${
                currentClassData[ClassDataKeys.NAME]
              }`,
            );
          }
          for (let index = 0; index < keysToCheck.length; index++) {
            const keyToCkeck = keysToCheck[index];
            if (currentClassData[keyToCkeck] === undefined) {
              ErrorService.throwError(
                `missing ${keyToCkeck} for assetclass with key ${
                  currentClassData[ClassDataKeys.KEY]
                }`,
              );
            }
          }

          if (keysToCheck.indexOf(ClassDataKeys.CURRENCY) > -1) {
            this.checkCurrency(
              currentClassData[ClassDataKeys.CURRENCY],
              currentClassData[ClassDataKeys.KEY],
            );
          }

          if (keysToCheck.indexOf(ClassDataKeys.CALENDAR) > -1) {
            this.checkCalendar(
              currentClassData[ClassDataKeys.CALENDAR],
              currentClassData[ClassDataKeys.KEY],
            );
          }

          if (keysToCheck.indexOf(ClassDataKeys.RULES) > -1) {
            this.checkSubscriptionRules(
              currentClassData[ClassDataKeys.RULES],
              currentClassData[ClassDataKeys.KEY],
              assetType,
            );
          }

          if (assetType === AssetType.CARBON_CREDITS) {
            // For carbon credits we can skip from here, since
            // cycles and other related fields below are not used
            // in carbon credits
            return;
          }

          let initialSubscriptionCycleTemplate: AssetCycleTemplate;
          if (currentClassData[ClassDataKeys.INITIAL_SUBSCRIPTION]) {
            initialSubscriptionCycleTemplate = this.retrieveCycleTemplate(
              craftAssetCycleTemplate(
                assetType,
                currentClassData[ClassDataKeys.INITIAL_SUBSCRIPTION],
                currentClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              ),
              currentClassData[ClassDataKeys.RULES],
              currentClassData[ClassDataKeys.KEY],
              'initial subscription',
              false, // recurrentCycle,
              assetType,
            );
          }

          let subsequentSubscriptionCycleTemplate: AssetCycleTemplate;
          if (
            currentClassData[ClassDataKeys.SUBSCRIPTION] &&
            currentClassData[ClassDataKeys.SUBSCRIPTION][
              SubscriptionRedemptionKeys.START_DATE
            ]
          ) {
            subsequentSubscriptionCycleTemplate = this.retrieveCycleTemplate(
              craftAssetCycleTemplate(
                assetType,
                currentClassData[ClassDataKeys.SUBSCRIPTION],
                currentClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              ),
              currentClassData[ClassDataKeys.RULES],
              currentClassData[ClassDataKeys.KEY],
              'subscription',
              assetClassRules[assetType][AssetClassRule.HAS_RECURRENT_CYCLE], // recurrentCycle
              assetType,
            );
          }

          let initialRedemptionCycleTemplate: AssetCycleTemplate;
          if (
            currentClassData[ClassDataKeys.INITIAL_REDEMPTION] &&
            currentClassData[ClassDataKeys.INITIAL_REDEMPTION][
              SubscriptionRedemptionKeys.START_DATE
            ]
          ) {
            initialRedemptionCycleTemplate = this.retrieveCycleTemplate(
              craftAssetCycleTemplate(
                assetType,
                currentClassData[ClassDataKeys.INITIAL_REDEMPTION],
                currentClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              ),
              currentClassData[ClassDataKeys.RULES],
              currentClassData[ClassDataKeys.KEY],
              'initial redemption',
              false, // recurrentCycle
              assetType,
            );
          }

          let subsequentRedemptionCycleTemplate: AssetCycleTemplate;
          if (
            currentClassData[ClassDataKeys.REDEMPTION] &&
            currentClassData[ClassDataKeys.REDEMPTION][
              SubscriptionRedemptionKeys.START_DATE
            ]
          ) {
            subsequentRedemptionCycleTemplate = this.retrieveCycleTemplate(
              craftAssetCycleTemplate(
                assetType,
                currentClassData[ClassDataKeys.REDEMPTION],
                currentClassData[ClassDataKeys.PAYMENT_OPTIONS]?.[
                  ClassDataKeys.PAYMENT_OPTIONS__OPTION
                ],
              ),
              currentClassData[ClassDataKeys.RULES],
              currentClassData[ClassDataKeys.KEY],
              'redemption',
              assetClassRules[assetType][AssetClassRule.HAS_RECURRENT_CYCLE], // recurrentCycle
              assetType,
            );
          }

          // Subscequent subscription, initial redemption & Subscequent redemption cycles are mandatory for open-end funds
          if (assetClassRules[assetType][AssetClassRule.HAS_RECURRENT_CYCLE]) {
            if (!subsequentSubscriptionCycleTemplate) {
              ErrorService.throwError(
                `missing subscription cycle for asset of type ${AssetType.OPEN_END_FUND}`,
              );
            }
            if (!initialRedemptionCycleTemplate) {
              ErrorService.throwError(
                `missing intial redemption cycle for asset of type ${AssetType.OPEN_END_FUND}`,
              );
            }
            if (!subsequentRedemptionCycleTemplate) {
              ErrorService.throwError(
                `missing redemption cycle for asset of type ${AssetType.OPEN_END_FUND}`,
              );
            }
          }

          if (keysToCheck.indexOf(ClassDataKeys.INTEREST) > -1) {
            this.checkInterest(
              currentClassData[ClassDataKeys.INTEREST],
              currentClassData[ClassDataKeys.KEY],
            );
            if (!currentClassData[ClassDataKeys.FACILITY_AMOUNT]) {
              ErrorService.throwError(
                `missing facility amount for asset of type ${assetType}`,
              );
            }
          }

          if (keysToCheck.indexOf(ClassDataKeys.FACILITY_AMOUNT) > -1) {
            if (!currentClassData[ClassDataKeys.FACILITY_AMOUNT]) {
              ErrorService.throwError(
                `missing facility amount for asset of type ${assetType}`,
              );
            }
          }

          // Subcequent subscription cycle can not start before the end of the initial subscription cycle
          this.cycleService.checkCyclesConsistency(
            initialSubscriptionCycleTemplate,
            subsequentSubscriptionCycleTemplate,
          );
        }
      } else {
        ErrorService.throwError(`invalid asset type (${assetType})`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'check asset classes data',
        'checkAssetClassesData',
        false,
        500,
      );
    }
  }

  retrieveAssetClassesKeys(classData: Array<ClassData>): Array<string> {
    try {
      const assetClassesKeys: Array<string> = [];
      classData.map((assetClass: ClassData) => {
        const assetClassKey: string = assetClass[ClassDataKeys.KEY];
        assetClassesKeys.push(assetClassKey);
      });

      return this.tokenHelperService.retrieveAssetClassesIfValidOrRetrieveDefaultOne(
        assetClassesKeys,
      );
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving asset classes keys',
        'retrieveAssetClassesKeys',
        false,
        500,
      );
    }
  }

  /**
   * [Check if marketplace is enabled]
   */
  checkMarketplaceEnabled(
    config: Config,
    assetCreationFlow: AssetCreationFlow,
    newFlow: boolean,
  ): boolean {
    try {
      if (
        assetCreationFlow !== AssetCreationFlow.SINGLE_PARTY &&
        !config[ConfigKeys.DATA][ConfigKeys.DATA__ENABLE_MARKETPLACE]
      ) {
        ErrorService.throwError(
          `Marketplace is not enabled in tenant's config, which is makes it impossible to ${
            newFlow ? 'start' : 'pursue'
          } an asset creation flow of type ${assetCreationFlow}`,
        );
      }
      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking asset status format',
        'checkAssetStatusFormat',
        false,
        500,
      );
    }
  }

  /**
   * [Check currency]
   */
  checkCurrency(currency: Currency, assetClassKey?: string): boolean {
    try {
      if (
        currency === Currency.EUR ||
        currency === Currency.USD ||
        currency === Currency.GBP ||
        currency === Currency.CHF ||
        currency === Currency.AUD ||
        currency === Currency.SGD ||
        currency === Currency.JPY ||
        currency === Currency.HKD ||
        currency === Currency.RMB ||
        currency === Currency.CAD
      ) {
        return true;
      } else {
        ErrorService.throwError(
          `invalid ${
            assetClassKey ? `currency for class ${assetClassKey}` : 'currency'
          }: shall be chosen amongst ${Currency.EUR}, ${Currency.USD}, ${
            Currency.GBP
          }, ${Currency.CHF}, ${Currency.AUD}, ${Currency.SGD}, ${
            Currency.HKD
          }, ${Currency.RMB}, ${Currency.JPY} and ${Currency.CAD}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking currency',
        'checkCurrency',
        false,
        500,
      );
    }
  }

  /**
   * [Check calendar]
   */
  checkCalendar(calendar: CalendarType, assetClassKey?: string): boolean {
    try {
      if (
        !calendar ||
        calendar === CalendarType.FIVE_DAYS ||
        calendar === CalendarType.SEVEN_DAYS
      ) {
        return true;
      } else {
        ErrorService.throwError(
          `invalid ${
            assetClassKey ? `calendar for class ${assetClassKey}` : 'calendar'
          }: shall be chosen amongst ${CalendarType.FIVE_DAYS} and ${
            CalendarType.SEVEN_DAYS
          }`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking calendar',
        'checkCalendar',
        false,
        500,
      );
    }
  }

  /**
   * [Check subscription rules]
   */
  checkSubscriptionRules(
    subscritionRules: SubscriptionRules,
    assetClassKey: string,
    assetType: AssetType,
  ) {
    try {
      const subscriptionTypes =
        subscritionRules[ClassDataKeys.RULES__SUBSCRIPTION_TYPE];
      if (
        subscriptionTypes &&
        subscriptionTypes !== OrderType.QUANTITY &&
        subscriptionTypes !== OrderType.AMOUNT
      ) {
        ErrorService.throwError(
          `invalid subscription types for asset class ${assetClassKey}: shall be chosen amongst ${OrderType.QUANTITY} and ${OrderType.AMOUNT}`,
        );
      }

      if (
        subscritionRules[ClassDataKeys.RULES__MAX_CANCELLATION_PERIOD] &&
        typeof subscritionRules[
          ClassDataKeys.RULES__MAX_CANCELLATION_PERIOD
        ] !== 'number'
      ) {
        ErrorService.throwError(
          `invalid subscription rule for asset class ${assetClassKey}: ${ClassDataKeys.RULES__MAX_CANCELLATION_PERIOD} shall be a number`,
        );
      }

      if (assetType === AssetType.FIXED_RATE_BOND) {
        if (!subscritionRules[ClassDataKeys.RULES__MIN_GLOBAL_SUBS_AMOUNT])
          ErrorService.throwError(
            `invalid subscription rule for asset class ${assetClassKey}: ${
              ClassDataKeys.RULES__MIN_GLOBAL_SUBS_AMOUNT
            } shall be defined for an asset of type ${assetType.toLowerCase()}`,
          );
        if (subscritionRules[ClassDataKeys.RULES__MIN_GLOBAL_SUBS_AMOUNT] < 0)
          ErrorService.throwError(
            `invalid subscription rule for asset class ${assetClassKey}: ${
              ClassDataKeys.RULES__MIN_GLOBAL_SUBS_AMOUNT
            } shall be positive for an asset of type ${assetType.toLowerCase()}`,
          );

        if (!subscritionRules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT])
          ErrorService.throwError(
            `invalid subscription rule for asset class ${assetClassKey}: ${
              ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT
            } shall be defined for an asset of type ${assetType.toLowerCase()}`,
          );
        if (subscritionRules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT] < 0)
          ErrorService.throwError(
            `invalid subscription rule for asset class ${assetClassKey}: ${
              ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT
            } shall be positive for an asset of type ${assetType.toLowerCase()}`,
          );
      }

      if (
        subscriptionTypes &&
        assetClassRules[assetType][AssetClassRule.SUBSCRIPTION_TYPES].indexOf(
          subscriptionTypes,
        ) === -1
      ) {
        ErrorService.throwError(
          `invalid subscription rule for asset class ${assetClassKey}: ${
            ClassDataKeys.RULES__SUBSCRIPTION_TYPE
          } shall be ${
            OrderType.QUANTITY
          } for an asset of type ${assetType.toLowerCase()}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking subscription rules',
        'checkSubscriptionRules',
        false,
        500,
      );
    }
  }

  /**
   * [Check interest]
   */
  checkInterest(interest: Interest, assetClassKey: string) {
    try {
      const baseRateType = interest[InterestKeys.BASE_RATE_TYPE];
      if (
        !baseRateType ||
        (baseRateType !== BaseInterestRateType.FIXED &&
          baseRateType !== BaseInterestRateType.FLOATING)
      ) {
        ErrorService.throwError(
          `invalid base interest rate type for facility ${assetClassKey}: shall be chosen amongst ${BaseInterestRateType.FIXED} and ${BaseInterestRateType.FLOATING}`,
        );
      }

      const baseRate = interest[InterestKeys.BASE_RATE];
      if (
        !baseRate ||
        (baseRate !== BaseInterestRate.BBSW &&
          baseRate !== BaseInterestRate.CASH_RATE)
      ) {
        ErrorService.throwError(
          `invalid base interest rate for facility ${assetClassKey}: shall be chosen amongst ${BaseInterestRate.BBSW} and ${BaseInterestRate.CASH_RATE}`,
        );
      }

      if (!interest[InterestKeys.MARGIN]) {
        ErrorService.throwError(`invalid margin for facility ${assetClassKey}`);
      }

      if (!interest[InterestKeys.DEFAULT_RATE]) {
        ErrorService.throwError(
          `invalid default rate for facility ${assetClassKey}`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking facility interest',
        'checkInterest',
        false,
        500,
      );
    }
  }

  /**
   * [Check Participants]
   */
  async checkParticipants(
    tenantId: string,
    tokenId: string,
    participants: Participants,
    shallExist: boolean,
  ) {
    try {
      const borrowerId = participants?.[ParticipantKeys.BORROWER_ID];
      const underwriterId = participants?.[ParticipantKeys.UNDERWRITER_ID];

      // Check if 'borrowerId' and 'underwriterId' are defined (only if shall exist)
      if (shallExist) {
        if (!borrowerId) {
          ErrorService.throwError(
            `borrowerId cannot be empty for loan with id ${tokenId}`,
          );
        }

        if (!underwriterId) {
          ErrorService.throwError(
            `underwriterId cannot be empty for loan with id ${tokenId}`,
          );
        }
      }

      // If defined, check borrowerId is valid
      if (borrowerId) {
        const borrower = await this.apiEntityCallService.fetchEntity(
          tenantId,
          borrowerId,
          true,
        );
        if (borrower[UserKeys.USER_TYPE] !== UserType.INVESTOR) {
          ErrorService.throwError(
            `invalid borrower with id ${borrowerId} userType should be INVESTOR`,
          );
        }
      }

      // If defined, check underwriterId is valid
      if (underwriterId) {
        const underwriter = await this.apiEntityCallService.fetchEntity(
          tenantId,
          underwriterId,
          true,
        );
        if (underwriter[UserKeys.USER_TYPE] !== UserType.UNDERWRITER) {
          ErrorService.throwError(
            `invalid borrower with id ${borrowerId} userType should be UNDERWRITER`,
          );
        }
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking facility interest',
        'checkInterest',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve cycle template]
   */
  retrieveCycleTemplate(
    assetCycleTemplate: AssetCycleTemplate,
    subscriptionRules: SubscriptionRules,
    assetClassLabel: string,
    cycleLabel: string,
    recurrentCycle: boolean,
    assetType: AssetType,
  ): AssetCycleTemplate {
    try {
      const logLabel = `for ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;

      // Check initial start date is well defined
      if (!assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE]) {
        ErrorService.throwError(
          `missing ${CycleKeys.TEMPLATE_FIRST_START_DATE} for ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`,
        );
      }

      // Check other dates are well defined
      let allDates: {
        [CycleDate.START]: Date;
        [CycleDate.CUTOFF]: Date;
        [CycleDate.VALUATION]: Date;
        [CycleDate.SETTLEMENT]: Date;
        [CycleDate.UNPAIDFLAG]: Date;
      };
      if (assetClassRules[assetType][AssetClassRule.HAS_SIMPLIFIED_DATES]) {
        allDates = this.calculateSimplifiedDates(
          assetCycleTemplate,
          assetClassLabel,
          cycleLabel,
        );
      } else {
        allDates = this.calculateAllDatesIfRequired(
          assetCycleTemplate,
          subscriptionRules,
          assetClassLabel,
          cycleLabel,
        );
      }

      // Check cycle recurrence (if defined)
      const cycleRecurrence: Recurrence =
        assetCycleTemplate[CycleKeys.TEMPLATE_RECURRENCE];
      if (
        recurrentCycle &&
        cycleRecurrence !== Recurrence.DAILY &&
        cycleRecurrence !== Recurrence.BIDAILY &&
        cycleRecurrence !== Recurrence.WEEKLY &&
        cycleRecurrence !== Recurrence.BIWEEKLY &&
        cycleRecurrence !== Recurrence.MONTHLY &&
        cycleRecurrence !== Recurrence.NEXT_DAY
      ) {
        ErrorService.throwError(
          `invalid recurrence ${logLabel} (shall be chosen amongst ${Recurrence.DAILY}, ${Recurrence.BIDAILY}, ${Recurrence.WEEKLY}, ${Recurrence.BIWEEKLY}, ${Recurrence.MONTHLY} and ${Recurrence.NEXT_DAY})`,
        );
      }

      // Check payment option
      const paymentOption: PaymentOption =
        assetCycleTemplate[CycleKeys.TEMPLATE_PAYMENT_OPTION];
      if (
        assetType === AssetType.PHYSICAL_ASSET &&
        paymentOption !== PaymentOption.AT_ORDER_CREATION
      ) {
        ErrorService.throwError(
          `invalid payment option ${logLabel}: payment option shall be ${PaymentOption.AT_ORDER_CREATION} for an asset of type ${AssetType.PHYSICAL_ASSET}`,
        );
      } else if (
        paymentOption !== PaymentOption.AT_ORDER_CREATION &&
        paymentOption !== PaymentOption.BETWEEN_CUTOFF_AND_SETTLEMENT
      ) {
        ErrorService.throwError(
          `invalid payment option ${logLabel} (shall be chosen amongst ${PaymentOption.AT_ORDER_CREATION} and ${PaymentOption.AT_ORDER_CREATION})`,
        );
      }

      return {
        ...assetCycleTemplate,
        [CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE]: allDates[CycleDate.CUTOFF],
        [CycleKeys.TEMPLATE_FIRST_VALUATION_DATE]:
          allDates[CycleDate.VALUATION],
        [CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE]:
          allDates[CycleDate.SETTLEMENT],
        [CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]:
          allDates[CycleDate.UNPAIDFLAG],
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving cycle template',
        'retrieveCycleTemplate',
        false,
        500,
      );
    }
  }

  /**
   * [Check simplified dates]
   */
  checkSimplifiedDates(
    allDates: {
      [CycleDate.START]: Date;
      [CycleDate.CUTOFF]: Date;
      [CycleDate.VALUATION]: Date;
      [CycleDate.SETTLEMENT]: Date;
      [CycleDate.UNPAIDFLAG]: Date;
    },
    assetClassLabel: string,
    cycleLabel: string,
  ): boolean {
    try {
      const logLabel = `${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;
      const currentDate: Date = new Date();

      if (!allDates[CycleDate.START]) {
        ErrorService.throwError(
          `problem in ${logLabel}: cycle first start date is not defined`,
        );
      } else if (isNaN(Number(allDates[CycleDate.START]))) {
        // true if date is equal to "INVALID DATE"
        ErrorService.throwError(`invalid cycle first start date ${logLabel}`);
      } else if (
        allDates[CycleDate.CUTOFF] &&
        isNaN(Number(allDates[CycleDate.CUTOFF]))
      ) {
        // true if date is equal to "INVALID DATE"
        ErrorService.throwError(`invalid cycle first cut-off date ${logLabel}`);
      } else if (
        !(currentDate.getTime() < allDates[CycleDate.START].getTime())
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: cycle first start date ${
            allDates[CycleDate.START]
          } can not be in the past (e.g. earlier than ${currentDate})`,
        );
      } else if (
        allDates[CycleDate.CUTOFF] &&
        !(
          allDates[CycleDate.START].getTime() <
          allDates[CycleDate.CUTOFF].getTime()
        )
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: first cut-off date ${
            allDates[CycleDate.CUTOFF]
          } can not be earlier than first start date ${
            allDates[CycleDate.START]
          })`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking simplified dates',
        'checkSimplifiedDates',
        false,
        500,
      );
    }
  }

  /**
   * [Check all dates]
   */
  checkAllDates(
    allDates: {
      [CycleDate.START]: Date;
      [CycleDate.CUTOFF]: Date;
      [CycleDate.VALUATION]: Date;
      [CycleDate.SETTLEMENT]: Date;
      [CycleDate.UNPAIDFLAG]: Date;
    },
    assetClassLabel: string,
    cycleLabel: string,
  ): boolean {
    try {
      const logLabel = `${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;
      const currentDate: Date = new Date();

      if (!(currentDate.getTime() <= allDates[CycleDate.START].getTime())) {
        ErrorService.throwError(
          `problem in ${logLabel}: cycle first start date ${
            allDates[CycleDate.START]
          } can not be in the past (e.g. earlier than ${currentDate})`,
        );
      } else if (
        !(
          allDates[CycleDate.START].getTime() <=
          allDates[CycleDate.CUTOFF].getTime()
        )
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: first cut-off date ${
            allDates[CycleDate.CUTOFF]
          } can not be earlier than first start date ${
            allDates[CycleDate.START]
          })`,
        );
      } else if (
        !(
          allDates[CycleDate.CUTOFF].getTime() <=
          allDates[CycleDate.SETTLEMENT].getTime()
        )
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: first settlement date ${
            allDates[CycleDate.SETTLEMENT]
          } can not be earlier than first cut-off date ${
            allDates[CycleDate.CUTOFF]
          })`,
        );
      } else if (
        !(
          allDates[CycleDate.SETTLEMENT].getTime() <=
          allDates[CycleDate.UNPAIDFLAG].getTime()
        )
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: first unpaid flag date ${
            allDates[CycleDate.UNPAIDFLAG]
          } can not be earlier than first settlement date ${
            allDates[CycleDate.SETTLEMENT]
          })`,
        );
      } else if (
        !(
          allDates[CycleDate.START].getTime() <=
          allDates[CycleDate.VALUATION].getTime()
        )
      ) {
        ErrorService.throwError(
          `problem in ${logLabel}: first valuation date ${
            allDates[CycleDate.VALUATION]
          } can not be earlier than first start date ${
            allDates[CycleDate.START]
          })`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking all dates',
        'checkAllDates',
        false,
        500,
      );
    }
  }

  /**
   * [Calculate simplified dates (used only for physical assets)]
   */
  calculateSimplifiedDates(
    assetCycleTemplate: AssetCycleTemplate,
    assetClassLabel: string,
    cycleLabel: string,
  ): {
    [CycleDate.START]: Date;
    [CycleDate.CUTOFF]: Date;
    [CycleDate.VALUATION]: Date;
    [CycleDate.SETTLEMENT]: Date;
    [CycleDate.UNPAIDFLAG]: Date;
  } {
    try {
      const dates = {
        [CycleDate.START]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_START_DATE
        ]
          ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE])
          : undefined,
        [CycleDate.CUTOFF]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
        ]
          ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE])
          : undefined,
        [CycleDate.VALUATION]: undefined,
        [CycleDate.SETTLEMENT]: undefined,
        [CycleDate.UNPAIDFLAG]: undefined,
      };

      this.checkSimplifiedDates(dates, assetClassLabel, cycleLabel);

      return dates;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calculating simplified dates',
        'calculateSimplifiedDates',
        false,
        500,
      );
    }
  }

  /**
   * [Calculate all dates if required]
   */
  calculateAllDatesIfRequired(
    assetCycleTemplate: AssetCycleTemplate,
    assetClassRules: SubscriptionRules,
    assetClassLabel: string,
    cycleLabel: string,
  ): {
    [CycleDate.START]: Date;
    [CycleDate.CUTOFF]: Date;
    [CycleDate.VALUATION]: Date;
    [CycleDate.SETTLEMENT]: Date;
    [CycleDate.UNPAIDFLAG]: Date;
  } {
    try {
      const logLabel = `for ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;

      const dates = {
        [CycleDate.START]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_START_DATE
        ]
          ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_START_DATE])
          : undefined,
        [CycleDate.CUTOFF]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE
        ]
          ? new Date(assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE])
          : undefined,
        [CycleDate.VALUATION]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_VALUATION_DATE
        ]
          ? new Date(
              assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_VALUATION_DATE],
            )
          : undefined,
        [CycleDate.SETTLEMENT]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE
        ]
          ? new Date(
              assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE],
            )
          : undefined,
        [CycleDate.UNPAIDFLAG]: assetCycleTemplate[
          CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE
        ]
          ? new Date(
              assetCycleTemplate[CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE],
            )
          : undefined,
      };

      const offsets = {
        [CycleDate.START]: undefined,
        [CycleDate.CUTOFF]:
          assetCycleTemplate[CycleKeys.TEMPLATE_OFFSET_CUTOFF],
        [CycleDate.VALUATION]:
          assetCycleTemplate[CycleKeys.TEMPLATE_OFFSET_VALUATION],
        [CycleDate.SETTLEMENT]:
          assetCycleTemplate[CycleKeys.TEMPLATE_OFFSET_SETTLEMENT],
        [CycleDate.UNPAIDFLAG]:
          assetCycleTemplate[CycleKeys.TEMPLATE_OFFSET_UNPAID_FLAG],
      };

      // In case the valuation date is not used, we set it to settlement date by default, in order to avoid code complication below
      if (!dates[CycleDate.VALUATION]) {
        // Check the valuation date is not used as origin by an offset parameter
        this.checkDateIsNotUsedAsOrigin(
          offsets,
          CycleDate.VALUATION,
          assetClassLabel,
          cycleLabel,
        );
        if (!dates[CycleDate.VALUATION]) {
          dates[CycleDate.VALUATION] = dates[CycleDate.SETTLEMENT];
        }
        if (!offsets[CycleDate.VALUATION]) {
          offsets[CycleDate.VALUATION] = offsets[CycleDate.SETTLEMENT];
        }
      }

      // In case the unpaid flag date is not used, we set it to 100 years from now by default, in order to avoid code complication below
      if (!dates[CycleDate.UNPAIDFLAG]) {
        // Check the valuation date is not used as origin by an offset parameter
        this.checkDateIsNotUsedAsOrigin(
          offsets,
          CycleDate.UNPAIDFLAG,
          assetClassLabel,
          cycleLabel,
        );
        if (!dates[CycleDate.UNPAIDFLAG]) {
          const now = new Date();
          dates[CycleDate.UNPAIDFLAG] = new Date(
            now.getFullYear() + 100,
            now.getMonth(),
            now.getDate(),
          );
        }
      }

      const originDates = {};

      const cycleDatesArray: Array<CycleDate> = Object.keys(CycleDate).map(
        (key) => {
          return CycleDate[key];
        },
      );

      // Check offsets are formatted properly, and extract origin dates from offsets
      for (let index = 0; index < cycleDatesArray.length; index++) {
        const cycleDate: CycleDate = cycleDatesArray[index];
        const date: Date = dates[cycleDate];
        const offset: AssetCycleOffset = offsets[cycleDate];
        if (!date) {
          if (!offset) {
            ErrorService.throwError(
              `missing ${cycleDate.toLowerCase()} date ${logLabel}`,
            );
          } else {
            originDates[cycleDate] = this.retrieveOriginDateFromOffsetData(
              offset,
              cycleDate,
              assetClassLabel,
              cycleLabel,
            );
          }
        } else if (isNaN(Number(dates[Object.keys(CycleDate)[index]]))) {
          // true if date is equal to "INVALID DATE"
          ErrorService.throwError(
            `invalid ${cycleDatesArray[index].toLowerCase()} date ${logLabel}`,
          );
        }
      }

      // If required, calculate dates from other dates
      for (let index = 0; index < cycleDatesArray.length; index++) {
        const cycleDate: CycleDate = cycleDatesArray[index];
        const date: Date = dates[cycleDate];
        if (!date) {
          dates[cycleDate] = this.calculateDateFromOtherDatesIfRequired(
            dates,
            offsets,
            originDates,
            cycleDate,
            0,
            assetClassLabel,
            cycleLabel,
          );
        }
      }

      // Check if all dates have been calculated properly
      for (let index = 0; index < cycleDatesArray.length; index++) {
        const cycleDate: CycleDate = cycleDatesArray[index];
        const date: Date = dates[cycleDate];
        if (!date) {
          ErrorService.throwError(
            `shall never happen: error in algorithm ${logLabel}`,
          );
        }
      }

      this.checkAllDates(dates, assetClassLabel, cycleLabel);

      return dates;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calculating all dates',
        'calculateAllDatesIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Calculate date from other dates if possible]
   */
  calculateDateFromOtherDatesIfRequired(
    dates: {
      [key: string]: Date;
    },
    offsets: {
      [key: string]: AssetCycleOffset;
    },
    originDates: {
      [key: string]: CycleDate;
    },
    cycleDate: CycleDate,
    nbRecurrences: number,
    assetClassLabel: string,
    cycleLabel: string,
  ): Date {
    try {
      const logLabel = `for ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;

      if (dates[cycleDate]) {
        return dates[cycleDate];
      } else if (nbRecurrences < Object.keys(CycleDate).length) {
        const days: number = offsets[cycleDate][CycleKeys.OFFSET_DAYS];
        const offsetType: OffsetType =
          offsets[cycleDate][CycleKeys.OFFSET_TYPE];
        const originDate: Date = this.calculateDateFromOtherDatesIfRequired(
          dates,
          offsets,
          originDates,
          originDates[cycleDate],
          nbRecurrences + 1,
          assetClassLabel,
          cycleLabel,
        );
        const hours: number = offsets[cycleDate][CycleKeys.OFFSET_HOUR];

        const preCalculatedDate: Date = new Date(
          offsetType === OffsetType.AFTER
            ? originDate.getTime() + days * DAY_IN_MILLISECONDS
            : originDate.getTime() - days * DAY_IN_MILLISECONDS,
        );
        const calculatedDate: Date = new Date(
          preCalculatedDate.getFullYear(),
          preCalculatedDate.getMonth(),
          preCalculatedDate.getDate(),
          hours,
          0, // minutes
          0, // seconds
          0, // millis
        );
        dates[cycleDate] = calculatedDate;
        return calculatedDate;
      } else {
        ErrorService.throwError(
          `invalid date offsets ${logLabel}: circular dependancy`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'calculating date from other dates if possible',
        'calculateDateFromOtherDatesIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Retrieve origin date from offset data]
   */
  retrieveOriginDateFromOffsetData(
    assetCycleOffset: AssetCycleOffset,
    cycleDate: CycleDate,
    assetClassLabel: string,
    cycleLabel: string,
  ): CycleDate {
    try {
      const logLabel = `for ${cycleDate} offset of ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;

      this.checkOffsetData(
        assetCycleOffset,
        assetClassLabel,
        cycleLabel,
        cycleDate,
      );

      if (assetCycleOffset[CycleKeys.OFFSET_ORIGIN] === cycleDate) {
        ErrorService.throwError(
          `invalid ${CycleKeys.OFFSET_ORIGIN} ${logLabel}: circular dependancy`,
        );
      }

      return assetCycleOffset[CycleKeys.OFFSET_ORIGIN];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving origin date from offset data',
        'retrieveOriginDateFromOffsetData',
        false,
        500,
      );
    }
  }

  /**
   * [CCheck date is not used as origin]
   */
  checkDateIsNotUsedAsOrigin(
    offsets: {
      [CycleDate.START]: AssetCycleOffset;
      [CycleDate.CUTOFF]: AssetCycleOffset;
      [CycleDate.VALUATION]: AssetCycleOffset;
      [CycleDate.SETTLEMENT]: AssetCycleOffset;
      [CycleDate.UNPAIDFLAG]: AssetCycleOffset;
    },
    forbiddenOriginDate: CycleDate,
    assetClassLabel: string,
    cycleLabel: string,
  ): boolean {
    try {
      const cycleDatesArray: Array<CycleDate> = Object.keys(CycleDate).map(
        (key) => {
          return CycleDate[key];
        },
      );

      for (let index = 0; index < cycleDatesArray.length; index++) {
        const cycleDate: CycleDate = cycleDatesArray[index];
        const logLabel = `for ${cycleDate.toLowerCase()} date offset of ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;

        const offset: AssetCycleOffset = offsets[cycleDate];
        if (
          offset &&
          offset[CycleKeys.OFFSET_ORIGIN] &&
          offset[CycleKeys.OFFSET_ORIGIN] === forbiddenOriginDate
        ) {
          ErrorService.throwError(
            `invalid origin (${offset[CycleKeys.OFFSET_ORIGIN]}) ${logLabel}`,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking date is not used as origin',
        'checkDateIsNotUsedAsOrigin',
        false,
        500,
      );
    }
  }

  /**
   * [CCheck offset data]
   */
  checkOffsetData(
    assetCycleOffset: AssetCycleOffset,
    assetClassLabel: string,
    cycleLabel: string,
    dateLabel: string,
  ): boolean {
    try {
      const logLabel = `for ${dateLabel.toLowerCase()} date offset of ${cycleLabel} cycle of assetclass with key ${assetClassLabel}`;
      const cycleDatesArray: Array<CycleDate> = Object.keys(CycleDate).map(
        (key) => {
          return CycleDate[key];
        },
      );

      // Check days are valid
      if (!(assetCycleOffset && assetCycleOffset[CycleKeys.OFFSET_DAYS] >= 0)) {
        ErrorService.throwError(
          `invalid number of days(${
            assetCycleOffset[CycleKeys.OFFSET_DAYS]
          }) ${logLabel}: number of days shall be positive`,
        );
      }

      // Check offset type is valid
      if (
        !(
          assetCycleOffset &&
          (assetCycleOffset[CycleKeys.OFFSET_TYPE] === OffsetType.BEFORE ||
            assetCycleOffset[CycleKeys.OFFSET_TYPE] === OffsetType.AFTER)
        )
      ) {
        ErrorService.throwError(
          `invalid offset type(${
            assetCycleOffset[CycleKeys.OFFSET_TYPE]
          }) ${logLabel}: shall be equal to ${OffsetType.BEFORE} or ${
            OffsetType.AFTER
          }`,
        );
      }

      // Check origin is valid
      if (
        !(
          assetCycleOffset &&
          cycleDatesArray.indexOf(assetCycleOffset[CycleKeys.OFFSET_ORIGIN]) >=
            0
        )
      ) {
        ErrorService.throwError(
          `invalid origin (${
            assetCycleOffset[CycleKeys.OFFSET_ORIGIN]
          }) ${logLabel}: shall be equal to ${CycleDate.START}, ${
            CycleDate.CUTOFF
          }, ${CycleDate.VALUATION}, ${CycleDate.SETTLEMENT} or ${
            CycleDate.UNPAIDFLAG
          }`,
        );
      }

      // Check hours are valid
      if (
        !(
          assetCycleOffset &&
          assetCycleOffset[CycleKeys.OFFSET_HOUR] >= 0 &&
          assetCycleOffset[CycleKeys.OFFSET_HOUR] < 24
        )
      ) {
        ErrorService.throwError(
          `invalid number of hours(${
            assetCycleOffset[CycleKeys.OFFSET_HOUR]
          }) ${logLabel}: number of hours shall be positive and lower than 24`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking offset data',
        'checkOffsetData',
        false,
        500,
      );
    }
  }

  /**
   * [Create all NAV values if required]
   */
  async createAllNAVDataIfRequired(
    tenantId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    functionName: FunctionName,
    token: Token,
  ): Promise<void> {
    try {
      if (
        token[TokenKeys.ASSET_DATA] &&
        token[TokenKeys.ASSET_DATA][AssetDataKeys.CLASS]
      ) {
        // Create workflow instance in Workflow-API
        const navWorkflowId: number = (
          await this.workflowTemplateService.retrieveWorkflowTemplate(
            tenantId,
            WorkflowTemplateEnum.name,
            undefined,
            WorkflowName.NAV,
          )
        )[WorkflowTemplateKeys.ID];

        const classMedata = token[TokenKeys.ASSET_DATA][
          AssetDataKeys.CLASS
        ] as ClassData[];

        await Promise.all(
          classMedata.map((assetClassData: ClassData) => {
            return this.createNAVValueIfRequired(
              tenantId,
              issuerId,
              typeFunctionUser,
              functionName,
              navWorkflowId,
              token,
              assetClassData,
            );
          }),
        );
      } else {
        ErrorService.throwError(
          `nav can not be set for token ${
            token[TokenKeys.TOKEN_ID]
          } as asset classes are not defined`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating all NAV data if required',
        'createAllNAVDataIfRequired',
        false,
        500,
      );
    }
  }

  /**
   * [Create NAV value if required]
   */
  async createNAVValueIfRequired(
    tenantId: string,
    issuerId: string,
    typeFunctionUser: UserType,
    functionName: FunctionName,
    navWorkflowId: number,
    token: Token,
    classMetadata: ClassData,
  ): Promise<NAV> {
    try {
      if (
        classMetadata[ClassDataKeys.NAV] &&
        classMetadata[ClassDataKeys.NAV][ClassDataKeys.NAV__VALUE]
      ) {
        const navValue: number =
          classMetadata[ClassDataKeys.NAV][ClassDataKeys.NAV__VALUE];

        const nextStatus: string =
          await WorkflowMiddleWare.checkStateTransition(
            tenantId,
            WorkflowName.NAV,
            undefined, // workflow instance ID
            typeFunctionUser,
            functionName, // deployAssetInstance
          );

        const navData: NAV = await this.workflowService.createWorkflowInstance(
          tenantId,
          undefined, // idempotencyKey
          WorkflowType.NAV,
          functionName,
          typeFunctionUser,
          issuerId,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          undefined, // objectId
          undefined, // recipientId
          undefined, // brokerId
          undefined, // agentId
          navWorkflowId,
          navValue, // quantity
          undefined, // price
          undefined, // documentId
          undefined, // wallet - not relevant for NAV
          classMetadata[ClassDataKeys.KEY], // assetClass
          new Date(),
          nextStatus, // NavStatus.NAV_VALIDATED,
          undefined, //offerId
          undefined, //orderSide
          {},
        );
        return navData;
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating NAV value if required',
        'createNAVValueIfRequired',
        false,
        500,
      );
    }
  }

  async createCouponEvents(
    tenantId: string,
    tokenId: string,
    typeFunctionUser: UserType,
    userId: string,
    assetClassesKey: string,
    amount: number,
    coupon: Coupon,
    issuanceDate: Date,
    maturityDate: Date,
  ): Promise<void> {
    try {
      const {
        couponPaymentDate,
        rateValue,
        paymentFrequency,
        rateFrequency,
        couponCalendar,
      } = coupon;

      const paymentFrequencyFraction =
        getFractionFromFrequency(paymentFrequency);
      const rateFrequencyFraction = getFractionFromFrequency(rateFrequency);

      const couponsSchedule = await couponsScheduler(
        maturityDate,
        couponPaymentDate,
        paymentFrequency,
      );

      const firstDaysCount = await dayCounter(
        issuanceDate.toString(),
        couponPaymentDate?.toString(),
        couponCalendar,
      );
      const daysInYearCount = await dayCounter(
        issuanceDate.toString(),
        addDate(new Date(issuanceDate), 1, dateAmountType.YEARS).toISOString(),
        couponCalendar,
      );

      const firstCouponValue =
        (((parseFloat(rateValue) / 100) * (amount / paymentFrequencyFraction)) /
          (daysInYearCount / rateFrequencyFraction)) *
        firstDaysCount;

      await this.workFlowsEventService.createEvent(
        tenantId,
        undefined,
        typeFunctionUser,
        userId,
        tokenId,
        assetClassesKey,
        EventType.COUPON,
        new Date(couponPaymentDate),
        firstCouponValue.toString(),
        undefined,
        undefined,
        undefined,
      );

      couponsSchedule.forEach(async (couponPaymentDate, index) => {
        if (index < 1) return;
        const couponValue =
          (((parseFloat(rateValue) / 100) * amount) /
            paymentFrequencyFraction) *
          rateFrequencyFraction;

        await this.workFlowsEventService.createEvent(
          tenantId,
          undefined,
          typeFunctionUser,
          userId,
          tokenId,
          assetClassesKey,
          EventType.COUPON,
          new Date(couponPaymentDate),
          couponValue.toString(),
          undefined,
          undefined,
          undefined,
        );
      });
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'create Coupon Events',
        'createCouponEvents',
        false,
        500,
      );
    }
  }

  private copyAutomaticStartDates(
    elementInstances: Array<AssetElementInstance>,
    elementInstanceMiddleString: string,
  ): void {
    const initialCutoffDate = elementInstances.find((elementInstance) =>
      elementInstance.key.endsWith(
        `initial${elementInstanceMiddleString}_cutoff_date`,
      ),
    ).value[0];
    const initialCutoffHour = elementInstances.find((elementInstance) =>
      elementInstance.key.endsWith(
        `initial${elementInstanceMiddleString}_cutoff_hour`,
      ),
    ).value[0];

    // copy inital cutoff date and hour to subsequent start date and hour
    const subsequentStartdate = elementInstances.find((elementInstance) =>
      elementInstance.key.endsWith(
        `subsequent${elementInstanceMiddleString}_start_date`,
      ),
    );
    const subsequentStarthour = elementInstances.find((elementInstance) =>
      elementInstance.key.endsWith(
        `subsequent${elementInstanceMiddleString}_start_hour`,
      ),
    );

    subsequentStartdate.value[0] = initialCutoffDate;

    subsequentStarthour.value[0] = initialCutoffHour;
  }
}
