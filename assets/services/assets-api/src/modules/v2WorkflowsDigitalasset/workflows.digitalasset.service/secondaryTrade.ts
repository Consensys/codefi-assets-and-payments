/**
 * TRADE WORKFLOW
 *
 * -- On-chain trade order workflow --
 *
 * The trade workflow allows an investor(sender) to send tokens:
 *  1) Sender creates a trade order off-chain
 *  2) Issuer approves trade order
 *  3) Recipient accepts trade order
 *  4) Issuer creates token hold on-chain
 *  5) Recipient sends payment through an external payment plarform
 *  6) Sender declares payment as received
 *  7) Issuer settles (+ executes token hold on-chain)
 *
 *  createTradeOrder  ____________  approveTradeOrder   ____________   acceptTradeOrder   ____________  holdTradeOrder  _________________  sendPayment  _________________ receivePayment  __________  settleOrder  ____________
 *         -->       | SUBMITTED  |        -->         |  APPROVED  |        -->         |  ACCEPTED  |      -->       |   OUTSTANDING   |      -->    |      PAYING     |     -->       |   PAID   |      -->    |  EXECUTED  |
 *      [sender]      ------------       [issuer]       ------------     [recipient]      ------------     [issuer]     -----------------  [recipient]  -----------------    [sender]     ----------    [issuer]   ------------
 *
 */
import web3Utils from 'web3-utils';
import { v4 as uuidv4 } from 'uuid';

import {
  TokenIdentifierEnum,
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import {
  DvpUserType,
  EntityEnum,
  keys as UserKeys,
  User,
  UserType,
} from 'src/types/user';
import { UserCreationService } from 'src/modules/v2User/user.service/createUser';
import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  CreateTradeOrderOutput,
  ApproveTradeOrderOutput,
  AcceptTradeOrderOutput,
  RejectTradeOrderOutput,
  SettleAtomicTradeOrderOutput,
  HoldTradeOrderDeliveryBodyOutput,
  HoldTradeOrderPaymentBodyOutput,
  SubmitNegotiationTradeOrderOutput,
  CancelSecondaryTradeOrderOutput,
  ForceCreateAcceptedTradeOrderOutput,
  ForceCreatePaidTradeOrderOutput,
} from '../workflows.digitalasset.dto';

import {
  EMPTY_CERTIFICATE,
  FunctionName,
  TokenCategory,
  SmartContract,
  retrieveTokenCategory,
} from 'src/types/smartContract';
import {
  keys as OrderKeys,
  keys as OfferKeys,
  OrderType,
  DvpType,
  OrderSide,
  WorkflowType,
  INegotiation,
} from 'src/types/workflow/workflowInstances';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';

import { EntityType } from 'src/types/entity';

import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import {
  addDecimalsAndConvertToHex,
  checkIntegerFormat,
  removeDecimalsFromBalances,
} from 'src/utils/number';

import { ApiMetadataCallService } from 'src/modules/v2ApiCall/api.call.service/metadata';
import { TokenState } from 'src/types/states';
import { keys as WalletKeys, Wallet } from 'src/types/wallet';
import {
  keys as EthServiceKeys,
  EthService,
  EthServiceType,
} from 'src/types/ethService';
import {
  keys as ApiSCResponseKeys,
  ApiSCResponse,
} from 'src/types/apiResponse';
import { keys as HookKeys, HookCallBack } from 'src/types/hook';
import { TxStatus } from 'src/types/transaction';
import {
  keys as WorkflowTemplateKeys,
  WorkflowName,
} from 'src/types/workflow/workflowTemplate';
import { Link } from 'src/types/workflow/workflowInstances/link';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { checkTokenBelongsToExpectedCategory } from 'src/utils/checks/tokenSandard';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { PartitionService } from 'src/modules/v2Partition/partition.service';
import { keys as HTLCKeys, HTLC } from 'src/types/htlc';
import { decryptHTLC, newEncryptedHTLC } from 'src/utils/htlc';
import { ApiSCCallService } from 'src/modules/v2ApiCall/api.call.service/sc';
import { DECIMALS } from 'src/types/decimals';
import { HOLD_NOTARY_ADDRESS } from 'src/utils/ethAccounts';
import { TokenHelperService } from 'src/modules/v2Token/token.service';
import {
  keys as HoldKeys,
  Hold,
  HoldStatusCode,
  HoldStatusCodeMapping,
} from 'src/types/hold';
import { keys as ConfigKeys, Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { Project } from 'src/types/project';
import { EntityService } from 'src/modules/v2Entity/entity.service';
import { Offer } from 'src/types/workflow/workflowInstances/offer';
import { OfferService } from 'src/modules/v2Offer/offer.service';
import { NetworkService } from 'src/modules/v2Network/network.service';
import { keys as NetworkKeys, Network } from 'src/types/network';
import { OrderService } from 'src/modules/v2Order/order.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const HOLD_VALIDITY_PERIOD = 7 * 24 * 3600; // Hold will be valid for 1 week
const ONE_DAY_SECURITY_PERIOD = 1 * 24 * 3600; // Default security period is 1 day
const TWO_DAY_SECURITY_PERIOD = 2 * 24 * 3600;

const TYPE_WORKFLOW_NAME = WorkflowName.ASSET_SECONDARY_TRADE;

@Injectable()
export class WorkFlowsSecondaryTradeService {
  constructor(
    @Inject(forwardRef(() => TransactionHelperService))
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly tokenHelperService: TokenHelperService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiSCCallService: ApiSCCallService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly balanceService: BalanceService,
    private readonly partitionService: PartitionService,
    private readonly userCreationService: UserCreationService,
    private readonly configService: ConfigService,
    private readonly entityService: EntityService,
    private readonly offerService: OfferService,
    private readonly networkService: NetworkService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * [Create trade order]
   *
   * This function can only be called by an investor.
   * It starts a new order-workflow (trade).
   * It creates a trade order that first needs to be approved by the issuer, then needs to be accepted by the recipient.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: SUBMITTED
   */
  async createTradeOrder(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    user: User, // `Sender(Seller)-For SELL Order` OR `Buyer(Recipient)-For Buy Order`
    senderId: string, // Mandatory in case of Buy order
    recipientId: string,
    recipientEmail: string,
    tokenId: string,
    assetClassKey: string,
    orderType: OrderType,
    orderQuantity: number,
    orderAmount: number,
    dvpType: DvpType,
    paymentTokenId: string,
    paymentTokenAddess: string,
    paymentTokenStandard: SmartContract,
    paymentTokenAssetClass: string, // only for hybrid
    offerId: number, //optional
    callingFunctionName: FunctionName, //optional
    orderSide: OrderSide,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreateTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.CREATE_SECONDARY_TRADE_ORDER;
      const functionNameForWorkflowStateTransition = callingFunctionName
        ? callingFunctionName
        : functionName;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );
      this.checkOrderTypeIsValid(orderType);
      this.checkOrderQuantityAndPriceAreValid(orderQuantity, orderAmount);
      this.checkOrderSideIsValid(orderSide);
      this.checkDvpTypeIsValid(dvpType);
      this.checkPaymentTokenParameters(
        dvpType,
        paymentTokenAddess,
        paymentTokenStandard,
      );

      let sender: User;
      let recipient: User;
      if (orderSide === OrderSide.SELL) {
        // In the case of a SELL order, user calling the endpoint is the sender of the trade
        sender = user;

        if (recipientId) {
          recipient = await this.apiEntityCallService.fetchEntity(
            tenantId,
            recipientId,
            true,
          );
        } else if (recipientEmail) {
          const recipientsWithSameEmail: Array<User> =
            await this.apiEntityCallService.fetchFilteredEntities(
              tenantId,
              EntityEnum.email,
              recipientEmail,
              true, // includeWallets
            );
          if (!(recipientsWithSameEmail.length > 0)) {
            ErrorService.throwError(
              `no user with email ${recipientEmail} was found`,
            );
          }
          recipient = recipientsWithSameEmail[0];
        }
      } else if (orderSide === OrderSide.BUY) {
        // In the case of a BUY order, user calling the endpoint is the recipient of the trade
        recipient = user;

        if (senderId) {
          sender = await this.apiEntityCallService.fetchEntity(
            tenantId,
            senderId,
            true,
          );
        }
      } else {
        ErrorService.throwError(
          `shall never happen: invalid order side (${orderSide})`,
        );
      }

      this.checkSenderAndRecipientValidity(sender, recipient);

      // Preliminary step: Fetch all required data in databases
      const [
        issuer,
        token,
        paymentToken,
        orderWithSameKey,
        senderTokenLink,
        ,
        config,
      ]: [User, Token, Token, Order, Link, Link, Config] = await Promise.all([
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
        paymentTokenId
          ? this.apiMetadataCallService.retrieveTokenInDB(
              tenantId,
              TokenIdentifierEnum.tokenId,
              paymentTokenId,
              true,
              undefined,
              undefined,
              true,
            )
          : undefined,
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ORDER,
          idempotencyKey,
        ),
        sender
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              sender[UserKeys.USER_ID], // We need the sender's link to extract the wallet from it and check sender's balance
              UserType.INVESTOR,
              tokenId,
              EntityType.TOKEN,
              assetClassKey,
            )
          : undefined,
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          user[UserKeys.USER_ID], // We need to make user, user requesting the order creation is linked to the token
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          assetClassKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Idempotency
      if (orderWithSameKey) {
        // Order was already created (idempotency)
        return {
          order: orderWithSameKey,
          created: false,
          message: `Trade order ${
            orderWithSameKey[OrderKeys.ID]
          } creation was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      let isPaymentHybridToken;
      // on chain payment
      if (paymentToken) {
        // Payment can be off chain, therefore paymentToken is undefined.
        isPaymentHybridToken =
          retrieveTokenCategory(paymentToken?.standard) ===
          TokenCategory.HYBRID;

        // We must require the paymentAssetClass because it is an ERC1400
        if (isPaymentHybridToken && !paymentTokenAssetClass) {
          ErrorService.throwError(
            `paymentAssetClass cannot be undefined for a ${TokenCategory.HYBRID} token.`,
          );
        }
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      let senderWallet: Wallet;
      if (sender && senderTokenLink) {
        senderWallet = this.walletService.extractWalletFromUserEntityLink(
          sender, // sender
          senderTokenLink,
        );

        // Only if order creator is the sender we should check if they have enough quantity
        // Else we do not want to allow the user to ping the balance of a counterparty.
        if (sender[UserKeys.USER_ID] === user[UserKeys.USER_ID]) {
          await this.balanceService.checkTokenOwnership(
            tenantId,
            tokenCategory,
            sender[UserKeys.USER_ID],
            senderWallet,
            token,
            tokenState,
            assetClassKey,
            undefined, // tokenIdentifier
            orderQuantity,
            true,
          );
        }
      }

      if (
        recipient &&
        recipient[UserKeys.USER_ID] === user[UserKeys.USER_ID] &&
        dvpType === DvpType.ATOMIC
      ) {
        const recipientPaymentTokenLink =
          await this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            recipient[UserKeys.USER_ID], // We need the sender's link to extract the wallet from it and check sender's balance
            UserType.INVESTOR,
            paymentTokenId,
            EntityType.TOKEN,
            assetClassKey,
          );

        const recipientWallet =
          this.walletService.extractWalletFromUserEntityLink(
            recipient, // sender
            recipientPaymentTokenLink,
          );

        // If the sender is defined, we need to check he owns the tokens he'll send as part of the trade
        await this.balanceService.checkTokenOwnership(
          tenantId,
          tokenCategory,
          callerId,
          recipientWallet,
          paymentToken,
          tokenState,
          paymentTokenAssetClass,
          undefined, // tokenIdentifier
          orderAmount,
          true,
        );
      }

      // The complicance check will verify sender's KYC status (but not the recipient's one)
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createTradeOrder
        issuer,
        token,
        config,
        sender || recipient, // token sender (here we pass the one that is defined amongst sender and recipient - real complete compliance check will be done in 'acceptTradeOrder' function)
        undefined, // token recipient
        tokenState, // originTokenState
        assetClassKey, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      const bypassSecondaryTradeIssuerApproval =
        token[TokenKeys.DATA][
          TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL
        ];

      const enabledAutomatePayment =
        config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__ENABLE_AUTOMATE_PAYMENT];

      // Get appropriate nextState based on functionName (functionNameForWorkflowStateTransition):
      // - In case this function is called directly by the controller (most common case),
      //   functionName is 'createTradeOrder', resulting in a next state equal to 'submitted'
      // - In case this function is called through 'purchaseOffer' function, functionName
      //   is 'purchaseOffer', resulting in a next state equal to 'accepted'
      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionNameForWorkflowStateTransition, // createTradeOrder OR purchaseOffer
      );

      // Retrieve DVP contract address
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      const dvpAddress: string = await this.apiSCCallService.retrieveDVPAddress(
        callerId,
        ethService,
      );

      const userIsSender =
        user?.[UserKeys.USER_ID] === sender?.[UserKeys.USER_ID];
      const userIsRecipient =
        user?.[UserKeys.USER_ID] === recipient?.[UserKeys.USER_ID];
      const addSenderToOrder =
        userIsSender ||
        (bypassSecondaryTradeIssuerApproval && sender?.[UserKeys.USER_ID]);
      const addRecipientToOrder =
        userIsRecipient ||
        (bypassSecondaryTradeIssuerApproval && recipient?.[UserKeys.USER_ID]);

      // Create workflow instance in Workflow-API
      const tradeWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];
      const tradeOrder: Order =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ORDER,
          functionNameForWorkflowStateTransition, // createTradeOrder Or purchaseOffer Or bindOffer,
          typeFunctionUser,
          addSenderToOrder ? sender[UserKeys.USER_ID] : undefined, // senderId
          token[TokenKeys.TOKEN_ID], // tokenId
          EntityType.TOKEN,
          undefined, // objectId
          addRecipientToOrder ? recipient[UserKeys.USER_ID] : undefined, // recipientId
          undefined, // brokerId
          undefined, // agentId
          tradeWorkflowId,
          orderQuantity, // quantity
          orderAmount, // price
          undefined, // documentId
          senderWallet ? senderWallet[WalletKeys.WALLET_ADDRESS] : undefined,
          assetClassKey, // assetClass
          new Date(),
          nextState, // TradeWorkflow.SUBMITTED or ACCEPTED
          offerId,
          orderSide,
          {
            ...data,
            [OrderKeys.DATA__AUTOMATE_PAYMENT]: enabledAutomatePayment,
            [OrderKeys.DATA__ORDER_TYPE]: orderType,
            [OrderKeys.DATA__DVP]: {
              [OrderKeys.DATA__DVP__TYPE]: dvpType,
              [OrderKeys.DATA__DVP__ADDRESS]: dvpAddress,
              [OrderKeys.DATA__DVP__SENDER]: {
                [OrderKeys.DATA__DVP__SENDER__EMAIL]:
                  sender?.[UserKeys.EMAIL] || undefined,
                [OrderKeys.DATA__DVP__SENDER__ID]:
                  sender?.[UserKeys.USER_ID] || undefined,
              },
              [OrderKeys.DATA__DVP__RECIPIENT]: {
                [OrderKeys.DATA__DVP__RECIPIENT__EMAIL]:
                  recipient?.[UserKeys.EMAIL] || undefined,
                [OrderKeys.DATA__DVP__RECIPIENT__ID]:
                  recipient?.[UserKeys.USER_ID] || undefined,
              },
              [OrderKeys.DATA__DVP__DELIVERY]: {
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]:
                  token[TokenKeys.DEFAULT_DEPLOYMENT],
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD]:
                  token[TokenKeys.STANDARD],
              },
              [OrderKeys.DATA__DVP__PAYMENT]: {
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ID]: paymentTokenId,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]:
                  paymentTokenAddess,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD]:
                  paymentTokenStandard,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS]:
                  isPaymentHybridToken ? paymentTokenAssetClass : undefined, // only for hybrid
              },
            },
          },
        );

      /*
       * In case there is an issuer approval, we don't want the counter party (sender/recipient)
       * to see the order before it gets approved by the issuer, which is why
       * we don't create the link.
       *
       * In case there no issuer approval, we want the recipient to see the order
       * right after order creation, which is why we create the link
       */
      if (bypassSecondaryTradeIssuerApproval) {
        if (orderSide === OrderSide.SELL && recipient) {
          await this.linkDVPUserWithToken(
            tenantId,
            DvpUserType.RECIPIENT,
            tradeOrder,
            token,
          );
        }
        if (orderSide === OrderSide.BUY && sender) {
          await this.linkDVPUserWithToken(
            tenantId,
            DvpUserType.SENDER,
            tradeOrder,
            token,
          );
        }
      }

      if (sendNotification) {
        if (sender) {
          this.apiMailingCallService.notifyIssuerTradeOrderCreated(
            tenantId,
            issuer,
            sender, // sender
            tradeOrder,
            token,
            authToken,
          );
        }
      }

      return {
        order: tradeOrder,
        created: true,
        message: `Trade order ${tradeOrder[OrderKeys.ID]} created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating trade order',
        'createTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Pre Create trade order]
   *
   * This function can only be called by an AGENT.
   * It starts a new order-workflow (trade).
   * It creates a trade order which can then be approved by the seller(investor).
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: PRE_CREATED
   */
  async precreateTradeOrder(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    user: User, // AGENT user
    senderId: string,
    recipientId: string,
    recipientEmail: string,
    tokenId: string,
    assetClassKey: string,
    orderType: OrderType,
    orderQuantity: number,
    orderAmount: number,
    dvpType: DvpType,
    paymentTokenId: string,
    paymentTokenAddess: string,
    paymentTokenStandard: SmartContract,
    paymentTokenAssetClass: string, // only for hybrid
    offerId: number, //optional
    callingFunctionName: FunctionName, //optional
    orderSide: OrderSide,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreateTradeOrderOutput> {
    try {
      const agent = user;
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.PRE_CREATE_SECONDARY_TRADE_ORDER;
      const functionNameForWorkflowStateTransition = callingFunctionName
        ? callingFunctionName
        : functionName;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );
      this.checkOrderTypeIsValid(orderType);
      this.checkOrderQuantityAndPriceAreValid(orderQuantity, orderAmount);
      this.checkOrderSideIsValid(orderSide);
      this.checkDvpTypeIsValid(dvpType);
      this.checkPaymentTokenParameters(
        dvpType,
        paymentTokenAddess,
        paymentTokenStandard,
      );

      let sender: User;
      let recipient: User;

      if (orderSide === OrderSide.SELL) {
        // In the case of a SELL order, user calling the endpoint is the agent

        //Fetch sender entity using sender id or email
        if (senderId) {
          sender = await this.apiEntityCallService.fetchEntity(
            tenantId,
            senderId,
            true,
          );
        } else {
          ErrorService.throwError(`no user with Id ${senderId} was found`);
        }

        //Fetch receipient entity using recipient id or email
        if (recipientId) {
          recipient = await this.apiEntityCallService.fetchEntity(
            tenantId,
            recipientId,
            true,
          );
        } else if (recipientEmail) {
          const recipientsWithSameEmail: Array<User> =
            await this.apiEntityCallService.fetchFilteredEntities(
              tenantId,
              EntityEnum.email,
              recipientEmail,
              true, // includeWallets
            );
          if (!(recipientsWithSameEmail.length > 0)) {
            ErrorService.throwError(
              `no user with email ${recipientEmail} was found`,
            );
          }
          recipient = recipientsWithSameEmail[0];
        }
      } else {
        ErrorService.throwError(
          `shall never happen: invalid order side (${orderSide})`,
        );
      }

      this.checkSenderAndRecipientValidity(sender, recipient);

      // Preliminary step: Fetch all required data in databases
      const [issuer, token, paymentToken, orderWithSameKey, config]: [
        User,
        Token,
        Token,
        Order,
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
        paymentTokenId
          ? this.apiMetadataCallService.retrieveTokenInDB(
              tenantId,
              TokenIdentifierEnum.tokenId,
              paymentTokenId,
              true,
              undefined,
              undefined,
              true,
            )
          : undefined,
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ORDER,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Idempotency
      if (orderWithSameKey) {
        // Order was already created (idempotency)
        return {
          order: orderWithSameKey,
          created: false,
          message: `Trade order ${
            orderWithSameKey[OrderKeys.ID]
          } creation was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      let isPaymentHybridToken;
      // on chain payment
      if (paymentToken) {
        // Payment can be off chain, therefore paymentToken is undefined.
        isPaymentHybridToken =
          retrieveTokenCategory(paymentToken?.standard) ===
          TokenCategory.HYBRID;

        // We must require the paymentAssetClass because it is an ERC1400
        if (isPaymentHybridToken && !paymentTokenAssetClass) {
          ErrorService.throwError(
            `paymentAssetClass cannot be undefined for a ${TokenCategory.HYBRID} token.`,
          );
        }
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // The complicance check will verify sender's KYC status (but not the recipient's one)
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // precreateTradeOrder
        issuer,
        token,
        config,
        sender || recipient, // token sender (here we pass the one that is defined amongst sender and recipient - real complete compliance check will be done in 'acceptTradeOrder' function)
        undefined, // token recipient
        tokenState, // originTokenState
        assetClassKey, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      const bypassSecondaryTradeIssuerApproval =
        token[TokenKeys.DATA][
          TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL
        ];

      const enabledAutomatePayment =
        config?.[ConfigKeys.DATA]?.[ConfigKeys.DATA__ENABLE_AUTOMATE_PAYMENT];

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionNameForWorkflowStateTransition,
      );

      // Retrieve DVP contract address
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      const dvpAddress: string = await this.apiSCCallService.retrieveDVPAddress(
        callerId,
        ethService,
      );

      const userIsSender =
        user?.[UserKeys.USER_ID] === sender?.[UserKeys.USER_ID];
      const userIsRecipient =
        user?.[UserKeys.USER_ID] === recipient?.[UserKeys.USER_ID];
      const addSenderToOrder =
        userIsSender ||
        (bypassSecondaryTradeIssuerApproval && sender?.[UserKeys.USER_ID]);
      const addRecipientToOrder =
        userIsRecipient ||
        (bypassSecondaryTradeIssuerApproval && recipient?.[UserKeys.USER_ID]);

      // Create workflow instance in Workflow-API
      const tradeWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];
      const tradeOrder: Order =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ORDER,
          functionNameForWorkflowStateTransition, // createTradeOrder Or purchaseOffer Or bindOffer,
          typeFunctionUser,
          addSenderToOrder ? sender[UserKeys.USER_ID] : undefined, // senderId
          token[TokenKeys.TOKEN_ID], // tokenId
          EntityType.TOKEN,
          undefined, // objectId
          addRecipientToOrder ? recipient[UserKeys.USER_ID] : undefined, // recipientId
          undefined, //  brokerId
          agent[UserKeys.USER_ID], // agentId
          tradeWorkflowId,
          orderQuantity, // quantity
          orderAmount, // price
          undefined, // documentId
          undefined,
          assetClassKey, // assetClass
          new Date(),
          nextState, // TradeWorkflow.SUBMITTED or ACCEPTED
          offerId,
          orderSide,
          {
            ...data,
            [OrderKeys.DATA__AUTOMATE_PAYMENT]: enabledAutomatePayment,
            [OrderKeys.DATA__ORDER_TYPE]: orderType,
            [OrderKeys.DATA__DVP]: {
              [OrderKeys.DATA__DVP__TYPE]: dvpType,
              [OrderKeys.DATA__DVP__ADDRESS]: dvpAddress,
              [OrderKeys.DATA__DVP__SENDER]: {
                [OrderKeys.DATA__DVP__SENDER__EMAIL]:
                  sender?.[UserKeys.EMAIL] || undefined,
                [OrderKeys.DATA__DVP__SENDER__ID]:
                  sender?.[UserKeys.USER_ID] || undefined,
              },
              [OrderKeys.DATA__DVP__RECIPIENT]: {
                [OrderKeys.DATA__DVP__RECIPIENT__EMAIL]:
                  recipient?.[UserKeys.EMAIL] || undefined,
                [OrderKeys.DATA__DVP__RECIPIENT__ID]:
                  recipient?.[UserKeys.USER_ID] || undefined,
              },
              [OrderKeys.DATA__DVP__DELIVERY]: {
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]:
                  token[TokenKeys.DEFAULT_DEPLOYMENT],
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD]:
                  token[TokenKeys.STANDARD],
              },
              [OrderKeys.DATA__DVP__PAYMENT]: {
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ID]: paymentTokenId,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]:
                  paymentTokenAddess,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD]:
                  paymentTokenStandard,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS]:
                  isPaymentHybridToken ? paymentTokenAssetClass : undefined, // only for hybrid
              },
            },
          },
        );

      if (sendNotification) {
        if (sender) {
          this.apiMailingCallService.notifySellerTradeOrderPrecreated(
            tenantId,
            agent,
            sender, // sender
            token,
            tradeOrder,
            authToken,
          );
        }

        if (agent) {
          this.apiMailingCallService.notifyAgentTradeOrderPrecreated(
            tenantId,
            agent,
            sender,
            token,
            tradeOrder,
            authToken,
          );
        }

        let senderTokenLink: Link;
        try {
          senderTokenLink = await this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            sender[UserKeys.USER_ID], // We need the sender's link to extract the wallet from it and check sender's balance
            UserType.INVESTOR,
            tokenId,
            EntityType.TOKEN,
            assetClassKey,
          );
        } catch (error) {
          //If the seller doesnt have sufficient inventory, notify agent about insufficient inventory
          this.apiMailingCallService.notifyAgentSellerNotLinkedToToken(
            tenantId,
            agent,
            sender, // sender
            tradeOrder,
            token,
            authToken,
          );
        }

        let senderWallet: Wallet;
        if (sender && senderTokenLink) {
          senderWallet = this.walletService.extractWalletFromUserEntityLink(
            sender, // sender
            senderTokenLink,
          );
        }

        if (senderWallet) {
          try {
            await this.balanceService.checkTokenOwnership(
              tenantId,
              tokenCategory,
              sender[UserKeys.USER_ID],
              senderWallet,
              token,
              tokenState,
              assetClassKey,
              undefined, // tokenIdentifier
              orderQuantity,
              true,
            );
          } catch (error) {
            this.apiMailingCallService.notifyAgentInsufficientInventory(
              tenantId,
              agent,
              sender, // sender
              tradeOrder,
              token,
              authToken,
            );
          }
        }
      }

      return {
        order: tradeOrder,
        created: true,
        message: `Trade order ${tradeOrder[OrderKeys.ID]} created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'pre creating trade order',
        'precreateTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Approve Pre Created Trade order]
   *
   * This function can only be called by a seller.
   * It can only be called for an order-workflow (trade) in state PRE_CREATED.
   * It allows the seller to approve a trade, which has been submitted by an agent.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: PRE_CREATED
   *  - Destination state: APPROVED
   */
  async approvePrecreatedTradeOrder(
    tenantId: string,
    callerId: string,
    user: User,
    orderId: string,
    data: any,
    sendNotification: boolean,
    sendInviteNotification: boolean,
    authToken: string,
  ): Promise<ApproveTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.APPROVE_PRE_CREATED_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const agentId = tradeOrder.agentId;
      let agent: User;
      if (agentId) {
        agent = await this.apiEntityCallService.fetchEntity(
          tenantId,
          agentId,
          true,
        );
      }

      const senderId = this.extractUserIdFromOrder(
        DvpUserType.SENDER,
        tradeOrder,
      );
      const recipientId = this.extractUserIdFromOrder(
        DvpUserType.RECIPIENT,
        tradeOrder,
      );
      const orderSide: OrderSide = tradeOrder[OrderKeys.ORDER_SIDE];
      const [issuer, sender, recipient, token, senderTokenLink, , config]: [
        User,
        User,
        User,
        Token,
        Link,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        senderId
          ? this.apiEntityCallService.fetchEntity(tenantId, senderId, true)
          : undefined,
        recipientId
          ? this.apiEntityCallService.fetchEntity(tenantId, recipientId, true)
          : undefined,
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        senderId
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              senderId, // We need the sender's link to extract the wallet from it and check sender's balance
              UserType.INVESTOR,
              tradeOrder[OrderKeys.ENTITY_ID],
              EntityType.TOKEN,
              tradeOrder[OrderKeys.ASSET_CLASS],
            )
          : undefined,
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          orderSide === OrderSide.SELL ? senderId : recipientId, // We need to make user, user requesting the order creation is linked to the token
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      /*
       * After seller approval, the counter party (recipient) shall be able
       * to see the order, which is why we create the link.
       */
      if (orderSide === OrderSide.SELL && recipient) {
        await this.linkDVPUserWithToken(
          tenantId,
          DvpUserType.RECIPIENT,
          tradeOrder,
          token,
        );
      }
      if (orderSide === OrderSide.BUY && sender) {
        await this.linkDVPUserWithToken(
          tenantId,
          DvpUserType.SENDER,
          tradeOrder,
          token,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      let senderWallet: Wallet;
      if (sender && senderTokenLink) {
        senderWallet = this.walletService.extractWalletFromUserEntityLink(
          sender,
          senderTokenLink,
        );

        await this.balanceService.checkTokenOwnership(
          tenantId,
          tokenCategory,
          callerId,
          senderWallet,
          token,
          tokenState,
          tradeOrder[OrderKeys.ASSET_CLASS],
          undefined, // tokenIdentifier
          tradeOrder[OrderKeys.QUANTITY],
          true,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // approveTradeOrder
        issuer,
        token,
        config,
        sender || recipient, // token sender (here we pass the one that is defined amongst sender and recipient - real complete compliance check will be done in 'acceptTradeOrder' function)
        undefined, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );
      // Idempotency
      const targetState = 'approved';

      if (tradeOrder[OrderKeys.STATE] === targetState) {
        // Order has been approved, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: `Trade order with id ${orderId} has already been approved`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // approveTradeOrder
      );

      const addSenderToOrder = sender && !tradeOrder[OrderKeys.USER_ID];
      const addRecipientToOrder =
        recipient && !tradeOrder[OrderKeys.RECIPIENT_ID];

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.USER_ID]: addSenderToOrder
          ? sender?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.RECIPIENT_ID]: addRecipientToOrder
          ? recipient?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          ...data,
        },
      };

      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      if (sendNotification) {
        if (sender) {
          this.apiMailingCallService.notifySellerPrecreatedTradeOrderApproved(
            tenantId,
            issuer,
            sender,
            tradeOrder,
            token,
            authToken,
          );
        }

        if (agent) {
          this.apiMailingCallService.notifyAgentTradeOrderApproved(
            tenantId,
            agent,
            sender,
            tradeOrder,
            token,
            authToken,
          );
        }

        if (recipient) {
          this.apiMailingCallService.notifyBuyerPrecreatedOrderApproved(
            tenantId,
            agent,
            sender,
            recipient,
            tradeOrder,
            token,
            authToken,
          );
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order with id ${orderId} approved successfully by issuer`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'approving trade order',
        'approveTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Approve trade order]
   *
   * This function can only be called by an issuer.
   * It can only be called for an order-workflow (trade) in state SUBMITTED.
   * It allows the issuer to approve a trade, which has been submitted by an investor.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBMITTED
   *  - Destination state: APPROVED
   */
  async approveTradeOrder(
    tenantId: string,
    callerId: string,
    user: User,
    orderId: string,
    data: any,
    sendNotification: boolean,
    sendInviteNotification: boolean,
    authToken: string,
  ): Promise<ApproveTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.APPROVE_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const senderId = this.extractUserIdFromOrder(
        DvpUserType.SENDER,
        tradeOrder,
      );
      const recipientId = this.extractUserIdFromOrder(
        DvpUserType.RECIPIENT,
        tradeOrder,
      );
      const orderSide: OrderSide = tradeOrder[OrderKeys.ORDER_SIDE];
      const [issuer, sender, recipient, token, senderTokenLink, , config]: [
        User,
        User,
        User,
        Token,
        Link,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        senderId
          ? this.apiEntityCallService.fetchEntity(tenantId, senderId, true)
          : undefined,
        recipientId
          ? this.apiEntityCallService.fetchEntity(tenantId, recipientId, true)
          : undefined,
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        senderId
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              senderId, // We need the sender's link to extract the wallet from it and check sender's balance
              UserType.INVESTOR,
              tradeOrder[OrderKeys.ENTITY_ID],
              EntityType.TOKEN,
              tradeOrder[OrderKeys.ASSET_CLASS],
            )
          : undefined,
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          orderSide === OrderSide.SELL ? senderId : recipientId, // We need to make user, user requesting the order creation is linked to the token
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      /*
       * After issuer approval, the counter party (sender/recipient) shall be able
       * to see the order, which is why we create the link.
       */
      if (orderSide === OrderSide.SELL && recipient) {
        await this.linkDVPUserWithToken(
          tenantId,
          DvpUserType.RECIPIENT,
          tradeOrder,
          token,
        );
      }
      if (orderSide === OrderSide.BUY && sender) {
        await this.linkDVPUserWithToken(
          tenantId,
          DvpUserType.SENDER,
          tradeOrder,
          token,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${
            user[UserKeys.USER_ID]
          }) is not the issuer of the token (${issuer[UserKeys.USER_ID]})`,
        );
      }

      let senderWallet: Wallet;
      if (sender && senderTokenLink) {
        senderWallet = this.walletService.extractWalletFromUserEntityLink(
          sender,
          senderTokenLink,
        );

        await this.balanceService.checkTokenOwnership(
          tenantId,
          tokenCategory,
          callerId,
          senderWallet,
          token,
          tokenState,
          tradeOrder[OrderKeys.ASSET_CLASS],
          undefined, // tokenIdentifier
          tradeOrder[OrderKeys.QUANTITY],
          true,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // approveTradeOrder
        issuer,
        token,
        config,
        sender || recipient, // token sender (here we pass the one that is defined amongst sender and recipient - real complete compliance check will be done in 'acceptTradeOrder' function)
        undefined, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );
      // Idempotency
      const targetState = 'approved';

      if (tradeOrder[OrderKeys.STATE] === targetState) {
        // Order has been approved, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: `Trade order with id ${orderId} has already been approved`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // approveTradeOrder
      );

      const addSenderToOrder = sender && !tradeOrder[OrderKeys.USER_ID];
      const addRecipientToOrder =
        recipient && !tradeOrder[OrderKeys.RECIPIENT_ID];

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.USER_ID]: addSenderToOrder
          ? sender?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.RECIPIENT_ID]: addRecipientToOrder
          ? recipient?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          ...data,
        },
      };

      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      if (sendNotification) {
        if (sender) {
          this.apiMailingCallService.notifySenderTradeOrderApproved(
            tenantId,
            issuer,
            sender,
            tradeOrder,
            token,
            authToken,
          );
        }

        if (recipient) {
          if (sendInviteNotification) {
            this.apiMailingCallService.notifyNoneOnboardedRecipientTradeOrderCreated(
              tenantId,
              sender,
              recipient,
              tradeOrder,
              token,
              authToken,
            );
          } else {
            this.apiMailingCallService.notifyOnboardedRecipientTradeOrderCreated(
              tenantId,
              sender,
              recipient,
              tradeOrder,
              token,
              authToken,
            );
          }
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order with id ${orderId} approved successfully by issuer`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'approving trade order',
        'approveTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [submit negotiation trade order]
   *
   * This function can only be called by the seller/buyer of the trade.
   * It can only be called for an order-workflow (trade) in state NEGOTIATING.
   * It allows to add/append a negotiation to the trade order and/or update negotiationHoldGranted flag (used to reduce/readd credits in the offer)
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NEGOTIATING
   *  - Destination state: NEGOTIATING
   */
  async submitTradeOrderNegotiation(
    tenantId: string,
    user: User,
    orderId: string,
    price: number,
    expirationDate: Date,
    sendNotification: boolean,
    authToken: string,
  ): Promise<SubmitNegotiationTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.SUBMIT_TRADE_ORDER_NEGOTIATION;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases
      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const [
        issuer,
        sender,
        recipient,
        token, // senderTokenLink // recipientTokenLink
        ,
        ,
        config,
      ]: [User, User, User, Token, Link, Link, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Fetch the related offer in database (if any)
      let offer: Offer;
      if (tradeOrder[OrderKeys.OFFER_ID]) {
        offer = await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          tradeOrder[OrderKeys.OFFER_ID],
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
          undefined, // otherWorkflowType
          true,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      if (!tradeOrder[OrderKeys.OFFER_ID]) {
        ErrorService.throwError(
          `Trade order(${orderId}) is missing an offer Id`,
        );
      }

      if (!tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        ErrorService.throwError(
          `Trade order(${orderId}) has the flag(${OrderKeys.DATA__ENABLE_NEGOTIATION}) set as false`,
        );
      }

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // submitTradeOrderNegotiation
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // submitTradeOrderNegotiation
      );

      let tempUpdatedTradeOrder = tradeOrder;

      // If price is given, update the negotiation array
      if (price) {
        const updatedNegotiations = [
          ...tradeOrder[OrderKeys.DATA][OrderKeys.DATA__NEGOTIATIONS],
        ];

        const latestNegotiation = updatedNegotiations?.[0];
        if (
          !latestNegotiation ||
          (latestNegotiation?.expiredAt &&
            new Date(latestNegotiation.expiredAt) <= new Date()) ||
          latestNegotiation?.pricePerUnit !== price
        ) {
          // potential new negotiation on the order
          const newNegotiaion: INegotiation = {
            pricePerUnit: price,
            createdAt: new Date(),
            expiredAt: expirationDate ? new Date(expirationDate) : undefined,
            proposedBy: user[UserKeys.USER_ID],
            acceptedBy: [user[UserKeys.USER_ID]],
            rejectedBy: [],
          };
          updatedNegotiations.unshift(newNegotiaion); // Add new negotiation to the top of the array
        } else {
          // latest negotiation exists && (expiration date not exits or not expired) && new price is same
          if (!latestNegotiation?.acceptedBy.includes(user[UserKeys.USER_ID])) {
            latestNegotiation.acceptedBy.push(user[UserKeys.USER_ID]);
          }
          if (!latestNegotiation?.expiredAt) {
            latestNegotiation.expiredAt = expirationDate
              ? new Date(expirationDate)
              : undefined;
          }
        }

        // Update trade order in Workflow-API
        tempUpdatedTradeOrder = {
          ...tradeOrder,
          [OrderKeys.DATA]: {
            ...tradeOrder[OrderKeys.DATA],
            [OrderKeys.DATA__NEGOTIATIONS]: updatedNegotiations,
          },
        };
      }

      // If the negotiation hold is requested, update the offer quantity
      let willSendHoldGrantedEmail = false;
      if (
        tradeOrder[OrderKeys.DATA]?.[
          OrderKeys.DATA__NEGOTIATION_HOLD_REQUESTED
        ] &&
        !tradeOrder[OrderKeys.DATA]?.[
          OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED
        ] &&
        tradeOrder[OrderKeys.USER_ID] === user[UserKeys.USER_ID]
      ) {
        // Only sender can perform the negotiation token hold
        // and only sent email once when the state of DATA__NEGOTIATION_HOLD_GRANTED
        // goes from false to true.
        willSendHoldGrantedEmail = true;

        // Check if the available offer quantity can fulfill the hold request quantity
        const offerAvailableQuantity =
          this.offerService.getOfferAvailableQuantity(offer);

        if (tradeOrder[OrderKeys.QUANTITY] > offerAvailableQuantity) {
          ErrorService.throwError(
            `invalid negotiation hold request on trade order quantity: hold request quantity(${
              tradeOrder[OrderKeys.QUANTITY]
            }) exceeds available offer quantity(${offer[OfferKeys.QUANTITY]})`,
          );
        }

        // Update trade order in Workflow-API to set negotiationHoldGranted to 'true'
        tempUpdatedTradeOrder = {
          ...tempUpdatedTradeOrder,
          [OrderKeys.DATA]: {
            ...tempUpdatedTradeOrder[OrderKeys.DATA],
            [OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED]: true,
          },
        };

        // Update the offer quantity distibution for held credits
        this.offerService.updateOfferQuantityDistribution(
          offer,
          0, //purchasedQuantity
          tradeOrder[OrderKeys.QUANTITY],
          true, //initiateHold
        );

        // Update Offer workflow instance in Workflow-API with updated quantity
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          offer[OfferKeys.ID], // workflow instance ID,
          undefined, // functionName,
          undefined, // typeFunctionUser,
          undefined, // nextState = undefined (no change of state)
          offer,
        );
      }

      const updatedTradeOrder =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          tempUpdatedTradeOrder,
        );

      if (sendNotification) {
        if (willSendHoldGrantedEmail) {
          this.apiMailingCallService.notifyRecipientNegotiationHoldGranted(
            tenantId,
            sender,
            recipient,
            updatedTradeOrder,
            token,
            updatedTradeOrder[OrderKeys.ASSET_CLASS],
            authToken,
          );
        }
        // Sends an email whenever there is a price
        if (price) {
          if (tradeOrder[OrderKeys.USER_ID] === user[UserKeys.USER_ID]) {
            // send email notification to recipient
            this.apiMailingCallService.notifyRecipientNegotiationUpdated(
              tenantId,
              sender,
              recipient,
              updatedTradeOrder,
              token,
              updatedTradeOrder[OrderKeys.ASSET_CLASS],
              authToken,
            );
          } else if (
            tradeOrder[OrderKeys.RECIPIENT_ID] === user[UserKeys.USER_ID]
          ) {
            // send email notification to recipient
            this.apiMailingCallService.notifyRecipientNegotiationUpdated(
              tenantId,
              recipient,
              sender,
              updatedTradeOrder,
              token,
              updatedTradeOrder[OrderKeys.ASSET_CLASS],
              authToken,
            );
          }
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order ${
          updatedTradeOrder[OrderKeys.ID]
        } submitted negotiation successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting trade order negotiation',
        'submitTradeOrderNegotiation',
        false,
        500,
      );
    }
  }

  /**
   * [Accept trade order]
   *
   * This function can only be called by the recipient of the trade.
   * It can only be called for an order-workflow (trade) in state APPROVED.
   * It allows the trade recipient to accept a trade, which has been submitted by an investor, and approved by an issuer.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: APPROVED
   *  - Destination state: ACCEPTED
   */
  async acceptTradeOrder(
    tenantId: string,
    user: User,
    orderId: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<AcceptTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.ACCEPT_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const agentId = tradeOrder.agentId;
      let agent: User;
      if (agentId) {
        agent = await this.apiEntityCallService.fetchEntity(
          tenantId,
          agentId,
          true,
        );
      }

      const isOnChainPayment: boolean = this.checkIfOnChainPayment(tradeOrder);

      const addUserAsSender =
        tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.BUY &&
        !tradeOrder[OrderKeys.USER_ID];
      const addUserAsRecipient =
        tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.SELL &&
        !tradeOrder[OrderKeys.RECIPIENT_ID];

      const [issuer, sender, recipient, token, senderTokenLink, , config]: [
        User,
        User,
        User,
        Token,
        Link,
        Link,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        addUserAsSender
          ? user
          : this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.USER_ID],
              true,
            ),
        addUserAsRecipient
          ? user
          : this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.RECIPIENT_ID],
              true,
            ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          addUserAsSender
            ? user[UserKeys.USER_ID]
            : tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          addUserAsRecipient
            ? user[UserKeys.USER_ID]
            : tradeOrder[OrderKeys.RECIPIENT_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      this.checkSenderAndRecipientValidity(sender, recipient);

      // Fetch sender and recipient brokers for later use in email notification
      const [senderBrokerId, recipientBrokerId]: [string, string] =
        await Promise.all([
          this.linkService.retrieveBrokerIdIfExisting(
            tenantId,
            sender[UserKeys.USER_ID],
            issuer[UserKeys.USER_ID],
          ),
          this.linkService.retrieveBrokerIdIfExisting(
            tenantId,
            recipient[UserKeys.USER_ID],
            issuer[UserKeys.USER_ID],
          ),
        ]);

      const [senderBroker, recipientBroker] = await Promise.all([
        senderBrokerId
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              senderBrokerId,
              true,
            )
          : undefined,
        recipientBrokerId
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              recipientBrokerId,
              true,
            )
          : undefined,
      ]);

      // Fetch the related offer in database (if any) and prepare offer update with
      // new remaining offer quantity
      let offer: Offer;
      if (tradeOrder[OrderKeys.OFFER_ID]) {
        offer = await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          tradeOrder[OrderKeys.OFFER_ID],
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
          undefined, // otherWorkflowType
          true,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      /*
       * Balance check
       *  - Sometimes, this check has already been done before and is just a double check
       *  - When the order is a BUY order, and 'addUserAsSender' is set to 'true', this check
       *    is essential because it has not been done before
       */
      const senderWallet = this.walletService.extractWalletFromUserEntityLink(
        sender,
        senderTokenLink,
      );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        sender[UserKeys.USER_ID],
        senderWallet,
        token,
        tokenState,
        tradeOrder[OrderKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        tradeOrder[OrderKeys.QUANTITY],
        true,
      );

      // Checking recipient balance
      if (
        isOnChainPayment &&
        tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
          OrderKeys.DATA__DVP__TYPE
        ] === DvpType.ATOMIC &&
        tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP]?.[
          OrderKeys.DATA__DVP__PAYMENT
        ]?.[OrderKeys.DATA__DVP__PAYMENT__TOKEN_ID]
      ) {
        const paymentTokenId =
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_ID];

        //retrieve the payment token
        const paymentToken: Token =
          await this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            paymentTokenId,
            true,
            undefined,
            undefined,
            true,
          );

        const recipientTokenLink: Link =
          await this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            recipient[UserKeys.USER_ID],
            UserType.INVESTOR,
            paymentToken[TokenKeys.TOKEN_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
              OrderKeys.DATA__DVP__PAYMENT
            ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS],
          );

        const recipientWallet: Wallet =
          this.walletService.extractWalletFromUserEntityLink(
            recipient,
            recipientTokenLink,
          );

        const paymentTokenCategory: TokenCategory = retrieveTokenCategory(
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD],
        );

        if (paymentTokenCategory === TokenCategory.HYBRID) {
          await this.balanceService.checkTokenOwnership(
            tenantId,
            paymentTokenCategory,
            recipient[UserKeys.USER_ID],
            recipientWallet,
            paymentToken,
            tokenState,
            tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
              OrderKeys.DATA__DVP__PAYMENT
            ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS],
            undefined, // tokenIdentifier
            tradeOrder[OrderKeys.PRICE],
            true,
          );
        } else {
          await this.balanceService.checkTokenOwnership(
            tenantId,
            paymentTokenCategory,
            recipient[UserKeys.USER_ID],
            recipientWallet,
            paymentToken,
            undefined,
            undefined,
            undefined, // tokenIdentifier
            tradeOrder[OrderKeys.PRICE],
            true,
          );
        }
      }

      // Issuer approval can only be bypassed if token.data includes
      // the correct flag (DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL)
      let byPassIssuerApprovalFlag;
      if (
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][
          TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL
        ]
      ) {
        byPassIssuerApprovalFlag =
          token[TokenKeys.DATA][
            TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL
          ];
      }
      if (
        tradeOrder[OrderKeys.STATE] === 'submitted' &&
        !byPassIssuerApprovalFlag
      ) {
        ErrorService.throwError(
          `Order can not be accepted without issuer approval (no ${TokenKeys.DATA__BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL} flage was found in token's data)`,
        );
      }

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (!tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.SELL) {
          if (user[UserKeys.USER_ID] !== recipient[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided recipientId (${
                user[UserKeys.USER_ID]
              }) is not the recipîent of the trade (${
                recipient[UserKeys.USER_ID]
              })`,
            );
          }
        } else if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.BUY) {
          if (user[UserKeys.USER_ID] !== sender[UserKeys.USER_ID]) {
            ErrorService.throwError(
              `provided senderId (${
                user[UserKeys.USER_ID]
              }) is not the sender of the trade (${sender[UserKeys.USER_ID]})`,
            );
          }
        } else {
          ErrorService.throwError(
            `Invalid orderSide(${
              tradeOrder[OrderKeys.ORDER_SIDE]
            }): shall be chosen amongst ${OrderSide.SELL} and ${OrderSide.BUY}`,
          );
        }
      } else {
        // check for negotiation-enabled order
        if (
          user[UserKeys.USER_ID] !== sender[UserKeys.USER_ID] &&
          user[UserKeys.USER_ID] !== recipient[UserKeys.USER_ID]
        ) {
          ErrorService.throwError(
            `provided userId (${user[UserKeys.USER_ID]}) is not the sender (${
              sender[UserKeys.USER_ID]
            }) or recipient (${
              recipient[UserKeys.USER_ID]
            }) of the negotiation-enabled trade`,
          );
        }

        const latestNegotiation: INegotiation =
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0];

        if (
          user[UserKeys.USER_ID] === sender[UserKeys.USER_ID] &&
          !latestNegotiation?.acceptedBy?.includes(recipient[UserKeys.USER_ID])
        ) {
          ErrorService.throwError(
            `Negotiation-enabled order can not be accepted by sender without latest negotiation accepted by recipient (${
              recipient[UserKeys.USER_ID]
            })`,
          );
        }

        if (
          user[UserKeys.USER_ID] === recipient[UserKeys.USER_ID] &&
          !latestNegotiation?.acceptedBy?.includes(sender[UserKeys.USER_ID])
        ) {
          ErrorService.throwError(
            `Negotiation-enabled order can not be accepted by recipient without latest negotiation accepted by sender (${
              sender[UserKeys.USER_ID]
            })`,
          );
        }

        if (
          latestNegotiation?.expiredAt &&
          new Date(latestNegotiation.expiredAt) <= new Date()
        ) {
          ErrorService.throwError(
            `Negotiation-enabled order can not be accepted as it's expired (${latestNegotiation.expiredAt})`,
          );
        }
      }

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // acceptTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'accepted') {
        // Order has already been accepted, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Trade order acceptance was already done',
        };
      }

      if (offer) {
        // assuming an order with offer in this function is either Bid or Negotitation Enquiry
        let heldQuantity = 0;

        if (
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION] &&
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED]
        ) {
          heldQuantity = tradeOrder[OrderKeys.QUANTITY];
        }

        // add back the held quantity towards the available quantity if hold was granted
        const offerAvailableQuantity =
          this.offerService.getOfferAvailableQuantity(offer) + heldQuantity;

        if (tradeOrder[OrderKeys.QUANTITY] > offerAvailableQuantity) {
          ErrorService.throwError(
            `invalid accept on trade order quantity: accept trade order quantity(${
              tradeOrder[OrderKeys.QUANTITY]
            }) exceeds available offer quantity (${offer[OfferKeys.QUANTITY]})`,
          );
        }

        // Update the offer quantity distibution for purchased and held quantities
        this.offerService.updateOfferQuantityDistribution(
          offer,
          tradeOrder[OrderKeys.QUANTITY],
          heldQuantity,
          false, //initiateHold
        );

        const offerOutstandingQuantity =
          this.offerService.getOfferOutstandingQuantity(offer);

        let nextOfferState;
        if (offerOutstandingQuantity <= 0) {
          nextOfferState = await WorkflowMiddleWare.checkStateTransition(
            tenantId,
            WorkflowName.OFFER,
            offer[OfferKeys.ID], // workflow instance ID
            typeFunctionUser,
            functionName, // acceptTradeOrder
          );
        }

        await this.workflowService.updateWorkflowInstance(
          tenantId,
          offer[OfferKeys.ID], // workflow instance ID,
          offerOutstandingQuantity <= 0 ? functionName : undefined, // functionName,
          offerOutstandingQuantity <= 0 ? typeFunctionUser : undefined, // typeFunctionUser,
          offerOutstandingQuantity <= 0 ? nextOfferState : undefined, // nextOfferState = PURCHASED (if outstanding quantity is zero, otherwise it should remain SUBMITTED)
          offer,
        );
      }

      if (tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        const latestNegotiation: INegotiation =
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0];

        if (!latestNegotiation?.acceptedBy?.includes(user[UserKeys.USER_ID])) {
          latestNegotiation.acceptedBy.push(user[UserKeys.USER_ID]);
        }

        tradeOrder[OrderKeys.PRICE] =
          latestNegotiation.pricePerUnit * tradeOrder[OrderKeys.QUANTITY];
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // acceptTradeOrder
      );

      // Update trade order in Workflow-API after all check is done
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.USER_ID]: addUserAsSender
          ? sender?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.RECIPIENT_ID]: addUserAsRecipient
          ? recipient?.[UserKeys.USER_ID]
          : undefined,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          ...data,
        },
      };

      let updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      // As Order is accepted, hold the tokens, if autoHold is enabled for the token
      if (token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_HOLD_CREATION]) {
        const holdTokenOutput = await this.holdTradeOrderDelivery(
          tenantId,
          user[UserKeys.USER_ID], //callerID
          senderBroker ?? issuer,
          String(updatedTradeOrder[OrderKeys.ID]),
          undefined, //timeToExpiration, defaults to 1 week
          undefined, //data
          sendNotification,
          authToken,
        );
        // send updated order in response
        updatedTradeOrder = holdTokenOutput.order;
      }

      if (sendNotification) {
        //send email notification to agent if existing
        if (agent) {
          this.apiMailingCallService.notifyAgentTradeOrderAccepted(
            tenantId,
            agent,
            recipient,
            tradeOrder,
            token,
            authToken,
          );
        }

        if (user[UserKeys.USER_ID] === recipient[UserKeys.USER_ID]) {
          // send email notification to sender, for now, this should only happen
          // if the order is negotiation-enabled
          this.apiMailingCallService.notifySenderTradeOrderAccepted(
            tenantId,
            sender,
            recipient,
            updatedTradeOrder,
            token,
            updatedTradeOrder[OrderKeys.ASSET_CLASS],
            authToken,
          );

          // send email notification to broker of sender (if existing)
          if (senderBroker) {
            this.apiMailingCallService.notifySenderTradeOrderAccepted(
              tenantId,
              senderBroker,
              recipient,
              updatedTradeOrder,
              token,
              updatedTradeOrder[OrderKeys.ASSET_CLASS],
              authToken,
            );
          }
        } else {
          // send email notification to recipient
          this.apiMailingCallService.notifyRecipientTradeOrderAccepted(
            tenantId,
            recipient,
            sender,
            tradeOrder,
            token,
            tradeOrder[OrderKeys.ASSET_CLASS],
            authToken,
          );

          // send email notification to broker of recipient (if existing)
          if (recipientBroker) {
            this.apiMailingCallService.notifyRecipientTradeOrderAccepted(
              tenantId,
              recipientBroker,
              sender,
              tradeOrder,
              token,
              tradeOrder[OrderKeys.ASSET_CLASS],
              authToken,
            );
          }
        }

        // send email notification to brokerOfSender, if brokerOfSender exists and autoHold is false
        if (
          !token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_HOLD_CREATION] &&
          senderBroker
        ) {
          this.apiMailingCallService.notifyIssuerTradeOrderAccepted(
            tenantId,
            senderBroker,
            sender,
            recipient,
            tradeOrder,
            token,
            authToken,
          );
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order ${
          updatedTradeOrder[OrderKeys.ID]
        } accepted successfully by recipient`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'accepting trade order',
        'acceptTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Force the creation of an "accepted trade order"]
   *
   * This function can only be called by the issuer.
   * It starts a new order-workflow (trade).
   * It allows the issuer to create a trade order that is already accepted by all parties.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: ACCEPTED
   */
  async forceCreateAcceptedTradeOrder(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    user: User, // issuer
    senderId: string,
    recipientId: string,
    tokenId: string,
    assetClassKey: string,
    orderType: OrderType,
    orderQuantity: number,
    orderAmount: number,
    dvpType: DvpType,
    paymentTokenAddess: string,
    paymentTokenStandard: SmartContract,
    orderSide: OrderSide,
    data: any,
    sendNotification: boolean,
    paymentAccountAddress?: string,
  ): Promise<ForceCreateAcceptedTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.FORCE_CREATE_ACCEPTED_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );
      this.checkOrderTypeIsValid(orderType);
      this.checkOrderQuantityAndPriceAreValid(orderQuantity, orderAmount);
      this.checkOrderSideIsValid(orderSide);
      this.checkDvpTypeIsValid(dvpType);
      this.checkPaymentTokenParameters(
        dvpType,
        paymentTokenAddess,
        paymentTokenStandard,
      );
      this.checkOrderQuantityAndPriceAreValid(orderQuantity, orderAmount);

      // Preliminary step: Fetch all required data in databases
      const [
        issuer,
        token,
        sender,
        recipient,
        senderTokenLink,
        orderWithSameKey,
        config,
      ]: [User, Token, User, User, Link, Order, Config] = await Promise.all([
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
        this.apiEntityCallService.fetchEntity(tenantId, senderId, true),
        this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
        this.linkService.retrieveStrictUserEntityLink(
          // We check the sender is correctly linked to the token
          tenantId,
          senderId,
          UserType.INVESTOR,
          tokenId,
          EntityType.TOKEN,
          assetClassKey,
        ),
        this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
          tenantId,
          WorkflowType.ORDER,
          idempotencyKey,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Idempotency
      if (orderWithSameKey) {
        // Order was already created (idempotency)
        return {
          order: orderWithSameKey,
          created: false,
          message: `Trade order ${
            orderWithSameKey[OrderKeys.ID]
          } creation was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      this.checkSenderAndRecipientValidity(sender, recipient);

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        assetClassKey, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceCreateAcceptedTradeOrder
      );

      const senderWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          sender, // sender
          senderTokenLink,
        );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        senderWallet,
        token,
        tokenState,
        assetClassKey,
        undefined, // tokenIdentifier
        orderQuantity,
        true,
      );

      // Retrieve DVP contract address
      const ethService: EthService =
        await this.ethHelperService.createEthService(
          tenantId,
          EthServiceType.WEB3,
          token[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          token[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // networkShallExist (an error shall be thrown if network doesn't exist)
        );

      if (!ethService) {
        // ethService can be undefined in case network doesn't exist anymore or is not alive
        ErrorService.throwError(
          "Shall never happen: network is not reachable but error shall have been thrown inside 'createEthService' function",
        );
      }

      const dvpAddress: string = await this.apiSCCallService.retrieveDVPAddress(
        callerId,
        ethService,
      );

      // Create workflow instance in Workflow-API
      const tradeWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];
      const tradeOrder: Order =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ORDER,
          functionName, // createTradeOrder Or purchaseOffer Or bindOffer,
          typeFunctionUser,
          sender[UserKeys.USER_ID], // senderId
          token[TokenKeys.TOKEN_ID], // tokenId
          EntityType.TOKEN,
          undefined, // objectId
          recipient[UserKeys.USER_ID], // recipientId
          undefined, // brokerId
          undefined, // agentId
          tradeWorkflowId,
          orderQuantity, // quantity
          orderAmount, // price
          undefined, // documentId
          senderWallet[WalletKeys.WALLET_ADDRESS],
          assetClassKey, // assetClass
          new Date(),
          nextState, // TradeWorkflow.ACCEPTED
          undefined, // offerId
          orderSide,
          {
            ...data,
            [OrderKeys.DATA__ORDER_TYPE]: orderType,
            [OrderKeys.DATA__PAYMENT_ACCOUNT_ADDRESS]: paymentAccountAddress,
            [OrderKeys.DATA__DVP]: {
              [OrderKeys.DATA__DVP__TYPE]: dvpType,
              [OrderKeys.DATA__DVP__ADDRESS]: dvpAddress,
              [OrderKeys.DATA__DVP__RECIPIENT]: {
                [OrderKeys.DATA__DVP__RECIPIENT__ID]:
                  recipient[UserKeys.USER_ID],
              },
              [OrderKeys.DATA__DVP__DELIVERY]: {
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]:
                  token[TokenKeys.DEFAULT_DEPLOYMENT],
                [OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD]:
                  token[TokenKeys.STANDARD],
              },
              [OrderKeys.DATA__DVP__PAYMENT]: {
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]:
                  paymentTokenAddess,
                [OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD]:
                  paymentTokenStandard,
              },
            },
          },
        );

      // Link token recipient with the token
      await this.linkDVPUserWithToken(
        tenantId,
        DvpUserType.RECIPIENT,
        tradeOrder,
        token,
      );

      if (sendNotification) {
        // To be completed in case some users need to be notified
      }

      return {
        order: tradeOrder,
        created: true,
        message: `Trade order ${tradeOrder[OrderKeys.ID]} created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing creation of accepted trade order',
        'forceCreateAcceptedTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Hold trade order delivery]
   *
   * This function can only be called by an issuer or a broker.
   * It can only be called for an order-workflow (trade) in state ACCEPTED.
   * It allows to declare the investor's trade order as approved.
   *
   * On-chain:
   *  - Transaction sent: "holdFrom" function of token extension smart contract
   *  - State of delivery tokens before tx validation: not on hold
   *  - State of delivery tokens after tx validation: on hold
   *  - Owner of delivery tokens after tx validation: no change, sill the initial investor
   *
   * Off-chain state machine:
   *  - Initial state: ACCEPTED
   *  - Destination state: OUTSTANDING
   */
  async holdTradeOrderDelivery(
    tenantId: string,
    callerId: string,
    user: User, // issuer or broker
    orderId: string,
    timeToExpiration: number,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<HoldTradeOrderDeliveryBodyOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.HOLD_SECONDARY_TRADE_ORDER_DELIVERY;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const [, issuer, token] =
        await this.entityService.retrieveEntityIfAuthorized(
          tenantId,
          user[UserKeys.USER_ID],
          'hold Trade Order Delivery',
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        );

      const issuerId = issuer[UserKeys.USER_ID];

      const [
        sender,
        recipient,
        senderTokenLink,
        recipientTokenLink,
        issuerTokenLink,
        config,
      ]: [User, User, Link, Link, Link, Config] = await Promise.all([
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuerId,
          UserType.ISSUER,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Fetch the recipient broker for later use in email notification
      const [recipientBrokerId] = await Promise.all([
        this.linkService.retrieveBrokerIdIfExisting(
          tenantId,
          recipient[UserKeys.USER_ID],
          issuer[UserKeys.USER_ID],
        ),
      ]);

      const [recipientBroker] = await Promise.all([
        recipientBrokerId
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              recipientBrokerId,
              true,
            )
          : undefined,
      ]);

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // If the caller is a broker, make sure the link contains the correct brokerId
      if (typeFunctionUser === UserType.BROKER) {
        // Check if the sender is onboarded by the broker
        await this.linkService.checkUserOnboardedbyBroker(
          tenantId,
          sender,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          issuerId, // issuerId
          user[UserKeys.USER_ID], // brokerId
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // holdTradeOrderDelivery
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      const deliveryHoldCreationMessage = `Creation of delivery token hold of ${
        tradeOrder[OrderKeys.QUANTITY]
      } issued token(s), for investor ${sender[UserKeys.USER_ID]}`;

      // Idempotency
      const targetState = 'outstanding';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        tradeOrder[OrderKeys.DATA],
        targetState,
      );
      if (
        tradeOrder[OrderKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Order approval has been triggered, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            tradeOrder[OrderKeys.DATA],
            targetState,
          ),
          message: `${deliveryHoldCreationMessage} was already done (tx ${txStatus})`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // holdTradeOrderDelivery
      );

      const senderWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          sender,
          senderTokenLink,
        );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        senderWallet,
        token,
        tokenState,
        tradeOrder[OrderKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        tradeOrder[OrderKeys.QUANTITY],
        true,
      );

      const recipientWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          recipient,
          recipientTokenLink,
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

      const holdId: string = web3Utils.soliditySha3(
        sender[UserKeys.USER_ID],
        uuidv4(),
      ); // 'senderId' and 'uuidv4' are used as "salts" here
      const htlc: HTLC = newEncryptedHTLC(issuerId); // issuer will be the only one capable to decrypt the HTLC secret

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
          senderWallet[WalletKeys.WALLET_ADDRESS],
        ),
        recipient: web3Utils.toChecksumAddress(
          recipientWallet[WalletKeys.WALLET_ADDRESS],
        ),
        notary: web3Utils.toChecksumAddress(HOLD_NOTARY_ADDRESS), // Shall be the ZERO_ADDRESS but is currently forbidden by the smart contract
        partition: this.partitionService.createPartition(
          tokenState,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        value: addDecimalsAndConvertToHex(
          tradeOrder[OrderKeys.QUANTITY],
          DECIMALS,
        ),
        timeToExpiration: timeToExpiration || HOLD_VALIDITY_PERIOD,
        secretHash: htlc[HTLCKeys.SECRET_HASH],
        certificate: EMPTY_CERTIFICATE,
      };

      const holdFromResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          tokenCategory,
          issuer, // issuer
          token, // token
          config,
          sender, // sender
          recipient, // recipient
          tokenState, // originTokenState
          tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
          tokenState, // destinationTokenState
          tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
          SmartContract.ERC1400_TOKENS_VALIDATOR, // contractName
          functionName, // holdTradeOrderDelivery
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = holdFromResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          tradeOrder[OrderKeys.DATA],
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextState,
          transactionId,
          ethService,
          holdFromResponse[ApiSCResponseKeys.TX_SERIALIZED],
          holdFromResponse[ApiSCResponseKeys.TX],
        ),
      };

      const updatedDvpData: any = {
        ...updatedData[OrderKeys.DATA__DVP],
        [OrderKeys.DATA__TRADE_EXPIRES_ON]: new Date(
          (new Date().getTime() / 1000 +
            (timeToExpiration || HOLD_VALIDITY_PERIOD)) *
            1000,
        ),
        [OrderKeys.DATA__DVP__HTLC]: htlc,
        [OrderKeys.DATA__DVP__DELIVERY]: {
          ...updatedData[OrderKeys.DATA__DVP][OrderKeys.DATA__DVP__DELIVERY],
          [OrderKeys.DATA__DVP__DELIVERY__HOLD_ID]: holdId,
        },
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...updatedData,
          [OrderKeys.DATA__DVP]: updatedDvpData,
          ...data,
        },
      };
      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newTradeOrder,
        );

      // If required, schedule a payment token hold on behalf of buyer after settlement
      let scheduleAdditionalAction: string;
      let isAutomatePayment = false;

      if (tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__AUTOMATE_PAYMENT]) {
        scheduleAdditionalAction = FunctionName.HOLD;
        isAutomatePayment = true;
      }

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuerId,
          sender[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${deliveryHoldCreationMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${deliveryHoldCreationMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${deliveryHoldCreationMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: holdFromResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: holdFromResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: holdFromResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedTradeOrder,
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

      if (!isAutomatePayment && sendNotification) {
        this.apiMailingCallService.notifyRecipientTradeOrderHoldCreated(
          tenantId,
          recipientBroker ?? recipient,
          sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OrderKeys.ASSET_CLASS],
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: updatedTradeOrder,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated

        const response = await this.orderService.order_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return {
          order: response.order,
          updated: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating delivery token hold',
        'holdTradeOrderDelivery',
        false,
        500,
      );
    }
  }

  /**
   * [Force the creation of a "paid trade order"]
   *
   * This function can only be called by the issuer.
   * It starts a new order-workflow (trade).
   * It allows the issuer to create a paid order that is already accepted by all parties, and where the delivery and payment token holds are already created.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: PAID
   */
  async forceCreatePaidTradeOrder(
    tenantId: string,
    idempotencyKey: string,
    callerId: string,
    user: User, // issuer
    recipientId: string,
    deliveryTokenNetworkKey: string,
    deliveryTokenAddress: string,
    deliveryTokenStandard: SmartContract,
    deliveryHoldId: string,
    paymentTokenId: string,
    paymentAssetClassKey: string,
    paymentAmount: number,
    orderType: OrderType,
    dvpType: DvpType,
    orderSide: OrderSide,
    data: any,
    sendNotification: boolean,
    authToken: string,
    senderId?: string,
  ): Promise<ForceCreatePaidTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const paymentTokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.FORCE_CREATE_PAID_SECONDARY_TRADE_ORDER;
      const paymentTokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        paymentTokenCategory,
        functionName,
      );
      this.checkOrderTypeIsValid(orderType);
      this.checkOrderSideIsValid(orderSide);
      this.checkDvpTypeIsValid(dvpType);

      // Preliminary step: Fetch all required data in databases
      const [
        issuer,
        paymentToken,
        sender,
        recipient,
        recipientTokenLink,
        issuerTokenLink,
        orderWithSameKey,
        config,
      ]: [User, Token, User, User, Link, Link, Order, Config] =
        await Promise.all([
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            paymentTokenId,
            EntityType.TOKEN,
          ),
          this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            paymentTokenId,
            true,
            undefined,
            undefined,
            true,
          ),
          senderId
            ? this.apiEntityCallService.fetchEntity(tenantId, senderId, true)
            : undefined,
          this.apiEntityCallService.fetchEntity(tenantId, recipientId, true),
          this.linkService.retrieveStrictUserEntityLink(
            // We check the recipient is correctly linked to the payment token
            tenantId,
            recipientId,
            UserType.INVESTOR,
            paymentTokenId,
            EntityType.TOKEN,
            paymentAssetClassKey,
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            user[UserKeys.USER_ID],
            UserType.ISSUER,
            paymentTokenId,
            EntityType.TOKEN,
            undefined, // assetClassKey
          ),
          this.workflowService.retrieveWorkflowInstanceByIdempotencyKey(
            tenantId,
            WorkflowType.ORDER,
            idempotencyKey,
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${
            user[UserKeys.USER_ID]
          }) is not the issuer of the token (${issuer[UserKeys.USER_ID]})`,
        );
      }

      // Idempotency
      const targetState = 'paid';
      if (orderWithSameKey) {
        // Order was already created (idempotency)
        return {
          order: orderWithSameKey,
          created: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            orderWithSameKey[OrderKeys.DATA],
            targetState,
          ),
          message: `Trade order ${
            orderWithSameKey[OrderKeys.ID]
          } creation was already done (idempotencyKey)`,
        };
      }

      // ==> Step1: Perform several checks before sending the transaction

      this.checkSenderAndRecipientValidity(sender, recipient);

      checkTokenBelongsToExpectedCategory(paymentToken, paymentTokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(paymentToken);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        paymentTokenCategory,
        functionName, // forceCreatePaidTradeOrder
        issuer,
        paymentToken,
        config,
        sender, // token sender
        recipient, // token recipient
        paymentTokenState, // originTokenState
        paymentAssetClassKey, // originTokenClass
        paymentTokenState, // destinationTokenState
        paymentAssetClassKey, // destinationTokenClass
      );

      const paymentHoldCreationMessage = `Creation of payment token hold of ${paymentAmount} issued token(s), for investor ${
        recipient[UserKeys.USER_ID]
      }`;

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // forceCreateAcceptedTradeOrder
      );

      const deliveryTokenNetwork: Network =
        await this.networkService.retrieveNetwork(
          tenantId,
          undefined, // chainId (deprecated)
          deliveryTokenNetworkKey, // networkKey (shall replace 'chainId')
          true, // networkShallExist (if set to 'true', an error is thrown if network doesn't exist)
        );

      // Check if both delivery and payment tokens are deployed on the same network (only if dvp type is atomic)
      if (
        dvpType === DvpType.ATOMIC &&
        deliveryTokenNetwork[NetworkKeys.CHAIN_ID] !==
          paymentToken[TokenKeys.DEFAULT_CHAIN_ID]
      ) {
        ErrorService.throwError(
          `invalid dvp type: dvp type can not be ${
            DvpType.ATOMIC
          }, as delivery token is not deployed on the same network as the payment token (delivery token network chaindId: ${
            deliveryTokenNetwork[NetworkKeys.CHAIN_ID]
          }, payment token network chaindId: ${
            paymentToken[TokenKeys.DEFAULT_CHAIN_ID]
          })`,
        );
      }

      const recipientWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          recipient, // sender
          recipientTokenLink,
        );

      // Check if delivery token exists and extract hold parameters
      const deliveryEthService: EthService =
        await this.ethHelperService.createEthServiceWithNetworkKey(
          tenantId,
          EthServiceType.WEB3,
          deliveryTokenNetworkKey,
          true, // networkShallExist (if set to 'true', an error is thrown if network doesn't exist)
        );
      const deliveryHold: Hold =
        await this.apiSCCallService.retrieveHoldIfExisting(
          callerId,
          deliveryEthService,
          deliveryHoldId,
          deliveryTokenAddress,
          false, // check token hold value
          undefined, // value
        );

      // Check hold status
      if (
        HoldStatusCodeMapping[deliveryHold[HoldKeys.STATUS]] !==
        HoldStatusCode.Ordered
      ) {
        ErrorService.throwError(
          `invalid hold status (expected: ${HoldStatusCode.Ordered}, current: ${
            HoldStatusCodeMapping[deliveryHold[HoldKeys.STATUS]]
          })`,
        );
      }

      // If sender is not specified
      // Check recipient is indeed the recipient of the hold
      if (!sender) {
        try {
          this.walletService.extractWalletFromUser(
            recipient,
            deliveryHold[HoldKeys.RECIPIENT],
          );
        } catch (error) {
          ErrorService.throwError(
            `hold recipient address (${
              deliveryHold[HoldKeys.RECIPIENT]
            }) doesn't belong to user with id ${recipient[UserKeys.USER_ID]}`,
          );
        }
      }

      // Check hold expiration date is not past
      const deliveryHoldExpirationDate: Date = new Date(
        parseInt(deliveryHold[HoldKeys.EXPIRATION]) * 1000,
      );
      const currentDate: Date = new Date();

      let paymentHoldExpirationDate: Date;
      if (deliveryHoldExpirationDate.getTime() <= currentDate.getTime()) {
        ErrorService.throwError(
          `hold with id ${deliveryHoldId} is already expired (expired on ${deliveryHoldExpirationDate.toString()})`,
        );
      } else if (
        deliveryHoldExpirationDate.getTime() <=
        currentDate.getTime() + TWO_DAY_SECURITY_PERIOD
      ) {
        ErrorService.throwError(
          `hold with id ${deliveryHoldId} expires in less than 2 days (expires on ${deliveryHoldExpirationDate.toString()})`,
        );
      } else {
        paymentHoldExpirationDate = new Date(
          deliveryHoldExpirationDate.getTime() + ONE_DAY_SECURITY_PERIOD * 1000,
        );
      }

      // Extract delivery token quantity from hold
      const orderQuantity: number = removeDecimalsFromBalances(
        deliveryHold[HoldKeys.VALUE],
        DECIMALS,
      );
      this.checkOrderQuantityAndPriceAreValid(orderQuantity, paymentAmount);

      // Extract secretHash from hold
      const secretHash: string = deliveryHold[HoldKeys.SECRET_HASH];

      // Extract senderAddress from hold
      const senderAddress: string = sender
        ? sender[UserKeys.DEFAULT_WALLET]
        : deliveryHold[HoldKeys.SENDER];

      // Check recipient owns enough payment tokens
      await this.balanceService.checkTokenOwnership(
        tenantId,
        paymentTokenCategory,
        callerId,
        sender
          ? this.walletService.extractWalletFromUser(sender, senderAddress)
          : recipientWallet,
        paymentToken,
        paymentTokenState,
        paymentAssetClassKey,
        undefined, // tokenIdentifier
        paymentAmount,
        true,
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
          paymentToken[TokenKeys.DEFAULT_CHAIN_ID], // TO BE DEPRECATED (replaced by 'networkKey')
          paymentToken[TokenKeys.DEFAULT_NETWORK_KEY],
          true, // checkEthBalance
          authToken,
        );

      const paymentHoldId: string = web3Utils.soliditySha3(
        recipient[UserKeys.USER_ID],
        uuidv4(),
      ); // 'senderId' and 'uuidv4' are used as "salts" here

      const dvpAddress: string = await this.apiSCCallService.retrieveDVPAddress(
        callerId,
        ethService,
      );

      const extensionAddress: string =
        await this.apiSCCallService.retrieveTokenExtensionAddress(
          callerId,
          ethService,
          paymentToken[TokenKeys.DEFAULT_DEPLOYMENT],
        );

      const body: any = {
        contractAddress: web3Utils.toChecksumAddress(extensionAddress),
        signerAddress: web3Utils.toChecksumAddress(
          issuerWallet[WalletKeys.WALLET_ADDRESS],
        ),
        token: web3Utils.toChecksumAddress(
          paymentToken[TokenKeys.DEFAULT_DEPLOYMENT],
        ),
        holdId: paymentHoldId,
        sender: sender
          ? web3Utils.toChecksumAddress(senderAddress)
          : web3Utils.toChecksumAddress(
              recipientWallet[WalletKeys.WALLET_ADDRESS], // if sender is not specified, we use the recipient
            ),
        recipient: sender
          ? web3Utils.toChecksumAddress(
              recipientWallet[WalletKeys.WALLET_ADDRESS],
            )
          : web3Utils.toChecksumAddress(senderAddress), // if sender is not specified, we use delivery hold sender
        notary: web3Utils.toChecksumAddress(HOLD_NOTARY_ADDRESS), // Shall be the ZERO_ADDRESS but is currently forbidden by the smart contract
        partition: this.partitionService.createPartition(
          paymentTokenState,
          paymentAssetClassKey,
        ),
        value: addDecimalsAndConvertToHex(paymentAmount, DECIMALS),
        timeToExpiration: paymentHoldExpirationDate.getTime() / 1000, // A JS date has milliseconds, we need to remove them to have a solidity date in seconds
        secretHash,
        certificate: EMPTY_CERTIFICATE,
      };

      const holdFromResponse: ApiSCResponse =
        await this.transactionHelperService.sendTokenTransaction(
          tenantId,
          callerId,
          issuer, // signer
          paymentTokenCategory,
          issuer, // issuer
          paymentToken, // token
          config,
          sender,
          recipient,
          paymentTokenState, // originTokenState
          paymentAssetClassKey, // originTokenClass
          paymentTokenState, // destinationTokenState
          paymentAssetClassKey, // destinationTokenClass
          SmartContract.ERC1400_TOKENS_VALIDATOR, // contractName
          functionName, // forceCreatePaidTradeOrder
          body,
          ethService,
          authToken,
          config,
        );
      const transactionId = holdFromResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...data,
        [OrderKeys.DATA__ORDER_TYPE]: orderType,
        [OrderKeys.DATA__DVP]: {
          [OrderKeys.DATA__DVP__TYPE]: dvpType,
          [OrderKeys.DATA__DVP__ADDRESS]: dvpAddress,
          [OrderKeys.DATA__DVP__DELIVERY]: {
            [OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]:
              deliveryTokenAddress,
            [OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD]:
              deliveryTokenStandard,
            [OrderKeys.DATA__DVP__DELIVERY__HOLD_ID]: deliveryHoldId,
          },
          [OrderKeys.DATA__DVP__PAYMENT]: {
            [OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]:
              paymentToken[TokenKeys.DEFAULT_DEPLOYMENT],
            [OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD]:
              paymentToken[TokenKeys.STANDARD],
            [OrderKeys.DATA__DVP__PAYMENT__HOLD_ID]: paymentHoldId,
          },
        },
      };

      const updatedData2: any = {
        ...this.transactionHelperService.addPendingTxToData(
          updatedData,
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextState,
          transactionId,
          ethService,
          holdFromResponse[ApiSCResponseKeys.TX_SERIALIZED],
          holdFromResponse[ApiSCResponseKeys.TX],
        ),
      };

      // Create workflow instance in Workflow-API
      const tradeWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];
      const tradeOrder: Order =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ORDER,
          functionName, // forceCreatePaidTradeOrder
          typeFunctionUser,
          sender?.[UserKeys.USER_ID], // senderId (we don't necessarily have the userId, we only have his address)
          paymentToken[TokenKeys.TOKEN_ID], // tokenId
          EntityType.TOKEN,
          undefined, // objectId
          recipient[UserKeys.USER_ID], // recipientId
          undefined, // brokerId
          undefined, // agentId
          tradeWorkflowId,
          orderQuantity, // quantity
          paymentAmount, // price
          undefined, // documentId
          recipientWallet[WalletKeys.WALLET_ADDRESS],
          paymentAssetClassKey, // assetClass
          new Date(),
          nextState, // TradeWorkflow.PAID
          undefined, // offerId
          orderSide,
          updatedData2,
        );

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuer[UserKeys.USER_ID],
          recipient[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: paymentToken[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${paymentHoldCreationMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${paymentHoldCreationMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${paymentHoldCreationMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: holdFromResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: holdFromResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: holdFromResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: tradeOrder,
        [HookKeys.TOKEN_CATEGORY]: paymentTokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: issuer[UserKeys.USER_ID],
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        issuer[UserKeys.USER_ID],
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (sendNotification) {
        // To be completed in case some users need to be notified
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: tradeOrder,
          created: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const response = await this.orderService.order_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return {
          order: response.order,
          created: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing creation of paid trade order',
        'forceCreatePaidTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Hold trade order payment]
   *
   * This function can only be called by the recipient of the trade.
   * It can only be called for an order-workflow (trade) in state OUTSTANDING.
   * It allows to declare the trade order as accepted.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: OUTSTANDING
   *  - Destination state: PAID
   */
  async holdTradeOrderPayment(
    tenantId: string,
    user: User,
    orderId: string,
    paymentHoldId: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<HoldTradeOrderPaymentBodyOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.HOLD_SECONDARY_TRADE_ORDER_PAYMENT;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      // Payment hold ID is only required for atomic DVP trades
      if (this.retrieveDvpType(tradeOrder) !== DvpType.ATOMIC) {
        ErrorService.throwError(
          `order with ID ${orderId} is not ${DvpType.ATOMIC}`,
        );
      }

      // In case the trade is atomic, the paymentHoldId is mandatory
      if (!paymentHoldId) {
        ErrorService.throwError('missing input parameter: paymentHoldId');
      }

      const [
        issuer,
        sender,
        recipient,
        token, // senderTokenLink // recipientTokenLink
        ,
        ,
        config,
      ]: [User, User, User, Token, Link, Link, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (user[UserKeys.USER_ID] !== recipient[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided recipientId (${
            user[UserKeys.USER_ID]
          }) is not the recipîent of the trade (${
            recipient[UserKeys.USER_ID]
          })`,
        );
      }

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // acceptTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'paid') {
        // Order has already been accepted, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Payment hold ID has already been provided',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // acceptTradeOrder
      );

      const updatedDvpData: any = {
        ...tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP],
        [OrderKeys.DATA__DVP__PAYMENT]: {
          ...tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ],
          [OrderKeys.DATA__DVP__PAYMENT__HOLD_ID]: paymentHoldId,
        },
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          [OrderKeys.DATA__DVP]: updatedDvpData,
          ...data,
        },
      };
      let updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      // After setting the order state to 'paid', automatically settle the trade order, if auto settelment is enabled for the token
      if (token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_SETTLEMENT]) {
        const settleTradeOutput = await this.settleAtomicTradeOrder(
          tenantId,
          issuer[UserKeys.USER_ID], //callerID
          issuer,
          String(updatedTradeOrder[OrderKeys.ID]),
          paymentHoldId, //htlcSecret (assume only issuer can decrypt the HTLC secret so put undefined here)
          undefined, //data
          sendNotification,
          authToken,
        );

        // send updated order in response
        updatedTradeOrder = settleTradeOutput.order;
      }

      if (sendNotification) {
        this.apiMailingCallService.notifySenderAtomicTradeOrderPaid(
          tenantId,
          issuer,
          sender,
          recipient,
          tradeOrder,
          token,
          authToken,
        );

        this.apiMailingCallService.notifyIssuerTradeOrderPaid(
          tenantId,
          issuer,
          sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OfferKeys.ASSET_CLASS],
          authToken,
        );
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order ${
          updatedTradeOrder[OrderKeys.ID]
        } updated successfully (payment hold ID provided by recipient)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'providing payment token hold',
        'holdTradeOrderPayment',
        false,
        500,
      );
    }
  }

  /**
   * [Settle atomic trade order]
   *
   * This function can only be called by an issuer.
   * It can only be called for an order-workflow (trade) in state PAID.
   * It allows to settle an atomic trade
   *
   * On-chain:
   *  - Transaction sent: "executeHolds" function of DVP smart contract, which triggers 2 "executeHold" functions
   *  - State of delivery tokens before tx validation: on hold
   *  - State of delivery tokens after tx validation: not on hold
   *  - Owner of delivery tokens after tx validation: a swap occurs, e.g. trade recipient receives
   *    delivery tokens while trade sender receives payments tokens
   *
   * Off-chain state machine:
   *  - Initial state: PAID
   *  - Destination state: EXECUTED
   */
  async settleAtomicTradeOrder(
    tenantId: string,
    callerId: string,
    user: User,
    orderId: string,
    newPaymentHoldId: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<SettleAtomicTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.SETTLE_ATOMIC_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      if (this.retrieveDvpType(tradeOrder) !== DvpType.ATOMIC) {
        ErrorService.throwError(
          `order with ID ${orderId} is not ${DvpType.ATOMIC}`,
        );
      }

      const [
        issuer,
        sender,
        recipient,
        token,
        senderTokenLink, // recipientTokenLink
        ,
        issuerTokenLink,
        config,
      ]: [User, User, User, Token, Link, Link, Link, Config] =
        await Promise.all([
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            true,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            true,
          ),
          this.apiMetadataCallService.retrieveTokenInDB(
            tenantId,
            TokenIdentifierEnum.tokenId,
            tradeOrder[OrderKeys.ENTITY_ID],
            true,
            undefined,
            undefined,
            true,
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            user[UserKeys.USER_ID],
            UserType.ISSUER,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            undefined, // assetClassKey
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${
            user[UserKeys.USER_ID]
          }) is not the issuer of the token (${issuer[UserKeys.USER_ID]})`,
        );
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // settleAtomicTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      const settlementMessage = `Trade order atomic settlement, including execution of sender (${
        tradeOrder[OrderKeys.USER_ID]
      }) and recipient (${tradeOrder[OrderKeys.RECIPIENT_ID]}) token holds`;

      // Idempotency
      const targetState = 'executed';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        tradeOrder[OrderKeys.DATA],
        targetState,
      );
      if (
        tradeOrder[OrderKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Order settlement has been triggered, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            tradeOrder[OrderKeys.DATA],
            targetState,
          ),
          message: `${settlementMessage} was already done (tx ${txStatus})`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // settleAtomicTradeOrder
      );

      const senderWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(
          sender,
          senderTokenLink,
        );

      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        senderWallet,
        token,
        tokenState,
        tradeOrder[OrderKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        tradeOrder[OrderKeys.QUANTITY],
        false,
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

      // Retrieve delivery token data
      const deliveryHoldId: string = this.retrieveDvpDeliveryHoldId(tradeOrder);
      const deliveryTokenAddress: string =
        this.retrieveDvpDeliveryTokenAddress(tradeOrder);
      const deliveryTokenStandard: SmartContract =
        this.retrieveDvpDeliveryTokenStandard(tradeOrder);

      // Retrieve payment token data
      const paymentHoldId: string =
        newPaymentHoldId || this.retrieveDvpPaymentHoldId(tradeOrder);
      const paymentTokenAddress: string =
        this.retrieveDvpPaymentTokenAddress(tradeOrder);
      const paymentTokenStandard: SmartContract =
        this.retrieveDvpPaymentTokenStandard(tradeOrder);

      // Retrieve hold secret
      const htlc: HTLC = this.retrieveDvpHTLC(tradeOrder);
      const decryptedHTLC: HTLC = decryptHTLC(htlc, user[UserKeys.USER_ID]);

      // Check holdIds are both valid
      await Promise.all([
        this.apiSCCallService.retrieveHoldIfExisting(
          callerId,
          ethService,
          deliveryHoldId,
          deliveryTokenAddress,
          true, // check token hold value
          tradeOrder[OrderKeys.QUANTITY],
        ),
        this.apiSCCallService.retrieveHoldIfExisting(
          callerId,
          ethService,
          paymentHoldId,
          paymentTokenAddress,
          true, // check token hold value
          tradeOrder[OrderKeys.PRICE],
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__PAYMENT_ACCOUNT_ADDRESS], // Check payment hold has the expected payment receiver address
        ),
      ]);

      // Send transaction
      const holdFromResponse: ApiSCResponse =
        await this.apiSCCallService.executeDVP(
          tenantId,
          callerId,
          issuer, // signer
          deliveryTokenAddress,
          deliveryHoldId,
          this.tokenHelperService.retrieveTokenStandardAsNumber(
            deliveryTokenStandard,
          ),
          paymentTokenAddress,
          paymentHoldId,
          this.tokenHelperService.retrieveTokenStandardAsNumber(
            paymentTokenStandard,
          ),
          decryptedHTLC[HTLCKeys.SECRET],
          issuerWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId = holdFromResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          tradeOrder[OrderKeys.DATA],
          issuer[UserKeys.USER_ID],
          issuerWallet,
          nextState,
          transactionId,
          ethService,
          holdFromResponse[ApiSCResponseKeys.TX_SERIALIZED],
          holdFromResponse[ApiSCResponseKeys.TX],
        ),
      };

      const updatedDvpData: any = {
        ...updatedData[OrderKeys.DATA__DVP],
        [OrderKeys.DATA__DVP__PAYMENT]: {
          ...updatedData[OrderKeys.DATA__DVP][OrderKeys.DATA__DVP__PAYMENT],
          [OrderKeys.DATA__DVP__PAYMENT__HOLD_ID]: paymentHoldId,
        },
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...updatedData,
          [OrderKeys.DATA__DVP]: updatedDvpData,
          ...data,
        },
      };
      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newTradeOrder,
        );

      // If required, schedule a token retirement after settlement
      let scheduleAdditionalAction: string;

      if (
        (token &&
          token[TokenKeys.DATA] &&
          token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_RETIREMENT]) ||
        tradeOrder[OrderKeys.DATA][OrderKeys.DATA__AUTOMATE_RETIREMENT]
      ) {
        scheduleAdditionalAction = FunctionName.UPDATE_STATE;
      }

      if (
        !scheduleAdditionalAction &&
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_FORCE_BURN] &&
        token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_FORCE_BURN].includes(
          tradeOrder[OrderKeys.ORDER_SIDE],
        )
      ) {
        scheduleAdditionalAction = FunctionName.FORCE_BURN;
      }

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          user[UserKeys.USER_ID],
          sender[UserKeys.USER_ID],
          recipient[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: issuerWallet,
        [HookKeys.RESPONSE_PENDING]: `${settlementMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${settlementMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${settlementMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]: holdFromResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]: holdFromResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: holdFromResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedTradeOrder,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: user[UserKeys.USER_ID],
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: scheduleAdditionalAction,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        user[UserKeys.USER_ID],
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (sendNotification) {
        this.apiMailingCallService.notifySenderTradeOrderSettled(
          tenantId,
          sender,
          recipient,
          tradeOrder,
          token,
          authToken,
        );

        this.apiMailingCallService.notifyRecipientTradeOrderSettled(
          tenantId,
          recipient,
          issuer,
          sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OrderKeys.ASSET_CLASS],
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: updatedTradeOrder,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated

        const response = await this.orderService.order_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return {
          order: response.order,
          updated: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling trade order',
        'settleAtomicTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Send trade order payment]
   *
   * This function can only be called by the issuer, the broker of the recipient, or the recipient of the trade.
   * It can only be called for an order-workflow (trade) in state OUSTANDING.
   * It allows to declare the trade order as paid.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: OUSTANDING
   *  - Destination state: PAYING
   */
  async sendTradeOrderPayment(
    tenantId: string,
    user: User,
    orderId: string,
    paymentAmount: number,
    paymentId: string,
    paymentProof: string[],
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<AcceptTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.SEND_SECONDARY_TRADE_ORDER_PAYMENT;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      if (this.retrieveDvpType(tradeOrder) !== DvpType.NON_ATOMIC) {
        ErrorService.throwError(
          `order with ID ${orderId} is not ${DvpType.NON_ATOMIC}`,
        );
      }

      const [
        [, issuer, token],
        sender,
        recipient, // senderTokenLink // recipientTokenLink
        ,
        ,
        config,
      ]: [[Project, User, Token, Config], User, User, Link, Link, Config] =
        await Promise.all([
          user[UserKeys.USER_ID] === tradeOrder[OrderKeys.RECIPIENT_ID]
            ? this.entityService.retrieveEntity(
                tenantId,
                tradeOrder[OrderKeys.ENTITY_ID],
                EntityType.TOKEN,
              )
            : this.entityService.retrieveEntityIfAuthorized(
                tenantId,
                user[UserKeys.USER_ID],
                'send Trade Order Payment',
                tradeOrder[OrderKeys.ENTITY_ID],
                EntityType.TOKEN,
              ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            true,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            true,
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      let senderBroker: User;
      if (sendNotification) {
        // Fetch sender's broker (if existing) for later use in email notification
        const senderBrokerId =
          await this.linkService.retrieveBrokerIdIfExisting(
            tenantId,
            sender[UserKeys.USER_ID],
            issuer[UserKeys.USER_ID],
          );

        senderBroker = senderBrokerId
          ? await this.apiEntityCallService.fetchEntity(
              tenantId,
              senderBrokerId,
              true,
            )
          : undefined;
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // If the caller is a broker, make sure the link contains the correct brokerId
      if (typeFunctionUser === UserType.BROKER) {
        // Check if the sender is onboarded by the broker
        await this.linkService.checkUserOnboardedbyBroker(
          tenantId,
          recipient,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          issuer[UserKeys.USER_ID], // issuerId
          user[UserKeys.USER_ID], // brokerId
        );
      } else {
        if (
          user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID] &&
          user[UserKeys.USER_ID] !== tradeOrder[OrderKeys.RECIPIENT_ID]
        ) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is neither the issuer of the token (${
              issuer[UserKeys.USER_ID]
            }) nor the recipient of the hold (${
              tradeOrder[OrderKeys.USER_ID]
            })`,
          );
        }
      }

      if (paymentAmount < tradeOrder[OrderKeys.PRICE]) {
        ErrorService.throwError(
          `payment amount too low (${paymentAmount}): shall be higher than order price, e.g. ${
            tradeOrder[OrderKeys.PRICE]
          }`,
        );
      }

      if (paymentId && paymentId !== tradeOrder[OrderKeys.PAYMENT_ID]) {
        ErrorService.throwError(
          `provided paymentId (${paymentId}) is different from order's paymentId (${
            tradeOrder[OrderKeys.PAYMENT_ID]
          }): THIS CHECK IS OPTIONAL`,
        );
      }

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // sendTradeOrderPayment
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'paying') {
        // Order payment has already been done, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Trade order payment was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // sendTradeOrderPayment
      );

      const updatedDvpData: any = {
        ...tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP],
        [OrderKeys.DATA__DVP__PAYMENT]: {
          ...tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ],
          [OrderKeys.DATA__DVP__PAYMENT__PROOF]: paymentProof,
        },
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          [OrderKeys.DATA__DVP]: updatedDvpData,
          ...data,
        },
      };
      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      if (sendNotification) {
        // send email notification to broker of sender (if existing)
        if (senderBroker) {
          this.apiMailingCallService.notifySenderNonAtomicTradeOrderPaid(
            tenantId,
            senderBroker,
            recipient,
            tradeOrder,
            token,
            tradeOrder[OfferKeys.ASSET_CLASS],
            authToken,
          );
        } else {
          // send email notification to recipient
          this.apiMailingCallService.notifySenderNonAtomicTradeOrderPaid(
            tenantId,
            sender,
            recipient,
            tradeOrder,
            token,
            tradeOrder[OfferKeys.ASSET_CLASS],
            authToken,
          );
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order ${
          updatedTradeOrder[OrderKeys.ID]
        } updated successfully (payment sent)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending trade order payment',
        'sendTradeOrderPayment',
        false,
        500,
      );
    }
  }

  /**
   * [Receive trade order payment]
   *
   * This function can only be called by the issuer, the broker of the sender, or the sender of the trade.
   * It can only be called for an order-workflow (trade) in state PAYING.
   * It allows to declare the trade order as paid.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: PAYING
   *  - Destination state: PAID
   */
  async receiveTradeOrderPayment(
    tenantId: string,
    user: User,
    orderId: string,
    paymentAmount: number,
    paymentId: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<AcceptTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.RECEIVE_SECONDARY_TRADE_ORDER_PAYMENT;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      if (this.retrieveDvpType(tradeOrder) !== DvpType.NON_ATOMIC) {
        ErrorService.throwError(
          `order with ID ${orderId} is not ${DvpType.NON_ATOMIC}`,
        );
      }

      const [
        [, issuer, token],
        sender,
        recipient, // senderTokenLink, // recipientTokenLink
        ,
        ,
        config,
      ]: [[Project, User, Token, Config], User, User, Link, Link, Config] =
        await Promise.all([
          user[UserKeys.USER_ID] === tradeOrder[OrderKeys.USER_ID]
            ? this.entityService.retrieveEntity(
                tenantId,
                tradeOrder[OrderKeys.ENTITY_ID],
                EntityType.TOKEN,
              )
            : this.entityService.retrieveEntityIfAuthorized(
                tenantId,
                user[UserKeys.USER_ID],
                'receive Trade Order Payment',
                tradeOrder[OrderKeys.ENTITY_ID],
                EntityType.TOKEN,
              ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            true,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            true,
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.USER_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            tradeOrder[OrderKeys.RECIPIENT_ID],
            UserType.INVESTOR,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            tradeOrder[OrderKeys.ASSET_CLASS],
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      let senderBroker: User, recipientBroker: User;
      if (sendNotification) {
        // Fetch sender's and recipient's brokers (if existing) for later use in email notification
        const [senderBrokerId, recipientBrokerId]: [string, string] =
          await Promise.all([
            this.linkService.retrieveBrokerIdIfExisting(
              tenantId,
              sender[UserKeys.USER_ID],
              issuer[UserKeys.USER_ID],
            ),
            this.linkService.retrieveBrokerIdIfExisting(
              tenantId,
              recipient[UserKeys.USER_ID],
              issuer[UserKeys.USER_ID],
            ),
          ]);

        [senderBroker, recipientBroker] = await Promise.all([
          senderBrokerId
            ? this.apiEntityCallService.fetchEntity(
                tenantId,
                senderBrokerId,
                true,
              )
            : undefined,
          recipientBrokerId
            ? this.apiEntityCallService.fetchEntity(
                tenantId,
                recipientBrokerId,
                true,
              )
            : undefined,
        ]);
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      if (typeFunctionUser === UserType.BROKER) {
        // Check if the sender is onboarded by the broker
        await this.linkService.checkUserOnboardedbyBroker(
          tenantId,
          sender,
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          issuer[UserKeys.USER_ID], // issuerId
          user[UserKeys.USER_ID], // brokerId
        );
      } else {
        if (
          user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID] &&
          user[UserKeys.USER_ID] !== tradeOrder[OrderKeys.USER_ID]
        ) {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is neither the issuer of the token (${
              issuer[UserKeys.USER_ID]
            }) nor the sender of the hold (${tradeOrder[OrderKeys.USER_ID]})`,
          );
        }
      }

      if (paymentAmount < tradeOrder[OrderKeys.PRICE]) {
        ErrorService.throwError(
          `payment amount too low (${paymentAmount}): shall be higher than order price, e.g. ${
            tradeOrder[OrderKeys.PRICE]
          }`,
        );
      }

      if (paymentId && paymentId !== tradeOrder[OrderKeys.PAYMENT_ID]) {
        ErrorService.throwError(
          `provided paymentId (${paymentId}) is different from order's paymentId (${
            tradeOrder[OrderKeys.PAYMENT_ID]
          }): THIS CHECK IS OPTIONAL`,
        );
      }

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // receiveTradeOrderPayment
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'paid') {
        // Order payment has already been done, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Trade order payment received confirmation was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // receiveTradeOrderPayment
      );

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          ...data,
        },
      };
      let updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newTradeOrder,
        );

      // After setting the order state to 'paid', automatically settle the trade order, if auto settelment is enabled for the token
      if (token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_SETTLEMENT]) {
        const settleTradeOutput = await this.settleNonAtomicTradeOrder(
          tenantId,
          user[UserKeys.USER_ID], //callerID
          issuer,
          String(updatedTradeOrder[OrderKeys.ID]),
          undefined, //htlcSecret (assume only issuer can decrypt the HTLC secret so put undefined here)
          undefined, //data
          sendNotification,
          authToken,
        );

        // send updated order in response
        updatedTradeOrder = settleTradeOutput.order;
      }

      if (sendNotification) {
        // send email notification to broker of recipient (if existing)
        if (senderBroker && recipientBroker) {
          this.apiMailingCallService.notifyRecipientTradeOrderPaymentConfirmed(
            tenantId,
            issuer,
            senderBroker,
            recipientBroker,
            tradeOrder,
            token,
            tradeOrder[OfferKeys.ASSET_CLASS],
            authToken,
          );
        }

        // send email notification to sender
        this.apiMailingCallService.notifyRecipientTradeOrderPaymentConfirmed(
          tenantId,
          issuer,
          senderBroker ?? sender,
          sender,
          tradeOrder,
          token,
          tradeOrder[OfferKeys.ASSET_CLASS],
          authToken,
        );

        // send email notification to recipient
        this.apiMailingCallService.notifyRecipientTradeOrderPaymentConfirmed(
          tenantId,
          issuer,
          senderBroker ?? sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OfferKeys.ASSET_CLASS],
          authToken,
        );

        // send email notification to the issuer, if auto settlement is disabled for the token
        if (!token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_SETTLEMENT]) {
          this.apiMailingCallService.notifyIssuerTradeOrderPaid(
            tenantId,
            issuer,
            senderBroker ?? sender,
            recipient,
            tradeOrder,
            token,
            tradeOrder[OfferKeys.ASSET_CLASS],
            authToken,
          );
        }
      }

      return {
        order: updatedTradeOrder,
        updated: true,
        message: `Trade order ${
          updatedTradeOrder[OrderKeys.ID]
        } updated successfully (payment received)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'receiving trade order payment',
        'receiveTradeOrderPayment',
        false,
        500,
      );
    }
  }

  /**
   * [Settle non-atomic trade order]
   *
   * This function can only be called by an issuer.
   * It can only be called for an order-workflow (trade) in state PAID.
   * It allows to settle a non-atomic trade
   *
   * On-chain:
   *  - Transaction sent: "executeHold" function of token extension smart contract
   *  - State of delivery tokens before tx validation: on hold
   *  - State of delivery tokens after tx validation: not on hold
   *  - Owner of delivery tokens after tx validation: tokens are transferred from trade sender to trade recipient
   *
   * Off-chain state machine:
   *  - Initial state: PAID
   *  - Destination state: EXECUTED
   */
  async settleNonAtomicTradeOrder(
    tenantId: string,
    callerId: string,
    user: User,
    orderId: string,
    htlcSecret: string, // [OPTIONAL] Only required if the trade is executed by the recipient of the trade
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<SettleAtomicTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.SETTLE_NON_ATOMIC_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      if (this.retrieveDvpType(tradeOrder) !== DvpType.NON_ATOMIC) {
        ErrorService.throwError(
          `order with ID ${orderId} is not ${DvpType.NON_ATOMIC}`,
        );
      }

      const [
        issuer,
        sender,
        recipient,
        token, // senderTokenLink
        ,
        recipientTokenLink,
        config,
      ]: [User, User, User, Token, Link, Link, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.RECIPIENT_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      let senderBroker: User, recipientBroker: User;
      if (sendNotification) {
        // Fetch sender's and recipient's brokers (if existing) for later use in email notification
        const [senderBrokerId, recipientBrokerId]: [string, string] =
          await Promise.all([
            this.linkService.retrieveBrokerIdIfExisting(
              tenantId,
              sender[UserKeys.USER_ID],
              issuer[UserKeys.USER_ID],
            ),
            this.linkService.retrieveBrokerIdIfExisting(
              tenantId,
              recipient[UserKeys.USER_ID],
              issuer[UserKeys.USER_ID],
            ),
          ]);

        [senderBroker, recipientBroker] = await Promise.all([
          senderBrokerId
            ? this.apiEntityCallService.fetchEntity(
                tenantId,
                senderBrokerId,
                true,
              )
            : undefined,
          recipientBrokerId
            ? this.apiEntityCallService.fetchEntity(
                tenantId,
                recipientBrokerId,
                true,
              )
            : undefined,
        ]);
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // Retrieve HTLC
      const htlc: HTLC = this.retrieveDvpHTLC(tradeOrder);

      let userTokenLink: Link;
      let userHtlcSecret: string;
      if (
        user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID] &&
        user[UserKeys.USER_ID] !== tradeOrder[OrderKeys.RECIPIENT_ID]
      ) {
        ErrorService.throwError(
          `provided userId (${
            user[UserKeys.USER_ID]
          }) is neither the issuer of the token (${
            issuer[UserKeys.USER_ID]
          }) nor the recipient of the hold (${
            tradeOrder[OrderKeys.RECIPIENT_ID]
          })`,
        );
      } else if (user[UserKeys.USER_ID] === issuer[UserKeys.USER_ID]) {
        userTokenLink = await this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuer[UserKeys.USER_ID],
          UserType.ISSUER,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          undefined, // assetClassKey
        );
        const decryptedHTLC: HTLC = decryptHTLC(htlc, user[UserKeys.USER_ID]);
        userHtlcSecret = decryptedHTLC[HTLCKeys.SECRET];
      } else {
        userTokenLink = recipientTokenLink;
        userHtlcSecret = htlcSecret;
      }

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // settleNonAtomicTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      const settlementMessage = `Trade order non-atomic settlement, including execution of sender's token hold, for investor ${
        sender[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState = 'executed';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        tradeOrder[OrderKeys.DATA],
        targetState,
      );
      if (
        tradeOrder[OrderKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Order settlement has been triggered, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            tradeOrder[OrderKeys.DATA],
            targetState,
          ),
          message: `${settlementMessage} was already done (tx ${txStatus})`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // settleNonAtomicTradeOrder
      );

      // ==> Step2: Send the transaction

      const userWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(user, userTokenLink);

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

      // Retrieve delivery token data
      const deliveryHoldId: string = this.retrieveDvpDeliveryHoldId(tradeOrder);
      const deliveryTokenAddress: string =
        this.retrieveDvpDeliveryTokenAddress(tradeOrder);

      // Check holdId is valid
      const deliveryHold: Hold =
        await this.apiSCCallService.retrieveHoldIfExisting(
          callerId,
          ethService,
          deliveryHoldId,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          true, // check token hold value
          tradeOrder[OrderKeys.QUANTITY],
        );

      // Send transaction
      const executeHoldResponse: ApiSCResponse =
        await this.apiSCCallService.executeHold(
          tenantId,
          callerId,
          user, // signer
          deliveryHoldId,
          deliveryHold[HoldKeys.VALUE],
          userHtlcSecret,
          deliveryTokenAddress,
          userWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId =
        executeHoldResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          tradeOrder[OrderKeys.DATA],
          user[UserKeys.USER_ID],
          userWallet,
          nextState,
          transactionId,
          ethService,
          executeHoldResponse[ApiSCResponseKeys.TX_SERIALIZED],
          executeHoldResponse[ApiSCResponseKeys.TX],
        ),
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...updatedData,
          ...data,
        },
      };
      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newTradeOrder,
        );

      // If required, schedule a token retirement after settlement
      let scheduleAdditionalAction: string;
      if (
        (token &&
          token[TokenKeys.DATA] &&
          token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_RETIREMENT]) ||
        tradeOrder[OrderKeys.DATA][OrderKeys.DATA__AUTOMATE_RETIREMENT]
      ) {
        scheduleAdditionalAction = FunctionName.UPDATE_STATE;
      }

      if (
        !scheduleAdditionalAction &&
        token &&
        token[TokenKeys.DATA] &&
        token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_FORCE_BURN] &&
        token[TokenKeys.DATA][TokenKeys.DATA__AUTOMATE_FORCE_BURN].includes(
          tradeOrder[OrderKeys.ORDER_SIDE],
        )
      ) {
        scheduleAdditionalAction = FunctionName.FORCE_BURN;
      }

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          issuer[UserKeys.USER_ID],
          sender[UserKeys.USER_ID],
          recipient[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: userWallet,
        [HookKeys.RESPONSE_PENDING]: `${settlementMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${settlementMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${settlementMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            executeHoldResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            executeHoldResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: executeHoldResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedTradeOrder,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: user[UserKeys.USER_ID],
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: scheduleAdditionalAction,
        [HookKeys.SEND_NOTIFICATION]: sendNotification,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        user[UserKeys.USER_ID],
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (sendNotification) {
        // send email notification to broker of sender (if existing)
        if (senderBroker) {
          this.apiMailingCallService.notifyRecipientTradeOrderSettled(
            tenantId,
            senderBroker,
            issuer,
            sender,
            recipient,
            tradeOrder,
            token,
            tradeOrder[OrderKeys.ASSET_CLASS],
            authToken,
          );
        }

        // send email notification to broker of recipient (if existing)
        if (recipientBroker) {
          this.apiMailingCallService.notifyRecipientTradeOrderSettled(
            tenantId,
            recipientBroker,
            issuer,
            sender,
            recipient,
            tradeOrder,
            token,
            tradeOrder[OrderKeys.ASSET_CLASS],
            authToken,
          );
        }

        // send email notification to recipient
        this.apiMailingCallService.notifyRecipientTradeOrderSettled(
          tenantId,
          recipient,
          issuer,
          sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OrderKeys.ASSET_CLASS],
          authToken,
        );

        // send email notification to sender
        this.apiMailingCallService.notifyRecipientTradeOrderSettled(
          tenantId,
          sender,
          issuer,
          sender,
          recipient,
          tradeOrder,
          token,
          tradeOrder[OrderKeys.ASSET_CLASS],
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: updatedTradeOrder,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated

        const response = await this.orderService.order_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return {
          order: response.order,
          updated: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling non atomic trade order',
        'settleNonAtomicTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Cancel order]
   *
   * This function can be called by an investor.
   * It can only be called for an order-workflow (issuance) in state PRE_CREATED | APPROVED | ACCEPTED | SUBMITTED
   * It allows the investor to cancel his order.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: PRE_CREATED| APPROVED | ACCEPTED | SUBMITTED
   *  - Destination state: CANCELLED
   */
  async cancelTradeOrder(
    tenantId: string,
    typeFunctionUser: UserType,
    user: User, // `Sender(Seller)-For SELL Order` OR `Buyer(Recipient)-For Buy Order`
    orderId: string,
    comment: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CancelSecondaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.CANCEL_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const [issuer, sender, recipient, token, config]: [
        User,
        User,
        User,
        Token,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        tradeOrder[OrderKeys.USER_ID]
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.USER_ID],
              true,
            )
          : undefined,
        tradeOrder[OrderKeys.RECIPIENT_ID]
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.RECIPIENT_ID],
              true,
            )
          : undefined,
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const agentId = tradeOrder.agentId;
      let agent: User;
      if (agentId) {
        agent = await this.apiEntityCallService.fetchEntity(
          tenantId,
          agentId,
          true,
        );
      }

      // ==> Step1: Perform several checks
      let orderCreator: User;

      if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.SELL) {
        if (!sender?.[UserKeys.USER_ID]) {
          ErrorService.throwError(
            'shall never happen: undefined sender for a SELL order',
          );
        }
        orderCreator = sender;
      } else if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.BUY) {
        if (!recipient?.[UserKeys.USER_ID]) {
          ErrorService.throwError(
            'shall never happen: undefined recipient for a BUY order',
          );
        }
        orderCreator = recipient;
      } else {
        ErrorService.throwError(
          `shall never happen: invalid orderSide(${
            tradeOrder[OrderKeys.ORDER_SIDE]
          })`,
        );
      }

      if (user[UserKeys.USER_ID] !== orderCreator[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided userId (${
            user[UserKeys.USER_ID]
          }) is not the user who created the ${
            tradeOrder[OrderKeys.ORDER_SIDE]
          } order (${orderCreator})`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'cancelled') {
        // Order has already been cancelled, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Secondary trade order cancellation was already done',
        };
      } else if (
        ['submitted', 'approved', 'accepted', 'preCreated'].indexOf(
          tradeOrder[OrderKeys.STATE],
        ) === -1 ||
        // CA-6325: Handle potential case were order cancel request is send right after hold creation is made but before it is validated.
        tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__TRANSACTION]
      ) {
        // Order is already in the hold state and can no longer be cancelled.
        return {
          order: tradeOrder,
          updated: false,
          message:
            'Secondary trade order cannot be cancelled after a hold has been created.',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // cancelSecondaryTradeOrder
      );

      // Update subscription/redemption order in Workflow-API
      const newSecondaryTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          [OrderKeys.COMMENT]: comment,
        },
      };
      const updatedSecondaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newSecondaryTradeOrder,
        );

      if (sendNotification && sender) {
        this.apiMailingCallService.sendIssuerOrderCanceledNotification(
          tenantId,
          issuer,
          sender,
          token,
          tradeOrder,
          authToken,
        );

        if (agent) {
          if (user[UserKeys.USER_ID] === sender[UserKeys.USER_ID]) {
            this.apiMailingCallService.notifyAgentTradeOrderCancelled(
              tenantId,
              agent,
              sender,
              token,
              tradeOrder,
              authToken,
            );
          }

          if (sender) {
            this.apiMailingCallService.notifySellerTradeOrderCancelled(
              tenantId,
              agent,
              sender,
              token,
              tradeOrder,
              authToken,
            );
          }
        }
      }

      return {
        order: updatedSecondaryTradeOrder,
        updated: true,
        message: `Trade order ${
          newSecondaryTradeOrder[OrderKeys.ID]
        } updated successfully (order cancelled)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling trade order',
        'cancelTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Cancel Precreated order]
   *
   * This function can be called by an agent.
   * It can only be called for an order-workflow (issuance) in state PRE_CREATED | APPROVED | ACCEPTED
   * It allows the agent to cancel his order.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: PRE_CREATED | APPROVED | ACCEPTED
   *  - Destination state: CANCELLED
   */
  async cancelPrecreatedTradeOrder(
    tenantId: string,
    typeFunctionUser: UserType,
    user: User, //Agent
    orderId: string,
    comment: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CancelSecondaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.CANCEL_SECONDARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const [issuer, sender, recipient, token, config]: [
        User,
        User,
        User,
        Token,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        tradeOrder[OrderKeys.USER_ID]
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.USER_ID],
              true,
            )
          : undefined,
        tradeOrder[OrderKeys.RECIPIENT_ID]
          ? this.apiEntityCallService.fetchEntity(
              tenantId,
              tradeOrder[OrderKeys.RECIPIENT_ID],
              true,
            )
          : undefined,
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const agentId = tradeOrder.agentId;
      let agent: User;
      if (agentId) {
        agent = await this.apiEntityCallService.fetchEntity(
          tenantId,
          agentId,
          true,
        );
      }

      // ==> Step1: Perform several checks
      let orderCreator: User;

      if (agent[UserKeys.USER_ID]) {
        orderCreator = agent;
      }

      if (user[UserKeys.USER_ID] !== orderCreator[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided userId (${
            user[UserKeys.USER_ID]
          }) is not the user who created the ${
            tradeOrder[OrderKeys.ORDER_SIDE]
          } order (${orderCreator})`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createTradeOrder
        issuer,
        token,
        config,
        sender, // token sender
        recipient, // token recipient
        tokenState, // originTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // originTokenClass
        tokenState, // destinationTokenState
        tradeOrder[OrderKeys.ASSET_CLASS], // destinationTokenClass
      );

      // Idempotency
      if (tradeOrder[OrderKeys.STATE] === 'cancelled') {
        // Order has already been cancelled, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          message: 'Secondary trade order cancellation was already done',
        };
      } else if (
        ['preCreated', 'approved', 'accepted'].indexOf(
          tradeOrder[OrderKeys.STATE],
        ) === -1 ||
        // CA-6325: Handle potential case were order cancel request is send right after hold creation is made but before it is validated.
        tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__TRANSACTION]
      ) {
        // Order is already in the hold state and can no longer be cancelled.
        return {
          order: tradeOrder,
          updated: false,
          message:
            'Secondary trade order cannot be cancelled after a hold has been created.',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // cancelSecondaryTradeOrder
      );

      // Update subscription/redemption order in Workflow-API
      const newSecondaryTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...tradeOrder[OrderKeys.DATA],
          [OrderKeys.COMMENT]: comment,
        },
      };
      const updatedSecondaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newSecondaryTradeOrder,
        );

      if (sendNotification && sender) {
        if (agent) {
          this.apiMailingCallService.notifyAgentTradeOrderCancelled(
            tenantId,
            agent,
            sender,
            token,
            tradeOrder,
            authToken,
          );
        }
        if (sender) {
          this.apiMailingCallService.notifySellerTradeOrderCancelled(
            tenantId,
            agent,
            sender,
            token,
            tradeOrder,
            authToken,
          );
        }
      }

      return {
        order: updatedSecondaryTradeOrder,
        updated: true,
        message: `Trade order ${
          newSecondaryTradeOrder[OrderKeys.ID]
        } updated successfully (order cancelled)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling precreated trade order',
        'cancelPrecreatedTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Reject trade order]
   *
   * This function can only be called by the issuer or by the recipient of the trade.
   * It can only be called for an order-workflow (trade) in state SUBMITTED|APPROVED|ACCEPTED|OUSTANDING|PAID if called by the issuer.
   * * It can only be called for an order-workflow (trade) in state APPROVED if called by the recipient.
   * It allows to declare the investor's trade order as approved.
   *
   * On-chain:
   *  - Transaction sent: "releaseHold" function of token extension smart contract [only if hold had already been created]
   *  - State of delivery tokens before tx validation: on hold
   *  - State of delivery tokens after tx validation: not on hold
   *  - Owner of delivery tokens after tx validation: no change, sill the initial investor
   *
   * Off-chain state machine:
   *  - Initial state: SUBMITTED|APPROVED|ACCEPTED|OUSTANDING|PAID
   *  - Destination state: REJECTED
   */
  async rejectTradeOrder(
    tenantId: string,
    callerId: string,
    user: User, // issuer or recipient or sender
    orderId: string,
    comment: string,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<RejectTradeOrderOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.REJECT_SECONDARY_TRADE_ORDER;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const tradeOrder: Order =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          Number(orderId),
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          true,
        );

      const agentId = tradeOrder.agentId;
      let agent: User;
      if (agentId) {
        agent = await this.apiEntityCallService.fetchEntity(
          tenantId,
          agentId,
          true,
        );
      }

      const senderId = this.extractUserIdFromOrder(
        DvpUserType.SENDER,
        tradeOrder,
      );
      const recipientId = this.extractUserIdFromOrder(
        DvpUserType.RECIPIENT,
        tradeOrder,
      );

      const [
        issuer,
        sender,
        recipient,
        senderTokenLink,
        recipientTokenLink,
        token,
        config,
      ]: [User, User, User, Link, Link, Token, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        senderId
          ? this.apiEntityCallService.fetchEntity(tenantId, senderId, true)
          : undefined,
        recipientId
          ? this.apiEntityCallService.fetchEntity(tenantId, recipientId, true)
          : undefined,
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          tradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          tradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          tradeOrder[OrderKeys.ASSET_CLASS],
        ),
        tradeOrder[OrderKeys.RECIPIENT_ID]
          ? this.linkService.retrieveStrictUserEntityLink(
              tenantId,
              tradeOrder[OrderKeys.RECIPIENT_ID],
              UserType.INVESTOR,
              tradeOrder[OrderKeys.ENTITY_ID],
              EntityType.TOKEN,
              tradeOrder[OrderKeys.ASSET_CLASS],
            )
          : undefined,
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          tradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      // Fetch the related offer in database (if any) and prepare offer update with
      // new remaining offer quantity
      let offer: Offer;
      if (tradeOrder[OrderKeys.OFFER_ID]) {
        offer = await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.id,
          tradeOrder[OrderKeys.OFFER_ID],
          undefined, // idempotencyKey
          undefined,
          undefined,
          undefined,
          undefined, // entityType
          undefined, // workflowType (if querying by id, workflow-api doesn't use this param even if passed, expecting WorkflowType.OFFER)
          undefined, // otherWorkflowType
          true,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      checkTokenBelongsToExpectedCategory(token, tokenCategory);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      let orderCounterparty: User;
      let counterpartyLink: Link;
      if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.SELL) {
        if (!recipient?.[UserKeys.USER_ID]) {
          ErrorService.throwError(
            'shall never happen: undefined recipient for a SELL order',
          );
        }
        orderCounterparty = recipient;
        counterpartyLink = recipientTokenLink;
      } else if (tradeOrder[OrderKeys.ORDER_SIDE] === OrderSide.BUY) {
        if (!sender?.[UserKeys.USER_ID]) {
          ErrorService.throwError(
            'shall never happen: undefined sender for a BUY order',
          );
        }
        orderCounterparty = sender;
        counterpartyLink = senderTokenLink;
      } else {
        ErrorService.throwError(
          `shall never happen: invalid orderSide(${
            tradeOrder[OrderKeys.ORDER_SIDE]
          })`,
        );
      }

      let userTokenLink: Link;
      if (!tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        if (user[UserKeys.USER_ID] === issuer[UserKeys.USER_ID]) {
          // Trade order is rejected by the issuer
          userTokenLink = await this.linkService.retrieveStrictUserEntityLink(
            tenantId,
            issuer[UserKeys.USER_ID],
            UserType.ISSUER,
            tradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
            undefined, // assetClassKey
          );
        } else if (
          user[UserKeys.USER_ID] === orderCounterparty[UserKeys.USER_ID]
        ) {
          // Trade order is rejected by the order creator (sender/recipient)
          userTokenLink = counterpartyLink;
        } else {
          ErrorService.throwError(
            `provided userId (${
              user[UserKeys.USER_ID]
            }) is neither the issuer of the token (${
              issuer[UserKeys.USER_ID]
            }) nor the creator of the order (${
              orderCounterparty[UserKeys.USER_ID]
            })`,
          );
        }
      } else {
        if (user[UserKeys.USER_ID] === tradeOrder[OrderKeys.USER_ID]) {
          userTokenLink = senderTokenLink;
        } else if (
          user[UserKeys.USER_ID] === tradeOrder[OrderKeys.RECIPIENT_ID]
        ) {
          userTokenLink = recipientTokenLink;
        } else {
          ErrorService.throwError(
            `invalid user (${
              user[UserKeys.USER_ID]
            }) for negotiation-enabled order: shall be either sender (${
              tradeOrder[OrderKeys.USER_ID]
            }) or recipient (${tradeOrder[OrderKeys.RECIPIENT_ID]})`,
          );
        }
      }

      // Idempotency
      const targetState = 'rejected';
      const txStatus = this.transactionHelperService.retrieveTxStatusInData(
        tradeOrder[OrderKeys.DATA],
        targetState,
      );
      if (
        tradeOrder[OrderKeys.STATE] === targetState ||
        txStatus === TxStatus.PENDING
      ) {
        // Order rejection has been triggered, return order without updating it (idempotency)
        return {
          order: tradeOrder,
          updated: false,
          transactionId: this.transactionHelperService.retrieveTxIdInData(
            tradeOrder[OrderKeys.DATA],
            targetState,
          ),
          message: `Trade order rejection was already done (tx ${txStatus})`,
        };
      }

      if (tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__ENABLE_NEGOTIATION]) {
        if (
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED]
        ) {
          // Update the offer quantity distibution for held quantity only
          this.offerService.updateOfferQuantityDistribution(
            offer,
            0, //purchasedQuantity
            tradeOrder[OrderKeys.QUANTITY],
            false, //initiateHold
          );
        }

        // Update Offer workflow instance in Workflow-API with updated quantity
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          offer[OfferKeys.ID], // workflow instance ID,
          undefined, // functionName,
          undefined, // typeFunctionUser,
          undefined, // nextState = undefined (no change of state, it should remain SUBMITTED)
          offer,
        );

        const latestNegotiation: INegotiation =
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__NEGOTIATIONS]?.[0];

        if (
          latestNegotiation &&
          !latestNegotiation.rejectedBy?.includes(user[UserKeys.USER_ID])
        ) {
          latestNegotiation.rejectedBy.push(user[UserKeys.USER_ID]);
        }

        if (latestNegotiation?.acceptedBy?.includes(user[UserKeys.USER_ID])) {
          latestNegotiation.acceptedBy = latestNegotiation.acceptedBy.filter(
            (x) => x !== user[UserKeys.USER_ID],
          );
        }
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        tradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // rejectTradeOrder
      );

      // Retrieve delivery token data
      const deliveryHoldId: string =
        this.retrieveDvpDeliveryHoldIdIfPossible(tradeOrder);

      if (!deliveryHoldId) {
        // In case hold has not already been created, no need to send a transaction to release the hold

        // Update trade order in Workflow-API
        const newTradeOrder = {
          ...tradeOrder,
          [OrderKeys.DATA]: {
            ...tradeOrder[OrderKeys.DATA],
            [OrderKeys.COMMENT]: comment,
            ...data,
          },
        };
        const updatedTradeOrder: Order =
          await this.workflowService.updateWorkflowInstance(
            tenantId,
            tradeOrder[OrderKeys.ID],
            functionName,
            typeFunctionUser,
            nextState,
            newTradeOrder,
          );

        if (sendNotification) {
          if (tradeOrder[OrderKeys.STATE] === 'submitted') {
            if (user[UserKeys.USER_ID] === issuer[UserKeys.USER_ID]) {
              this.apiMailingCallService.notifySenderSubmittedTradeOrderRejected(
                tenantId,
                issuer,
                sender,
                tradeOrder,
                token,
                authToken,
              );
            } else if (user[UserKeys.USER_ID] === sender[UserKeys.USER_ID]) {
              this.apiMailingCallService.notifyRecipientApprovedTradeOrderRejected(
                tenantId,
                sender,
                recipient,
                tradeOrder,
                token,
                tradeOrder[OrderKeys.ASSET_CLASS],
                comment,
                authToken,
              );
            }
          } else if (tradeOrder[OrderKeys.STATE] === 'approved') {
            this.apiMailingCallService.notifyIssuerSubmittedTradeOrderRejected(
              tenantId,
              issuer,
              sender,
              recipient,
              tradeOrder,
              token,
              authToken,
            );
            if (user[UserKeys.USER_ID] === recipient[UserKeys.USER_ID]) {
              this.apiMailingCallService.notifySenderApprovedTradeOrderRejected(
                tenantId,
                sender,
                recipient,
                tradeOrder,
                token,
                authToken,
              );

              if (agent) {
                this.apiMailingCallService.notifyAgentApprovedTradeOrderRejected(
                  tenantId,
                  agent,
                  recipient,
                  tradeOrder,
                  token,
                  authToken,
                );
              }
            }
          } else if (tradeOrder[OrderKeys.STATE] === 'negotiating') {
            if (
              tradeOrder[OrderKeys.DATA]?.[
                OrderKeys.DATA__NEGOTIATION_HOLD_REQUESTED
              ] &&
              !tradeOrder[OrderKeys.DATA]?.[
                OrderKeys.DATA__NEGOTIATION_HOLD_GRANTED
              ] &&
              user[UserKeys.USER_ID] === tradeOrder[OrderKeys.USER_ID]
            ) {
              // only when negotiation hold is requested and not granted yet by seller and
              // the caller is seller itself, the email notification for hold rejected will
              // be sent
              this.apiMailingCallService.notifyRecipientNegotiationHoldRejected(
                tenantId,
                sender,
                recipient,
                tradeOrder,
                token,
                tradeOrder[OrderKeys.ASSET_CLASS],
                comment,
                authToken,
              );
            } else {
              // we can safely assume the caller is either the buyer or seller of the negotiation-enabled
              // order by the checking we ran at the beginning of this function
              const counterParty =
                user[UserKeys.USER_ID] === tradeOrder[OrderKeys.USER_ID]
                  ? sender
                  : recipient;
              const emailRecipient =
                user[UserKeys.USER_ID] === tradeOrder[OrderKeys.USER_ID]
                  ? recipient
                  : sender;

              this.apiMailingCallService.notifyRecipientApprovedTradeOrderRejected(
                tenantId,
                counterParty,
                emailRecipient,
                tradeOrder,
                token,
                tradeOrder[OrderKeys.ASSET_CLASS],
                comment,
                authToken,
              );
            }
          }
        }

        return {
          order: updatedTradeOrder,
          updated: true,
          transactionId: '',
          message: `Trade order ${
            updatedTradeOrder[OrderKeys.ID]
          } updated successfully (rejected off-chain by ${
            user[UserKeys.USER_ID] === issuer[UserKeys.USER_ID]
              ? 'issuer'
              : 'recipient'
          })`,
        };
      }

      if (user[UserKeys.USER_ID] === sender[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `sender can not reject order because token hold has already been created (${deliveryHoldId}): transaction would revert if he'd try to release the hold`,
        );
      }

      const userWallet: Wallet =
        this.walletService.extractWalletFromUserEntityLink(user, userTokenLink);

      // ==> Step2: Send the transaction

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
      await this.apiSCCallService.retrieveHoldIfExisting(
        callerId,
        ethService,
        deliveryHoldId,
        token[TokenKeys.DEFAULT_DEPLOYMENT],
        false, // check token hold value
        0,
      );

      const releaseHoldResponse: ApiSCResponse =
        await this.apiSCCallService.releaseHold(
          tenantId,
          callerId,
          user, // signer
          deliveryHoldId,
          token[TokenKeys.DEFAULT_DEPLOYMENT],
          userWallet[WalletKeys.WALLET_ADDRESS],
          ethService,
          authToken,
          config,
        );
      const transactionId =
        releaseHoldResponse[ApiSCResponseKeys.TX_IDENTIFIER];

      // ==> Step3: Save transaction info in off-chain databases

      const updatedData: any = {
        ...this.transactionHelperService.addPendingTxToData(
          tradeOrder[OrderKeys.DATA],
          user[UserKeys.USER_ID],
          userWallet,
          nextState,
          transactionId,
          ethService,
          releaseHoldResponse[ApiSCResponseKeys.TX_SERIALIZED],
          releaseHoldResponse[ApiSCResponseKeys.TX],
        ),
      };

      // Update trade order in Workflow-API
      const newTradeOrder = {
        ...tradeOrder,
        [OrderKeys.DATA]: {
          ...updatedData,
          [OrderKeys.COMMENT]: comment,
          ...data,
        },
      };
      const updatedTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          tradeOrder[OrderKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newTradeOrder,
        );

      const approvalMessage = `Trade order rejection, including release of token hold of ${
        tradeOrder[OrderKeys.QUANTITY]
      } issued token(s), for investor ${sender[UserKeys.USER_ID]}`;

      // Define hook callbacks to trigger after transaction validation
      const hookCallbackData: HookCallBack = {
        [HookKeys.FUNCTION_NAME]: functionName,
        [HookKeys.TYPE_FUNCTION_USER]: typeFunctionUser,
        [HookKeys.EMAIL_FUNCTIONS]: [], // No email is sent
        [HookKeys.USERS_TO_REFRESH]: [
          callerId,
          user[UserKeys.USER_ID],
          sender[UserKeys.USER_ID],
          recipient[UserKeys.USER_ID],
        ],
        [HookKeys.TOKEN_ID]: token[TokenKeys.TOKEN_ID],
        [HookKeys.ETH_SERVICE]: ethService,
        [HookKeys.NEXT_STATE]: nextState,
        [HookKeys.WALLET]: userWallet,
        [HookKeys.RESPONSE_PENDING]: `${approvalMessage}, has been succesfully requested (transaction ${
          ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
            ? 'crafted'
            : 'sent'
        })`,
        [HookKeys.RESPONSE_VALIDATED]: `${approvalMessage}, succeeded`,
        [HookKeys.RESPONSE_FAILURE]: `${approvalMessage}, failed`,
        [HookKeys.CALL]: {
          [HookKeys.CALL_PATH]:
            releaseHoldResponse[ApiSCResponseKeys.CALL_PATH],
          [HookKeys.CALL_BODY]:
            releaseHoldResponse[ApiSCResponseKeys.CALL_BODY],
        },
        [HookKeys.RAW_TRANSACTION]: releaseHoldResponse[ApiSCResponseKeys.TX],
        [HookKeys.ACTION]: updatedTradeOrder,
        [HookKeys.TOKEN_CATEGORY]: tokenCategory,
        [HookKeys.CALLER_ID]: callerId,
        [HookKeys.USER_ID]: user[UserKeys.USER_ID],
        [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
        [HookKeys.AUTH_TOKEN]: authToken,
      };

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransaction(
        tenantId,
        user[UserKeys.USER_ID],
        callerId,
        transactionId,
        hookCallbackData,
        asyncTx,
      );

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: updatedTradeOrder,
          updated: true,
          transactionId: transactionId,
          message: hookCallbackData[HookKeys.RESPONSE_PENDING],
        };
      } else {
        // Synchronous transaction - Transaction is already validated

        const response = await this.orderService.order_hook(
          tenantId,
          hookCallbackData,
          transactionId,
          TxStatus.VALIDATED,
        );
        return {
          order: response.order,
          updated: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting trade order',
        'rejectTradeOrder',
        false,
        500,
      );
    }
  }

  async linkDVPUserWithToken(
    tenantId: string,
    dvpUserType: DvpUserType,
    tradeOrder: Order,
    token: Token,
  ): Promise<User> {
    try {
      let dvpUser;
      let dvpUserData;
      let dvpUserDataId;
      let dvpUserDataEmail;

      if (dvpUserType === DvpUserType.SENDER) {
        dvpUserData =
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__DVP]?.[
            OrderKeys.DATA__DVP__SENDER
          ];
        dvpUserDataId = dvpUserData?.[OrderKeys.DATA__DVP__SENDER__ID];
        dvpUserDataEmail = dvpUserData?.[OrderKeys.DATA__DVP__SENDER__EMAIL];
      } else if (dvpUserType === DvpUserType.RECIPIENT) {
        dvpUserData =
          tradeOrder[OrderKeys.DATA]?.[OrderKeys.DATA__DVP]?.[
            OrderKeys.DATA__DVP__RECIPIENT
          ];
        dvpUserDataId = dvpUserData?.[OrderKeys.DATA__DVP__RECIPIENT__ID];
        dvpUserDataEmail = dvpUserData?.[OrderKeys.DATA__DVP__RECIPIENT__EMAIL];
      } else {
        ErrorService.throwError(`invalid 'dvpParty': ${dvpUserType}`);
      }

      if (dvpUserDataId) {
        dvpUser = await this.apiEntityCallService.fetchEntity(
          tenantId,
          dvpUserDataId,
          true,
        );

        const dvpUserWallet: Wallet = this.walletService.extractWalletFromUser(
          dvpUser,
          dvpUser[UserKeys.DEFAULT_WALLET],
        );

        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // Exception: not "typeFunctionUser" here because only an ISSUER shall be able to invite an investor, and "typeFunctionUser" = INVESTOR
          undefined, // idFunctionUser
          dvpUser,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          tradeOrder[OrderKeys.ASSET_CLASS],
          dvpUserWallet,
        );
      } else if (dvpUserDataEmail) {
        const { user } = await this.userCreationService.createLinkedUser(
          tenantId,
          dvpUserDataEmail,
          undefined, // firstName
          undefined, // lastName
          undefined, // authId
          undefined, // userType
          undefined, // docuSignId
          undefined, // kycTemplateId
          UserType.INVESTOR, // userType
          EntityType.TOKEN, // entityType
          tradeOrder[OrderKeys.ENTITY_ID], // entityId
          tradeOrder[OrderKeys.ASSET_CLASS], // assetClassKey
          false, // auth0UserCreate (not required, as we don't need to create user in auth0 for now)
          undefined, // auth0UserPassword (not required, as we don't need to create user in auth0 for now)
          {}, // data
        );
        dvpUser = user;
      } else {
        ErrorService.throwError(
          `Trade order with ID ${tradeOrder[OrderKeys.ID]} is invalid, ${
            dvpUserType === DvpUserType.SENDER
              ? 'senderId/senderEmail'
              : 'recipientId/recipientEmail'
          } cannot be both empty`,
        );
      }

      return dvpUser;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'linking dvp user with token',
        'linkDVPUserWithToken',
        false,
        500,
      );
    }
  }

  extractUserIdFromOrder(dvpUserType: DvpUserType, tradeOrder: Order): string {
    try {
      if (dvpUserType === DvpUserType.SENDER) {
        return (
          tradeOrder[OrderKeys.USER_ID] ||
          tradeOrder?.[OrderKeys.DATA]?.[OrderKeys.DATA__DVP]?.[
            OrderKeys.DATA__DVP__SENDER
          ]?.[OrderKeys.DATA__DVP__SENDER__ID]
        );
      } else if (dvpUserType === DvpUserType.RECIPIENT) {
        return (
          tradeOrder[OrderKeys.RECIPIENT_ID] ||
          tradeOrder?.[OrderKeys.DATA]?.[OrderKeys.DATA__DVP]?.[
            OrderKeys.DATA__DVP__RECIPIENT
          ]?.[OrderKeys.DATA__DVP__RECIPIENT__ID]
        );
      } else {
        ErrorService.throwError(`invalid 'dvpParty': ${dvpUserType}`);
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'extracting userId from order',
        'extractUserIdFromOrder',
        false,
        500,
      );
    }
  }

  retrieveDvpType(tradeOrder: Order): DvpType {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__TYPE
          ]
        )
      ) {
        ErrorService.throwError(
          `invalid trade order data: does not contain DVP type (${DvpType.ATOMIC} | ${DvpType.NON_ATOMIC})`,
        );
      }

      const dvpType: DvpType =
        tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
          OrderKeys.DATA__DVP__TYPE
        ];
      this.checkDvpTypeIsValid(dvpType);

      return dvpType;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp type',
        'retrieveDvpType',
        false,
        500,
      );
    }
  }

  checkDvpTypeIsValid(dvpType: DvpType): boolean {
    try {
      if (dvpType !== DvpType.ATOMIC && dvpType !== DvpType.NON_ATOMIC) {
        ErrorService.throwError(
          `invalid dvpType (${dvpType}): shall be chosen amongst ${DvpType.ATOMIC} and ${DvpType.NON_ATOMIC}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking dvp type validity',
        'checkDvpTypeIsValid',
        false,
        500,
      );
    }
  }

  checkPaymentTokenParameters(
    dvpType: DvpType,
    paymentTokenAddess: string,
    paymentTokenStandard: SmartContract,
  ): boolean {
    try {
      if (dvpType === DvpType.ATOMIC) {
        if (!paymentTokenAddess) {
          ErrorService.throwError(
            'missing parameter: paymentTokenAddess needs to be provided for atomic DVP trades',
          );
        }
        if (!paymentTokenStandard) {
          ErrorService.throwError(
            'missing parameter: paymentTokenStandard needs to be provided for atomic DVP trades',
          );
        } else {
          // Check if token standard of payment token is valid
          this.tokenHelperService.retrieveTokenStandardAsNumber(
            paymentTokenStandard,
          );
        }
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking payment token parameters',
        'checkPaymentTokenParameters',
        false,
        500,
      );
    }
  }

  checkSenderAndRecipientValidity(sender: User, recipient: User): boolean {
    try {
      const validSenderOrRecipientTypes: Array<UserType> = [
        UserType.INVESTOR,
        UserType.UNDERWRITER,
      ];
      if (!sender && !recipient) {
        ErrorService.throwError(
          'shall never happen: both counter parties (sender and recipient) are undefined',
        );
      } else if (
        sender &&
        validSenderOrRecipientTypes.indexOf(sender[UserKeys.USER_TYPE]) === -1
      ) {
        ErrorService.throwError(
          `invalid sender: sender's userType shall be chosen amongst ${JSON.stringify(
            validSenderOrRecipientTypes,
          )} (${sender[UserKeys.USER_TYPE]} instead)`,
        );
      } else if (
        recipient &&
        validSenderOrRecipientTypes.indexOf(recipient[UserKeys.USER_TYPE]) ===
          -1
      ) {
        ErrorService.throwError(
          `invalid recipient: recipient's userType shall be chosen amongst ${JSON.stringify(
            validSenderOrRecipientTypes,
          )} (${recipient[UserKeys.USER_TYPE]} instead)`,
        );
      }

      if (
        sender &&
        recipient &&
        recipient[UserKeys.USER_ID] === sender[UserKeys.USER_ID]
      ) {
        ErrorService.throwError(
          `Error: sender(${sender[UserKeys.USER_ID]}) & recipient(${
            recipient[UserKeys.USER_ID]
          }) can't be same)`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking sender and recipient validity',
        'checkSenderAndRecipientValidity',
        false,
        500,
      );
    }
  }

  retrieveDvpDeliveryHoldIdIfPossible(tradeOrder: Order): string {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ][OrderKeys.DATA__DVP__DELIVERY__HOLD_ID]
        )
      ) {
        return undefined;
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__DELIVERY
      ][OrderKeys.DATA__DVP__DELIVERY__HOLD_ID];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp delivery hold ID',
        'retrieveDvpDeliveryHoldId',
        false,
        500,
      );
    }
  }

  retrieveDvpDeliveryHoldId(tradeOrder: Order): string {
    try {
      const holdId = this.retrieveDvpDeliveryHoldIdIfPossible(tradeOrder);

      if (!holdId) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP delivery hold ID',
        );
      }

      return holdId;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp delivery hold ID',
        'retrieveDvpDeliveryHoldId',
        false,
        500,
      );
    }
  }

  retrieveDvpDeliveryTokenAddress(tradeOrder: Order): string {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ][OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP delivery token address',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__DELIVERY
      ][OrderKeys.DATA__DVP__DELIVERY__TOKEN_ADDRESS];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp delivery token address',
        'retrieveDvpDeliveryTokenAddress',
        false,
        500,
      );
    }
  }

  retrieveDvpDeliveryTokenStandard(tradeOrder: Order): SmartContract {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__DELIVERY
          ][OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP delivery token standard',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__DELIVERY
      ][OrderKeys.DATA__DVP__DELIVERY__TOKEN_STANDARD];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp delivery token standard',
        'retrieveDvpDeliveryTokenStandard',
        false,
        500,
      );
    }
  }

  retrieveDvpPaymentHoldId(tradeOrder: Order): string {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ][OrderKeys.DATA__DVP__PAYMENT__HOLD_ID]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP payment hold ID',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__PAYMENT
      ][OrderKeys.DATA__DVP__PAYMENT__HOLD_ID];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp payment hold ID',
        'retrieveDvpPaymentHoldId',
        false,
        500,
      );
    }
  }

  retrieveDvpPaymentTokenAddress(tradeOrder: Order): string {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP payment token address',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__PAYMENT
      ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_ADDRESS];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp payment token address',
        'retrieveDvpPaymentTokenAddress',
        false,
        500,
      );
    }
  }

  retrieveDvpPaymentTokenStandard(tradeOrder: Order): SmartContract {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__PAYMENT
          ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP payment token standard',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__PAYMENT
      ][OrderKeys.DATA__DVP__PAYMENT__TOKEN_STANDARD];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp payment token standard',
        'retrieveDvpPaymentTokenStandard',
        false,
        500,
      );
    }
  }

  retrieveDvpHTLC(tradeOrder: Order): HTLC {
    try {
      if (
        !(
          tradeOrder &&
          tradeOrder[OrderKeys.DATA] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP] &&
          tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
            OrderKeys.DATA__DVP__HTLC
          ]
        )
      ) {
        ErrorService.throwError(
          'invalid trade order data: does not contain DVP HTLC',
        );
      }

      return tradeOrder[OrderKeys.DATA][OrderKeys.DATA__DVP][
        OrderKeys.DATA__DVP__HTLC
      ];
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'retrieving dvp payment HTLC',
        'retrieveDvpHTLC',
        false,
        500,
      );
    }
  }

  checkOrderTypeIsValid(orderType: OrderType): boolean {
    try {
      if (orderType !== OrderType.QUANTITY && orderType !== OrderType.AMOUNT) {
        ErrorService.throwError(`invalid order type ${OrderType}`);
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking order category validity',
        'checkOrderTypeIsValid',
        false,
        500,
      );
    }
  }

  checkOrderSideIsValid(orderSide: OrderSide): boolean {
    try {
      if (orderSide !== OrderSide.SELL && orderSide !== OrderSide.BUY) {
        ErrorService.throwError(
          `invalid orderSide (${orderSide}): shall be chosen amongst ${OrderSide.SELL} and ${OrderSide.BUY}`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking order side validity',
        'checkOrderSideIsValid',
        false,
        500,
      );
    }
  }

  checkOrderQuantityAndPriceAreValid(
    orderQuantity: number,
    orderAmount: number,
  ): boolean {
    try {
      if (!orderQuantity) {
        ErrorService.throwError('missing order quantity');
      }
      if (typeof orderAmount === 'undefined') {
        ErrorService.throwError('missing order amount');
      }

      checkIntegerFormat(orderQuantity, orderAmount);

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking order quantity and amount are valid',
        'checkOrderQuantityAndPriceAreValid',
        false,
        500,
      );
    }
  }

  checkIfOnChainPayment(order: Order): boolean {
    if (
      order[OrderKeys.DATA][OrderKeys.DATA__DVP][OrderKeys.DATA__DVP__PAYMENT]
    ) {
      return true;
    }
    return false;
  }
}
