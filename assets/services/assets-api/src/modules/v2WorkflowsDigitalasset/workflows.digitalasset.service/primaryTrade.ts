/**
 * FUND SUBSCRIPTION WORKFLOW
 *
 * -- On-chain order-workflow --
 *
 * The fund subscription workflow allows an investor to purchase new tokens:
 *  1) Creating a subscription order off-chain
 *  2) Accepting/rejecting order off-chain
 *  3) Creating tokens associated to order on-chain
 *
 *  createSubsOrder   ____________  receivePayment  __________  settleOrder  _____________
 *         -->       | SUBSCRIBED |      -->       |   PAID   |      -->    | PAIDSETTLED |
 *      [issuer]      ------------     [issuer]     ----------    [issuer]   -------------
 *
 */
import {
  TokenIdentifierEnum,
  CycleEnum,
  WorkflowInstanceEnum,
  WorkflowTemplateEnum,
} from 'src/old/constants/enum';

import { keys as TokenKeys, Token } from 'src/types/token';
import ErrorService from 'src/utils/errorService';
import { keys as UserKeys, User, UserType } from 'src/types/user';

import WorkflowMiddleWare from 'src/old/services/middlewares/workflowMiddleware';

import { LinkService } from 'src/modules/v2Link/link.service';
import { WalletService } from 'src/modules/v2Wallet/wallet.service';
import { EthHelperService } from 'src/modules/v2Eth/eth.service';
import { TransactionHelperService } from 'src/modules/v2Transaction/transaction.service';
import { Injectable } from '@nestjs/common';
import {
  SettlePrimaryTradeOrderBatchOutput,
  CreatePrimaryTradeOrderOutput,
  ReceivePaymentPrimaryTradeOutput,
  SettlePrimaryTradeOrderOutput,
  RejectPrimaryTradeOrderOutput,
  CancelPrimaryTradeOrderOutput,
} from '../workflows.digitalasset.dto';

import { FunctionName, TokenCategory } from 'src/types/smartContract';
import {
  IOrderTransaction,
  keys as OrderKeys,
  OrderType,
  WorkflowInstance,
  PrimaryTradeType,
  OrderSide,
} from 'src/types/workflow/workflowInstances';
import {
  ClassData,
  SubscriptionRules,
  ClassDataKeys,
  AssetClassRule,
  assetClassRules,
} from 'src/types/asset';
import {
  ApiWorkflowWorkflowInstanceService,
  ApiWorkflowWorkflowTemplateService,
} from 'src/modules/v2ApiCall/api.call.service/workflow';
import { ApiWorkflowTransactionService } from 'src/modules/v2ApiCall/api.call.service/transactions';

import { EntityType } from 'src/types/entity';

import { WorkflowType } from 'src/types/workflow/workflowInstances';
import { TokenTxHelperService } from 'src/modules/v2Transaction/transaction.service/token';
import {
  checkIntegerFormat,
  MAX_SUPPORTED_INTEGER,
  MIN_SUPPORTED_INTEGER,
} from 'src/utils/number';
import {
  keys as CycleKeys,
  AssetCycleTemplate,
  PaymentOption,
  AssetCycleInstance,
  CycleStatus,
} from 'src/types/asset/cycle';
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
import { keys as FeeKeys } from 'src/types/fees';
import { NavService } from 'src/modules/v2Nav/nav.service';
import { FeesService } from 'src/modules/v2Fees/fees.service';
import { CycleService } from 'src/modules/v2Cycle/cycle.service';
import { AssetDataService } from 'src/modules/v2AssetData/asset.data.service';
import { BalanceService } from 'src/modules/v2Balance/balance.service';
import { NAV } from 'src/types/workflow/workflowInstances/nav';
import {
  CreateLinkOutput,
  Link,
} from 'src/types/workflow/workflowInstances/link';
import { Order } from 'src/types/workflow/workflowInstances/order';
import { AssetType } from 'src/types/asset/template';
import { OrderHelperService } from 'src/modules/v2Order/order.service/helper';
import { ApiMailingCallService } from 'src/modules/v2ApiCall/api.call.service/mailing';
import { Config } from 'src/types/config';
import { ConfigService } from 'src/modules/v2Config/config.service';
import { hasDistinct } from 'src/utils/arrayUtils';
import { Action } from 'src/types/workflow/workflowInstances/action';
import { getEnumValues } from 'src/utils/enumUtils';
import { craftExpectedDateLabel } from 'src/utils/date';
import { ActionService } from 'src/modules/v2Action/action.service';
import { ApiEntityCallService } from 'src/modules/v2ApiCall/api.call.service/entity';

const TYPE_WORKFLOW_NAME = WorkflowName.ASSET_PRIMARY_TRADE;

@Injectable()
export class WorkFlowsPrimaryTradeService {
  constructor(
    private readonly transactionHelperService: TransactionHelperService,
    private readonly tokenTxHelperService: TokenTxHelperService,
    private readonly apiMetadataCallService: ApiMetadataCallService,
    private readonly apiEntityCallService: ApiEntityCallService,
    private readonly workflowService: ApiWorkflowWorkflowInstanceService,
    private readonly workflowTemplateService: ApiWorkflowWorkflowTemplateService,
    private readonly transactionService: ApiWorkflowTransactionService,
    private readonly apiMailingCallService: ApiMailingCallService,
    private readonly linkService: LinkService,
    private readonly walletService: WalletService,
    private readonly ethHelperService: EthHelperService,
    private readonly assetDataService: AssetDataService,
    private readonly cycleService: CycleService,
    private readonly orderHelperService: OrderHelperService,
    private readonly navService: NavService,
    private readonly feesService: FeesService,
    private readonly configService: ConfigService,
    private readonly balanceService: BalanceService,
    private readonly actionHelperService: ActionService,
  ) {}

  /**
   * [Create primary trade order]
   *
   * This function can only be called by an investor.
   * It starts a new order-workflow (asset primary trade).
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: NOT_STARTED
   *  - Destination state: SUBSCRIBED
   */
  async createPrimaryTradeOrder(
    tenantId: string,
    idempotencyKey: string,
    typeFunctionUser: UserType,
    investorId: string,
    tokenId: string,
    assetClassKey: string,
    orderType: OrderType,
    orderQuantity: number,
    orderAmount: number,
    tradeType: PrimaryTradeType,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CreatePrimaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.CREATE_PRIMARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const [issuer, investor, token, orderWithSameKey, config]: [
        User,
        User,
        Token,
        Order,
        Config,
      ] = await Promise.all([
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
          message:
            'Primary trade order creation was already done (idempotencyKey)',
        };
      }

      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);

      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);
      let subscriptionRules: SubscriptionRules;
      if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf(
          ClassDataKeys.RULES,
        ) > -1
      ) {
        subscriptionRules = this.assetDataService.retrieveAssetClassRules(
          assetClassData,
          assetClassKey,
        );
      }

      // ==> Step1: Perform several checks before sending the transaction

      if (orderType === OrderType.QUANTITY) {
        if (!orderQuantity) {
          ErrorService.throwError('missing order quantity');
        }
      } else if (orderType === OrderType.AMOUNT) {
        if (typeof orderAmount === 'undefined') {
          ErrorService.throwError('missing order amount');
        }
      } else {
        ErrorService.throwError(`invalid order type ${orderType}`);
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      checkIntegerFormat(
        orderType === OrderType.QUANTITY ? orderQuantity : 1,
        orderType === OrderType.AMOUNT ? orderAmount : 1,
      );

      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // createPrimaryTradeOrder
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      if (getEnumValues(PrimaryTradeType).indexOf(tradeType) === -1) {
        ErrorService.throwError(
          `invalid trade type "${tradeType}" (shall be chosen amongst ${PrimaryTradeType.SUBSCRIPTION} and ${PrimaryTradeType.REDEMPTION})`,
        );
      }

      let assetCycle: AssetCycleInstance;
      if (assetClassRules[assetType][AssetClassRule.HAS_CYCLES]) {
        // Check if cycle exists. If not, create one
        assetCycle = await this.cycleService.retrieveOrCreateCurrentCycle(
          tenantId,
          token[TokenKeys.TOKEN_ID],
          assetType,
          assetClassData,
          tradeType,
        );

        if (!assetCycle) {
          ErrorService.throwError(
            `no ${tradeType} cycle was found for ${assetType} asset with ID ${
              token[TokenKeys.TOKEN_ID]
            }`,
          );
        }
        const currentDate: Date = new Date();
        const cycleEndDate: Date = new Date(assetCycle[CycleKeys.END_DATE]);
        if (assetCycle[CycleKeys.STATUS] === CycleStatus.NOT_STARTED) {
          ErrorService.throwError(
            `${tradeType}s havent started yet, please wait until ${this.cycleService.retrieveCycleDate(
              assetCycle,
              CycleKeys.START_DATE,
            )} to create your order`,
          );
        } else if (
          assetCycle[CycleKeys.STATUS] === CycleStatus.SUBSCRIPTION_ENDED
        ) {
          let subscriptionsClosedErrorMessage: string;

          const initialCycleName =
            tradeType === PrimaryTradeType.REDEMPTION
              ? ClassDataKeys.INITIAL_REDEMPTION
              : ClassDataKeys.INITIAL_SUBSCRIPTION;

          const subsequentCycleName =
            tradeType === PrimaryTradeType.REDEMPTION
              ? ClassDataKeys.REDEMPTION
              : ClassDataKeys.SUBSCRIPTION;

          if (
            assetType === AssetType.CLOSED_END_FUND ||
            assetType === AssetType.FIXED_RATE_BOND
          ) {
            let cycleType: string;
            if (
              assetClassData[subsequentCycleName] &&
              assetClassData[subsequentCycleName][
                CycleKeys.TEMPLATE_FIRST_START_DATE
              ] &&
              assetCycle[CycleKeys.START_DATE] &&
              assetClassData[subsequentCycleName][
                CycleKeys.TEMPLATE_FIRST_START_DATE
              ].getTime() ===
                new Date(assetCycle[CycleKeys.START_DATE]).getTime()
            ) {
              cycleType = 'Subsequent';
            } else if (
              assetClassData[initialCycleName] &&
              assetClassData[initialCycleName][
                CycleKeys.TEMPLATE_FIRST_START_DATE
              ] &&
              assetCycle[CycleKeys.START_DATE] &&
              assetClassData[initialCycleName][
                CycleKeys.TEMPLATE_FIRST_START_DATE
              ].getTime() ===
                new Date(assetCycle[CycleKeys.START_DATE]).getTime()
            ) {
              cycleType = 'Initial';
            } else {
              ErrorService.throwError(
                `shall never happen: invalid cycle ${
                  assetCycle[CycleKeys.CYCLE_ID]
                } (neither initial nor subsequent cycle)`,
              );
            }

            const nbSecond: number =
              currentDate.getTime() - cycleEndDate.getTime();
            subscriptionsClosedErrorMessage = `${cycleType} ${tradeType} are over since ${cycleEndDate} - ${
              nbSecond / 1000
            }s ago (cycle with ID ${
              assetCycle[CycleKeys.CYCLE_ID]
            } has status ${assetCycle[CycleKeys.STATUS]})`;
          } else if (assetType === AssetType.OPEN_END_FUND) {
            subscriptionsClosedErrorMessage = `${tradeType} are currently closed, please wait until ${this.cycleService.retrieveNextCycleStartDate(
              assetCycle,
              assetClassData[subsequentCycleName][
                CycleKeys.TEMPLATE_RECURRENCE
              ],
            )} to create your order`;
          } else {
            const nbSecond: number =
              currentDate.getTime() - cycleEndDate.getTime();
            subscriptionsClosedErrorMessage = `${tradeType}s are over since ${cycleEndDate} - ${
              nbSecond / 1000
            }s ago (cycle with ID ${
              assetCycle[CycleKeys.CYCLE_ID]
            } has status ${assetCycle[CycleKeys.STATUS]})`;
          }
          ErrorService.throwError(subscriptionsClosedErrorMessage);
        } else if (
          assetCycle[CycleKeys.STATUS] !== CycleStatus.SUBSCRIPTION_STARTED
        ) {
          ErrorService.throwError(
            `invalid asset cycle status: ${assetCycle[CycleKeys.STATUS]}`,
          );
        }
      }

      // ------------- Format all input data (end) -------------

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        undefined, // workflow instance ID
        typeFunctionUser,
        functionName, // createPrimaryTradeOrder
      );

      let investorWallet: Wallet = this.walletService.extractWalletFromUser(
        investor,
        investor[UserKeys.DEFAULT_WALLET],
      );

      const linkCreation: CreateLinkOutput =
        await this.linkService.createUserEntityLinkIfRequired(
          tenantId,
          UserType.ISSUER, // typeFunctionUser
          undefined, // idFunctionUser
          investor,
          FunctionName.KYC_INVITE,
          EntityType.TOKEN,
          undefined, // entityProject
          undefined, // entityIssuer
          token, // entityToken
          assetClassKey,
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

      if (tradeType === PrimaryTradeType.REDEMPTION) {
        await this.balanceService.checkTokenOwnership(
          tenantId,
          tokenCategory,
          investorId,
          investorWallet,
          token,
          tokenState,
          assetClassKey,
          undefined, // tokenIdentifier
          orderQuantity,
          true,
        );
      } else if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf(
          ClassDataKeys.RULES,
        ) > -1
      ) {
        await this.orderHelperService.checkOrderIsValid(
          tenantId,
          assetClassKey,
          subscriptionRules,
          assetCycle?.[CycleKeys.CYCLE_ID],
          orderType,
          orderQuantity,
          orderAmount,
        );
      }

      let orderSide: OrderSide;

      if (tradeType === PrimaryTradeType.SUBSCRIPTION) {
        orderSide = OrderSide.BUY;
      } else if (tradeType === PrimaryTradeType.REDEMPTION) {
        orderSide = OrderSide.SELL;
      }

      // Create workflow instance in Workflow-API
      const primaryTradeWorkflowId: number = (
        await this.workflowTemplateService.retrieveWorkflowTemplate(
          tenantId,
          WorkflowTemplateEnum.name,
          undefined,
          TYPE_WORKFLOW_NAME,
        )
      )[WorkflowTemplateKeys.ID];
      const primaryTradeOrder: Order =
        await this.workflowService.createWorkflowInstance(
          tenantId,
          idempotencyKey,
          WorkflowType.ACTION,
          functionName,
          typeFunctionUser,
          investor[UserKeys.USER_ID],
          token[TokenKeys.TOKEN_ID],
          EntityType.TOKEN,
          assetCycle?.[CycleKeys.CYCLE_ID], // objectId
          undefined, // recipientId
          undefined, // brokerId
          undefined, // agentId
          primaryTradeWorkflowId,
          orderQuantity, // quantity
          orderAmount, // price
          undefined, // documentId
          investorWallet[WalletKeys.WALLET_ADDRESS],
          assetClassKey, // assetClass
          new Date(),
          nextState, // FundSubscriptionWorkflow.SUBSCRIBED,
          undefined, //offerId
          orderSide,
          {
            ...data,
            [OrderKeys.DATA__ORDER_TYPE]: orderType,
            [OrderKeys.DATA__TRADE_TYPE]: tradeType,
          },
        );

      if (sendNotification && tradeType === PrimaryTradeType.SUBSCRIPTION) {
        this.apiMailingCallService.sendIssuerOrderCreatedNotification(
          tenantId,
          issuer,
          investor,
          token,
          primaryTradeOrder,
          authToken,
        );
      }

      return {
        order: primaryTradeOrder,
        created: true,
        message: `Primary ${tradeType} trade order ${
          primaryTradeOrder[OrderKeys.ID]
        } created successfully`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating primary trade order',
        'createPrimaryTradeOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Validate payment for primary trade order]
   *
   * This function can only be called by the issuer.
   * It can only be called for an order-workflow (issuance) in state SUBSCRIBED | UNPAIDSETTLED.
   * It allows to declare the investor's primary trade order as paid.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBSCRIBED | PAID
   *  - Destination state: UNPAIDSETTLED | PAIDSETTLED
   */
  async validatePayment(
    tenantId: string,
    callerId: string,
    user: User,
    orderId: string,
    paymentAmount: number,
    paymentId: string,
    forcePrice: number,
    data: any,
    sendNotification: boolean,
    authToken: string,
  ): Promise<ReceivePaymentPrimaryTradeOutput> {
    try {
      const typeFunctionUser: UserType = user[UserKeys.USER_TYPE];

      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.VALIDATE_PRIMARY_TRADE_ORDER_PAYMENT;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const primaryTradeOrder: Order =
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

      const cycleId: string =
        this.cycleService.retrieveCycleId(primaryTradeOrder);

      const [issuer, investor, token, cycle, config, investorTokenLink]: [
        User,
        User,
        Token,
        AssetCycleInstance,
        Config,
        Link,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          primaryTradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.apiMetadataCallService.retrieveCycle(
          tenantId,
          CycleEnum.cycleId,
          cycleId,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          primaryTradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          primaryTradeOrder[OrderKeys.ASSET_CLASS],
        ),
      ]);

      const tradeType =
        primaryTradeOrder[OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE];

      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);
      const assetClassKey: string = cycle[CycleKeys.ASSET_INSTANCE_CLASS_KEY];
      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);
      let subscriptionRules: SubscriptionRules;
      if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf(
          ClassDataKeys.RULES,
        ) > -1
      ) {
        subscriptionRules = this.assetDataService.retrieveAssetClassRules(
          assetClassData,
          assetClassKey,
        );
      }

      const nav: NAV = await this.navService.retrieveAppropriateNAVForCycle(
        tenantId,
        token[TokenKeys.TOKEN_ID],
        assetClassKey,
        cycle,
      );

      const [newOrderQuantity, newOrderAmount]: [number, number] =
        this.actionHelperService.craftWorkflowInstanceQuantityAndAmount(
          primaryTradeOrder,
          token,
          nav,
          forcePrice,
        );

      // ==> Step1: Perform several checks

      if (paymentAmount < newOrderAmount) {
        ErrorService.throwError(
          `payment amount too low (${paymentAmount}): shall be higher than order price, e.g. ${newOrderAmount}`,
        );
      }

      if (paymentId && paymentId !== primaryTradeOrder[OrderKeys.PAYMENT_ID]) {
        ErrorService.throwError(
          `provided paymentId (${paymentId}) is different from order's paymentId (${
            primaryTradeOrder[OrderKeys.PAYMENT_ID]
          }): THIS CHECK IS OPTIONAL`,
        );
      }

      if (user[UserKeys.USER_ID] !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided userId (${
            user[UserKeys.USER_ID]
          }) is not the issuer of the asset (${issuer[UserKeys.USER_ID]})`,
        );
      }

      this.checkPaymentCanBeExecuted(
        assetType,
        cycle,
        assetClassData,
        subscriptionRules,
      );

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // receivePrimaryTradeOrderPayment
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      // Idempotency
      if (
        primaryTradeOrder[OrderKeys.STATE] === 'paid' ||
        primaryTradeOrder[OrderKeys.STATE] === 'paidSettled'
      ) {
        // Order payment has already been done, return order without updating it (idempotency)
        return {
          order: primaryTradeOrder,
          updated: false,
          message: 'Primary trade order payment was already done',
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        primaryTradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // receivePrimaryTradeOrderPayment
      );

      if (tradeType === PrimaryTradeType.REDEMPTION) {
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
          assetClassKey,
          undefined, // tokenIdentifier
          primaryTradeOrder[OrderKeys.QUANTITY],
          true,
        );
      }

      // Update subscription order in Workflow-API
      const newPrimaryTradeOrder = {
        ...primaryTradeOrder,
        [OrderKeys.QUANTITY]: newOrderQuantity,
        [OrderKeys.PRICE]: newOrderAmount,
        [OrderKeys.DATA]: {
          ...primaryTradeOrder[OrderKeys.DATA],
          ...data,
        },
      };
      const updatedPrimaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          primaryTradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newPrimaryTradeOrder,
        );

      // Fetch investor custom fee
      const { fees = {} } = await this.feesService.retrieveTokenFees(
        tenantId,
        callerId,
        issuer,
        token[TokenKeys.TOKEN_ID],
        assetClassKey,
        investor[UserKeys.USER_ID],
      );

      if (sendNotification) {
        this.apiMailingCallService.sendInvestorOrderPaymentConfirmedNotification(
          tenantId,
          issuer,
          investor,
          token,
          primaryTradeOrder,
          fees[FeeKeys.ENTRY_ACQUIRED],
          authToken,
        );
      }

      return {
        order: updatedPrimaryTradeOrder,
        updated: true,
        message: `Primary ${tradeType} trade order ${
          newPrimaryTradeOrder[OrderKeys.ID]
        } updated successfully (payment confirmed)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'validating payment',
        'validatePayment',
        false,
        500,
      );
    }
  }

  async sendOrderSettlementTransaction(
    tenantId: string,
    primaryTradeOrder: Order,
    tradeType: PrimaryTradeType,
    functionName: FunctionName,
    issuer: User,
    investor: User,
    investorTokenLink: Link,
    token: Token,
    assetClassKey: string,
    tokenCategory: TokenCategory.HYBRID,
    tokenState: TokenState.ISSUED,
    issuerWallet: Wallet,
    ethService: EthService,
    nextState: string,
    callerId: string,
    config: Config,
    authToken: string,
  ): Promise<IOrderTransaction> {
    const investorWallet: Wallet =
      this.walletService.extractWalletFromUserEntityLink(
        investor,
        investorTokenLink,
      );

    let settlementResponse: ApiSCResponse;
    const tokenClass = assetClassKey;
    let body: any;
    if (tradeType === PrimaryTradeType.REDEMPTION) {
      await this.balanceService.checkTokenOwnership(
        tenantId,
        tokenCategory,
        callerId,
        investorWallet,
        token,
        tokenState,
        primaryTradeOrder[OrderKeys.ASSET_CLASS],
        undefined, // tokenIdentifier
        primaryTradeOrder[OrderKeys.QUANTITY],
        false,
      );

      const body = this.tokenTxHelperService.craftForceBurnBody(
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        tokenClass,
        primaryTradeOrder[OrderKeys.QUANTITY],
      );

      settlementResponse =
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
          FunctionName.FORCE_BURN, // forceBurn
          body,
          ethService,
          authToken,
          config,
        );
    } else {
      body = this.tokenTxHelperService.craftMintBody(
        tokenCategory,
        token,
        issuerWallet,
        investorWallet,
        tokenState,
        tokenClass,
        undefined, // tokenIdentifier
        primaryTradeOrder[OrderKeys.QUANTITY],
        undefined, // tokenUri
      );

      settlementResponse =
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
          functionName, // settlePrimaryTradeOrder
          body,
          ethService,
          authToken,
          config,
        );
    }

    const transactionId = settlementResponse[ApiSCResponseKeys.TX_IDENTIFIER];

    // ==> Step3: Save transaction info in off-chain databases

    const updatedData: any = {
      ...this.transactionHelperService.addPendingTxToData(
        primaryTradeOrder[OrderKeys.DATA],
        issuer[UserKeys.USER_ID],
        issuerWallet,
        nextState,
        transactionId,
        ethService,
        settlementResponse[ApiSCResponseKeys.TX_SERIALIZED],
        settlementResponse[ApiSCResponseKeys.TX],
      ),
    };

    const newPrimaryTradeOrder = {
      ...primaryTradeOrder,
      [OrderKeys.DATA]: updatedData,
    };

    return { newPrimaryTradeOrder, settlementResponse, transactionId };
  }

  craftHookCallbackData(
    primaryTradeOrder: Order,
    typeFunctionUser: UserType,
    functionName: FunctionName,
    investor: User,
    token: Token,
    issuerWallet: Wallet,
    ethService: EthService,
    nextState: string,
    callerId: string,
    userId: string,
    issuerId: string,
    settlementResponse: ApiSCResponse,
    updatedSubscriptionOrder: WorkflowInstance,
    tokenCategory: TokenCategory,
    authToken: string,
  ): HookCallBack {
    const settlementMessage = `Creation of ${
      primaryTradeOrder[OrderKeys.QUANTITY]
    } issued token(s) (settlement order), for investor ${
      investor[UserKeys.USER_ID]
    }`;

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
      [HookKeys.RESPONSE_PENDING]: `${settlementMessage}, has been successfully requested (transaction ${
        ethService[EthServiceKeys.TYPE] === EthServiceType.LEDGER
          ? 'crafted'
          : 'sent'
      })`,
      [HookKeys.RESPONSE_VALIDATED]: `${settlementMessage}, succeeded`,
      [HookKeys.RESPONSE_FAILURE]: `${settlementMessage}, failed`,
      [HookKeys.CALL]: {
        [HookKeys.CALL_PATH]: settlementResponse[ApiSCResponseKeys.CALL_PATH],
        [HookKeys.CALL_BODY]: settlementResponse[ApiSCResponseKeys.CALL_BODY],
      },
      [HookKeys.RAW_TRANSACTION]: settlementResponse[ApiSCResponseKeys.TX],
      [HookKeys.ACTION]: updatedSubscriptionOrder,
      [HookKeys.TOKEN_CATEGORY]: tokenCategory,
      [HookKeys.CALLER_ID]: callerId,
      [HookKeys.USER_ID]: userId,
      [HookKeys.SCHEDULED_ADDITIONAL_ACTION]: undefined,
      [HookKeys.AUTH_TOKEN]: authToken,
    };
    return hookCallbackData;
  }

  /**
   * [Settle order]
   *
   * This function can only be called by the issuer.
   * It can only be called for an order-workflow (issuance) in state SUBSCRIBED | PAID.
   * It allows to declare the investor's subscription order as paid.
   *
   * On-chain:
   *  - Transaction sent: "issueByPartition" function of token smart contract
   *  - Owner of delivery tokens after tx validation: the investor who created the subscription order
   *
   * Off-chain state machine:
   *  - Initial state: SUBSCRIBED | UNPAIDSETTLED
   *  - Destination state: PAID | PAIDSETTLED
   */
  async settleOrder(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    callerId: string,
    orderId: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<SettlePrimaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const tokenState: TokenState = TokenState.ISSUED;

      // Preliminary step: Fetch all required data in databases

      const primaryTradeOrder: Order =
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

      const tradeType =
        primaryTradeOrder[OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE];

      const functionName: FunctionName =
        tradeType === PrimaryTradeType.REDEMPTION
          ? FunctionName.SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER
          : FunctionName.SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER;

      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      const [
        issuer,
        issuerTokenLink,
        investor,
        investorTokenLink,
        token,
        config,
      ]: [User, Link, User, Link, Token, Config] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuerId,
          UserType.ISSUER,
          primaryTradeOrder[OrderKeys.ENTITY_ID], // tokenId
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.apiEntityCallService.fetchEntity(
          tenantId,
          primaryTradeOrder[OrderKeys.USER_ID],
          true,
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          primaryTradeOrder[OrderKeys.USER_ID],
          UserType.INVESTOR,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          EntityType.TOKEN,
          primaryTradeOrder[OrderKeys.ASSET_CLASS],
        ),
        this.apiMetadataCallService.retrieveTokenInDB(
          tenantId,
          TokenIdentifierEnum.tokenId,
          primaryTradeOrder[OrderKeys.ENTITY_ID],
          true,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const assetClassKey: string = primaryTradeOrder[OrderKeys.ASSET_CLASS];

      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);
      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);

      let subscriptionRules: SubscriptionRules;
      if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf(
          ClassDataKeys.RULES,
        ) > -1
      ) {
        subscriptionRules = this.assetDataService.retrieveAssetClassRules(
          assetClassData,
          assetClassKey,
        );
      }

      if (assetClassRules[assetType][AssetClassRule.HAS_CYCLES]) {
        const cycleId: string =
          this.cycleService.retrieveCycleId(primaryTradeOrder);
        const cycle = await this.apiMetadataCallService.retrieveCycle(
          tenantId,
          CycleEnum.cycleId,
          cycleId,
          undefined,
          undefined,
          true,
        );
        this.checkSettlementCanBeExecuted(cycle, subscriptionRules);
      }

      // ==> Step1: Perform several checks

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // settlePrimaryTradeOrder
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      const currentSubscriptionQuantity = primaryTradeOrder[OrderKeys.QUANTITY];
      const minGlobalSubscriptionQuantity: number = subscriptionRules?.[
        ClassDataKeys.RULES__MIN_GLOBAL_SUBS_QUANTITY
      ]
        ? subscriptionRules[ClassDataKeys.RULES__MIN_GLOBAL_SUBS_QUANTITY]
        : MIN_SUPPORTED_INTEGER;
      const maxGlobalSubscriptionQuantity: number = subscriptionRules?.[
        ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY
      ]
        ? subscriptionRules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY]
        : MAX_SUPPORTED_INTEGER;

      this.checkSubscriptionQuantity(
        currentSubscriptionQuantity,
        minGlobalSubscriptionQuantity,
        maxGlobalSubscriptionQuantity,
      );

      const settlementMessage = `Creation/destruction of ${
        primaryTradeOrder[OrderKeys.QUANTITY]
      } issued token(s) (settlement order), for investor ${
        investor[UserKeys.USER_ID]
      }`;

      // Idempotency
      const targetState1 = 'paidSettled';
      const targetState2 = 'unpaidSettled';
      const txStatus1 = this.transactionHelperService.retrieveTxStatusInData(
        primaryTradeOrder[OrderKeys.DATA],
        targetState1,
      );
      const txStatus2 = this.transactionHelperService.retrieveTxStatusInData(
        primaryTradeOrder[OrderKeys.DATA],
        targetState1,
      );
      if (
        primaryTradeOrder[OrderKeys.STATE] === targetState1 ||
        primaryTradeOrder[OrderKeys.STATE] === targetState2 ||
        txStatus1 === TxStatus.PENDING ||
        txStatus2 === TxStatus.PENDING
      ) {
        // Order settlement has been trigerred, return order without updating it (idempotency)
        return {
          order: primaryTradeOrder,
          updated: false,
          transactionId:
            this.transactionHelperService.retrieveTxIdInData(
              primaryTradeOrder[OrderKeys.DATA],
              'paidSettled',
            ) ||
            this.transactionHelperService.retrieveTxIdInData(
              primaryTradeOrder[OrderKeys.DATA],
              'unpaidSettled',
            ),
          message: `${settlementMessage} was already done (tx ${
            txStatus1 || txStatus2
          })`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        primaryTradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // settlePrimaryTradeOrder
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

      const {
        newPrimaryTradeOrder,
        settlementResponse,
        transactionId,
      }: IOrderTransaction = await this.sendOrderSettlementTransaction(
        tenantId,
        primaryTradeOrder,
        tradeType,
        functionName,
        issuer,
        investor,
        investorTokenLink,
        token,
        assetClassKey,
        tokenCategory,
        tokenState,
        issuerWallet,
        ethService,
        nextState,
        callerId,
        config,
        authToken,
      );

      // ==> Step3: Save transaction info in off-chain databases

      const updatedPrimaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          primaryTradeOrder[OrderKeys.ID],
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          newPrimaryTradeOrder,
        );

      const hookCallbackData: HookCallBack = await this.craftHookCallbackData(
        primaryTradeOrder,
        typeFunctionUser,
        functionName,
        investor,
        token,
        issuerWallet,
        ethService,
        nextState,
        callerId,
        issuerId, // userId
        issuerId,
        settlementResponse,
        updatedPrimaryTradeOrder,
        tokenCategory,
        authToken,
      );

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

      if (sendNotification && tradeType === PrimaryTradeType.SUBSCRIPTION) {
        this.apiMailingCallService.sendInvestorOrderTokensIssuedNotification(
          tenantId,
          issuer,
          investor,
          token,
          String(primaryTradeOrder[OrderKeys.QUANTITY]),
          authToken,
        );
      }

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          order: updatedPrimaryTradeOrder,
          updated: true,
          transactionId,
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
        return {
          order: response.tokenAction,
          updated: true,
          transactionId: response.transactionId,
          message: response.message,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling order',
        'settleOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Reject order]
   *
   * This function can only be called by the issuer.
   * It can only be called for an order-workflow (issuance) in state SUBSCRIBED | PAID.
   * It allows to declare the investor's subscription order as paid.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBSCRIBED | UNPAID_REJECTED
   *  - Destination state: PAID | PAID_REJECTED
   */
  async rejectOrder(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    orderId: string,
    comment: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<RejectPrimaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.REJECT_PRIMARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const primaryTradeOrder: Order =
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

      const tradeType: PrimaryTradeType =
        primaryTradeOrder[OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE];
      const token: Token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        primaryTradeOrder[OrderKeys.ENTITY_ID],
        true,
        undefined,
        undefined,
        true,
      );
      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);
      const assetClassKey: string = primaryTradeOrder[OrderKeys.ASSET_CLASS];
      if (assetClassRules[assetType][AssetClassRule.HAS_CYCLES]) {
        const cycleId: string =
          this.cycleService.retrieveCycleId(primaryTradeOrder);
        const cycle: AssetCycleInstance =
          await this.apiMetadataCallService.retrieveCycle(
            tenantId,
            CycleEnum.cycleId,
            cycleId,
            undefined,
            undefined,
            true,
          );
      }

      const [issuer, investor, config]: [User, User, Config] =
        await Promise.all([
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            primaryTradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            primaryTradeOrder[OrderKeys.USER_ID],
            true,
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      // ==> Step1: Perform several checks

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // rejectPrimaryTradeOrder
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      // Idempotency
      if (
        primaryTradeOrder[OrderKeys.STATE] === 'paidRejected' ||
        primaryTradeOrder[OrderKeys.STATE] === 'unpaidRejected'
      ) {
        // Order has already been rejected, return order without updating it (idempotency)
        return {
          order: primaryTradeOrder,
          updated: false,
          message: `${tradeType} order rejection was already done`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        primaryTradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // rejectPrimaryTradeOrder
      );

      // Update subscription/redemption order in Workflow-API
      const newPrimaryTradeOrder = {
        ...primaryTradeOrder,
        [OrderKeys.DATA]: {
          ...primaryTradeOrder[OrderKeys.DATA],
          [OrderKeys.COMMENT]: comment,
        },
      };
      const updatedPrimaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          primaryTradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newPrimaryTradeOrder,
        );

      if (sendNotification) {
        this.apiMailingCallService.sendInvestorOrderCanceledNotification(
          tenantId,
          issuer,
          investor,
          token,
          primaryTradeOrder,
          authToken,
        );
      }

      return {
        order: updatedPrimaryTradeOrder,
        updated: true,
        message: `${tradeType} order ${
          newPrimaryTradeOrder[OrderKeys.ID]
        } updated successfully (order rejected)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting order',
        'rejectOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Cancel order]
   *
   * This function can only be called by the investor.
   * It can only be called for an order-workflow (issuance) in state SUBSCRIBED | PAID.
   * It allows the investor to cancel his order.
   *
   * On-chain:
   *  - None
   *
   * Off-chain state machine:
   *  - Initial state: SUBSCRIBED | UNPAID_CANCELLED
   *  - Destination state: PAID | PAID_CANCELLED
   */
  async cancelOrder(
    tenantId: string,
    typeFunctionUser: UserType,
    investorId: string,
    orderId: string,
    comment: string,
    sendNotification: boolean,
    authToken: string,
  ): Promise<CancelPrimaryTradeOrderOutput> {
    try {
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const functionName: FunctionName =
        FunctionName.CANCEL_PRIMARY_TRADE_ORDER;
      const tokenState: TokenState = TokenState.ISSUED;
      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      // Preliminary step: Fetch all required data in databases

      const primaryTradeOrder: Order =
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

      const tradeType: PrimaryTradeType =
        primaryTradeOrder[OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE];
      const token: Token = await this.apiMetadataCallService.retrieveTokenInDB(
        tenantId,
        TokenIdentifierEnum.tokenId,
        primaryTradeOrder[OrderKeys.ENTITY_ID],
        true,
        undefined,
        undefined,
        true,
      );
      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);
      const assetClassKey: string = primaryTradeOrder[OrderKeys.ASSET_CLASS];
      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);
      let subscriptionRules: SubscriptionRules;
      if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf(
          ClassDataKeys.RULES,
        ) > -1
      ) {
        subscriptionRules = this.assetDataService.retrieveAssetClassRules(
          assetClassData,
          assetClassKey,
        );
      }
      if (assetClassRules[assetType][AssetClassRule.HAS_CYCLES]) {
        const cycleId: string =
          this.cycleService.retrieveCycleId(primaryTradeOrder);

        const cycle: AssetCycleInstance =
          await this.apiMetadataCallService.retrieveCycle(
            tenantId,
            CycleEnum.cycleId,
            cycleId,
            undefined,
            undefined,
            true,
          );

        this.checkOrderCanBeCancelled(
          primaryTradeOrder,
          cycle,
          subscriptionRules,
        );
      }

      const [issuer, investor, config]: [User, User, Config] =
        await Promise.all([
          this.linkService.retrieveIssuerLinkedToEntity(
            tenantId,
            primaryTradeOrder[OrderKeys.ENTITY_ID],
            EntityType.TOKEN,
          ),
          this.apiEntityCallService.fetchEntity(
            tenantId,
            primaryTradeOrder[OrderKeys.USER_ID],
            true,
          ),
          this.configService.retrieveTenantConfig(tenantId),
        ]);

      // ==> Step1: Perform several checks

      if (investorId !== investor[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided investorId (${investorId}) is not the investor who created the order (${
            primaryTradeOrder[OrderKeys.USER_ID]
          })`,
        );
      }

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxCompliance(
        tenantId,
        tokenCategory,
        functionName, // cancelPrimaryTradeOrder
        issuer,
        token,
        config,
        undefined, // token sender
        investor, // token recipient
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      // Idempotency
      if (
        primaryTradeOrder[OrderKeys.STATE] === 'paidCancelled' ||
        primaryTradeOrder[OrderKeys.STATE] === 'unpaidCancelled'
      ) {
        // Order has already been cancelled, return order without updating it (idempotency)
        return {
          order: primaryTradeOrder,
          updated: false,
          message: `${tradeType} order cancellation was already done`,
        };
      }

      const nextState: string = await WorkflowMiddleWare.checkStateTransition(
        tenantId,
        TYPE_WORKFLOW_NAME,
        primaryTradeOrder[OrderKeys.ID], // workflow instance ID
        typeFunctionUser,
        functionName, // cancelPrimaryTradeOrder
      );

      // Update subscription/redemption order in Workflow-API
      const newPrimaryTradeOrder = {
        ...primaryTradeOrder,
        [OrderKeys.DATA]: {
          ...primaryTradeOrder[OrderKeys.DATA],
          [OrderKeys.COMMENT]: comment,
        },
      };
      const updatedPrimaryTradeOrder: Order =
        await this.workflowService.updateWorkflowInstance(
          tenantId,
          primaryTradeOrder[OrderKeys.ID],
          functionName,
          typeFunctionUser,
          nextState,
          newPrimaryTradeOrder,
        );

      if (sendNotification) {
        this.apiMailingCallService.sendIssuerOrderCanceledNotification(
          tenantId,
          issuer,
          investor,
          token,
          primaryTradeOrder,
          authToken,
        );
      }

      return {
        order: updatedPrimaryTradeOrder,
        updated: true,
        message: `${tradeType} order ${
          newPrimaryTradeOrder[OrderKeys.ID]
        } updated successfully (order cancelled)`,
      };
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling order',
        'cancelOrder',
        false,
        500,
      );
    }
  }

  /**
   * [Check if payment can be executed]
   */
  checkPaymentCanBeExecuted(
    assetType: AssetType,
    cycle: AssetCycleInstance,
    assetClassData: ClassData,
    assetClassRules: SubscriptionRules,
  ): boolean {
    try {
      // Extract cycle template from asset class data
      const [assetCycleTemplate, templateLabel]: [AssetCycleTemplate, string] =
        this.assetDataService.retrieveAssetCycleTemplate(
          assetType,
          cycle,
          assetClassData,
        );

      // Extract usefull dates from cycle and cycle template
      const paymentOption: PaymentOption =
        assetCycleTemplate[CycleKeys.TEMPLATE_PAYMENT_OPTION];
      const currentDate: Date = new Date();
      const unpaidFlageDate: Date = this.cycleService.retrieveCycleDate(
        cycle,
        CycleKeys.UNPAID_FLAG_DATE,
      );

      // Check if payment can be executed now
      if (
        paymentOption === PaymentOption.AT_ORDER_CREATION ||
        paymentOption === PaymentOption.BETWEEN_CUTOFF_AND_SETTLEMENT
      ) {
        if (!unpaidFlageDate) {
          return true;
        } else if (!cycle[CycleKeys.UNPAID_FLAG_DATE]) {
          return true;
        } else if (currentDate.getTime() < unpaidFlageDate.getTime()) {
          return true;
        } else {
          ErrorService.throwError(
            `payment can't be executed after unpaid flag date ${unpaidFlageDate}`,
          );
        }
      } else {
        ErrorService.throwError(
          `invalid payment option for ${templateLabel} of ${
            assetClassData[ClassDataKeys.KEY]
          } asset class`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if payment can be executed',
        'checkPaymentCanBeExecuted',
        false,
        500,
      );
    }
  }

  /**
   * [Check if settlement can be executed]
   */
  checkSettlementCanBeExecuted(
    cycle: AssetCycleInstance,
    assetClassRules: SubscriptionRules,
  ): boolean {
    try {
      if (!cycle[CycleKeys.SETTLEMENT_DATE]) {
        return true;
      }

      // Extract usefull dates from cycle and cycle template
      const currentDate: Date = new Date();
      const settlementDate: Date = this.cycleService.retrieveCycleDate(
        cycle,
        CycleKeys.SETTLEMENT_DATE,
      );

      // Check if settlement can be executed now
      if (currentDate.getTime() > settlementDate.getTime()) {
        return true;
      } else {
        ErrorService.throwError(
          `order can't be settled before settlement date (${craftExpectedDateLabel(
            currentDate,
            settlementDate,
            'settlement date',
          )})`,
        );
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if settlement can be executed',
        'checkSettlementCanBeExecuted',
        false,
        500,
      );
    }
  }

  /**
   * [Check if order can be cancelled]
   */
  checkOrderCanBeCancelled(
    order: Order,
    cycle: AssetCycleInstance,
    subscriptionRules: SubscriptionRules,
  ): boolean {
    try {
      // Extract usefull dates from cycle and cycle template
      const currentDate: Date = new Date();
      const orderCreationDate: Date = new Date(order[OrderKeys.CREATED_AT]);
      const cutOffDate: Date = this.cycleService.retrieveCycleDate(
        cycle,
        CycleKeys.END_DATE,
      );

      if (cutOffDate && cutOffDate.getTime() < currentDate.getTime()) {
        ErrorService.throwError(
          `order can not be cancelled after cut-off date (${craftExpectedDateLabel(
            currentDate,
            cutOffDate,
            'cut-off date',
          )})`,
        );
      }

      const maxCancellationPeriod: number =
        subscriptionRules[ClassDataKeys.RULES__MAX_CANCELLATION_PERIOD];
      const maxCancellationDate: Date = new Date(
        orderCreationDate.getTime() + maxCancellationPeriod,
      );

      if (maxCancellationDate.getTime() < currentDate.getTime()) {
        const daysInMs = maxCancellationPeriod;
        const daysInS = Math.trunc(daysInMs / 1000);
        const days = Math.trunc(daysInS / 86400);
        const hoursInS = daysInS - days * 86400;
        const hours = Math.trunc(hoursInS / 3600);
        const minutesInS = hoursInS - hours * 3600;
        const minutes = Math.trunc(minutesInS / 60);
        const seconds = minutesInS - minutes * 60;
        ErrorService.throwError(
          `order can not be cancelled more than ${
            days && days !== 0 ? `${days} days, ` : ''
          }${hours && hours !== 0 ? `${hours} hours, ` : ''}${
            minutes && minutes !== 0 ? `${minutes} minutes, ` : ''
          }${hours && hours !== 0 ? `${hours} hours, ` : ''}${
            seconds && seconds !== 0 ? `and ${seconds} seconds` : ''
          } after order creation`,
        );
      }

      return true;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'checking if order can be cancelled',
        'checkOrderCanBeCancelled',
        false,
        500,
      );
    }
  }

  /**
   * [Filter orders by state and order IDs]
   * State filters: "paid" and "subscribed"
   */
  filterSubscriptionOrders(
    orders: Array<Order>,
    states: Array<string>,
    orderIds?: Array<number>,
  ): Array<Order> {
    let filteredOrders = orders.filter(
      (order) =>
        states.includes(order[OrderKeys.STATE]) &&
        states.every(
          (state) =>
            !this.transactionHelperService.retrieveTxStatusInData(
              order[OrderKeys.DATA],
              state,
            ),
        ),
    );

    if (orderIds && orderIds.length) {
      filteredOrders = filteredOrders.filter((order) =>
        orderIds.includes(order[OrderKeys.ID]),
      );
    }
    return filteredOrders;
  }

  /**
   * [Filter orders by batch limit]
   * Max limit 20
   */
  sliceSubscriptionOrders(orders: Array<Order>, limit: number): Array<Order> {
    const MAX_BATCH_SETTLE_ORDERS_LIMIT = 20;

    if (limit > MAX_BATCH_SETTLE_ORDERS_LIMIT)
      ErrorService.throwError(
        `batch settle orders limit shall be below (${MAX_BATCH_SETTLE_ORDERS_LIMIT})`,
      );

    return orders.slice(0, Math.min(limit, orders.length));
  }

  /**
   * [Check if current subscription quantity is in allowed ]
   */
  checkSubscriptionQuantity(
    currentSubscriptionQuantity: number,
    minGlobalSubscriptionQuantity: number,
    maxGlobalSubscriptionQuantity: number,
  ): void {
    if (currentSubscriptionQuantity < minGlobalSubscriptionQuantity) {
      ErrorService.throwError(
        `current subscription quantity is bellow minimum global subscription quantity (${minGlobalSubscriptionQuantity})`,
      );
    }

    if (currentSubscriptionQuantity > maxGlobalSubscriptionQuantity) {
      ErrorService.throwError(
        `current subscription quantity is above maximum global subscription quantity (${maxGlobalSubscriptionQuantity})`,
      );
    }
  }

  /**
   * [Batch settle order]
   *
   * This function can only be called by the issuer.
   * It can only be called for an order-workflow (issuance) in state SUBSCRIBED | PAID.
   * It allows to declare all subscription orders from cycle as paid.
   *
   *
   * Off-chain state machine:
   *  - Initial state: SUBSCRIBED | UNPAIDSETTLED
   *  - Destination state: PAID | PAIDSETTLED
   */

  async settleOrderBatch(
    tenantId: string,
    typeFunctionUser: UserType,
    issuerId: string,
    callerId: string,
    cycleId: string,
    orderIds: Array<number>,
    sendNotification: boolean,
    states: Array<string>,
    limit: number,
    authToken: string,
  ): Promise<SettlePrimaryTradeOrderBatchOutput> {
    try {
      const allowedStates = ['paid', 'subscribed'];
      const tokenCategory: TokenCategory = TokenCategory.HYBRID;
      const tokenState: TokenState = TokenState.ISSUED;

      if (!states.every((state) => allowedStates.includes(state))) {
        ErrorService.throwError(
          `invalid input: list of states(${states.join(
            ', ',
          )}) to settle shall be chosen amongst ${allowedStates.join(', ')}`,
        );
      }

      const subscriptionOrders: Array<Order> =
        await this.workflowService.retrieveWorkflowInstances(
          tenantId,
          WorkflowInstanceEnum.objectId,
          undefined,
          undefined, // idempotencyKey
          undefined,
          undefined,
          cycleId, // objectId
          undefined, // entityType
          WorkflowType.ORDER,
          undefined, // otherWorkflowType
          false,
        );

      const filteredSubscriptionOrders = this.filterSubscriptionOrders(
        subscriptionOrders,
        states,
        orderIds,
      );

      const slicedSubscriptionOrders = this.sliceSubscriptionOrders(
        filteredSubscriptionOrders,
        limit,
      );

      if (!filteredSubscriptionOrders.length) {
        return {
          orders: [],
          count: 0,
          remaining: 0,
          total: 0,
          message: `No order to settle for cycle with id ${cycleId} (${subscriptionOrders.length} orders in cycle)`,
        };
      }

      const tradeType =
        subscriptionOrders[0][OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE];
      const functionName: FunctionName =
        tradeType === PrimaryTradeType.REDEMPTION
          ? FunctionName.SETTLE_REDEMPTION_PRIMARY_TRADE_ORDER
          : FunctionName.SETTLE_SUBSCRIPTION_PRIMARY_TRADE_ORDER;

      this.tokenTxHelperService.checkCategoryIsSupportedByFunction(
        tokenCategory,
        functionName,
      );

      if (
        hasDistinct(subscriptionOrders, (order) => order[OrderKeys.ENTITY_ID])
      ) {
        ErrorService.throwError(
          'shall never happen: orders from the same cycle do not belong to the same token',
        );
      }

      if (
        hasDistinct(
          subscriptionOrders,
          (order) => order[OrderKeys.DATA][OrderKeys.DATA__TRADE_TYPE],
        )
      ) {
        ErrorService.throwError(
          `shall never happen: orders are supposed to all be ${
            tradeType === PrimaryTradeType.REDEMPTION
              ? 'redemption'
              : 'subscription'
          } orders, but it's not the case. Orders belong to different tradeTypes (subscription/redemption).`,
        );
      }

      const tokenId = slicedSubscriptionOrders[0][OrderKeys.ENTITY_ID];

      const assetClassKey =
        filteredSubscriptionOrders[0][OrderKeys.ASSET_CLASS];
      const userIds = filteredSubscriptionOrders.map(
        (order) => order[OrderKeys.USER_ID],
      );
      const dedeuplicatedUserIds = [...new Set(userIds)];

      const userTypesByUserId = {};
      dedeuplicatedUserIds.map((userId: string) => {
        userTypesByUserId[userId] = UserType.INVESTOR;
      });

      const [
        issuer,
        investors,
        issuerTokenLink,
        investorTokenLinks,
        token,
        cycle,
        config,
      ]: [
        User,
        Array<User>,
        Link,
        { [userId: string]: Link },
        Token,
        AssetCycleInstance,
        Config,
      ] = await Promise.all([
        this.linkService.retrieveIssuerLinkedToEntity(
          tenantId,
          tokenId,
          EntityType.TOKEN,
        ),
        this.apiEntityCallService.fetchEntitiesBatch(
          tenantId,
          dedeuplicatedUserIds,
          true, // includeWallets
        ),
        this.linkService.retrieveStrictUserEntityLink(
          tenantId,
          issuerId,
          UserType.ISSUER,
          tokenId, // tokenId
          EntityType.TOKEN,
          undefined, // assetClassKey
        ),
        this.linkService.retrieveStrictUserEntityLinkBatch(
          tenantId,
          userIds,
          userTypesByUserId,
          tokenId,
          EntityType.TOKEN,
          assetClassKey,
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
        this.apiMetadataCallService.retrieveCycle(
          tenantId,
          CycleEnum.cycleId,
          cycleId,
          undefined,
          undefined,
          true,
        ),
        this.configService.retrieveTenantConfig(tenantId),
      ]);

      const investorsMap = new Map(
        investors.map((investor) => [investor[UserKeys.USER_ID], investor]),
      );

      const assetClassData: ClassData =
        this.assetDataService.retrieveAssetClassData(token, assetClassKey);

      const assetType: AssetType =
        await this.assetDataService.retrieveAssetType(tenantId, token);

      let subscriptionRules: SubscriptionRules;
      if (
        assetClassRules[assetType][AssetClassRule.KEYS_TO_CHECK].indexOf([
          ClassDataKeys.RULES,
        ]) > -1
      ) {
        subscriptionRules = this.assetDataService.retrieveAssetClassRules(
          assetClassData,
          assetClassKey,
        );
      }

      if (issuerId !== issuer[UserKeys.USER_ID]) {
        ErrorService.throwError(
          `provided issuerId (${issuerId}) is not the issuer of the asset (${
            issuer[UserKeys.USER_ID]
          })`,
        );
      }

      this.checkSettlementCanBeExecuted(cycle, subscriptionRules);

      this.tokenTxHelperService.checkTokenSmartContractIsDeployed(token);

      // This check has already been done at order creation, but we want to verify the situation hasn't changed
      await this.transactionHelperService.checkTxComplianceBatch(
        tenantId,
        tokenCategory,
        functionName, // settleSubscriptionOrder
        issuer,
        token,
        config,
        undefined, // token sender
        investors, // token recipients
        undefined, // originTokenState
        undefined, // originTokenClass
        tokenState, // destinationTokenState
        assetClassKey, // destinationTokenClass
      );

      const validSubscriptionOrders: Array<Order> = subscriptionOrders.filter(
        (order: Order) =>
          order[OrderKeys.STATE] !== 'paidCancelled' &&
          order[OrderKeys.STATE] !== 'unpaidCancelled' &&
          order[OrderKeys.STATE] !== 'paidRejected' &&
          order[OrderKeys.STATE] !== 'unpaidRejected',
      );

      const currentSubscriptionQuantity = validSubscriptionOrders.reduce(
        (acc, cur) => acc + (cur[OrderKeys.QUANTITY] || 0),
        0,
      );

      const minGlobalSubscriptionQuantity: number = subscriptionRules?.[
        ClassDataKeys.RULES__MIN_GLOBAL_SUBS_QUANTITY
      ]
        ? subscriptionRules[ClassDataKeys.RULES__MIN_GLOBAL_SUBS_QUANTITY]
        : MIN_SUPPORTED_INTEGER;
      const maxGlobalSubscriptionQuantity: number = subscriptionRules?.[
        ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY
      ]
        ? subscriptionRules[ClassDataKeys.RULES__MAX_GLOBAL_SUBS_QUANTITY]
        : MAX_SUPPORTED_INTEGER;

      this.checkSubscriptionQuantity(
        currentSubscriptionQuantity,
        minGlobalSubscriptionQuantity,
        maxGlobalSubscriptionQuantity,
      );

      const workflowInstanceIds = slicedSubscriptionOrders.map(
        (order) => order[OrderKeys.ID],
      );

      const nextStates: Array<string> =
        await WorkflowMiddleWare.checkStateTransitionBatch(
          tenantId,
          TYPE_WORKFLOW_NAME,
          workflowInstanceIds, // workflow instance IDs
          typeFunctionUser,
          functionName, // settleSubscriptionOrder
        );

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

      const promises = slicedSubscriptionOrders.map(
        async (subscriptionOrder: Order, index: number) =>
          this.sendOrderSettlementTransaction(
            tenantId,
            subscriptionOrder,
            tradeType,
            functionName,
            issuer,
            investorsMap.get(subscriptionOrder[OrderKeys.USER_ID]),
            investorTokenLinks[subscriptionOrder[OrderKeys.USER_ID]],
            token,
            assetClassKey,
            tokenCategory,
            tokenState,
            issuerWallet,
            ethService,
            nextStates[index],
            callerId,
            config,
            authToken,
          ),
      );

      const newOrders: Array<IOrderTransaction> = await Promise.all(promises);

      const mapped = newOrders.reduce(
        (acc, order) => {
          acc.newPrimaryTradeOrder.push(order.newPrimaryTradeOrder);
          acc.settlementResponses.push(order.settlementResponse);
          acc.transactionIds.push(order.transactionId);
          return acc;
        },
        {
          newPrimaryTradeOrder: [],
          settlementResponses: [],
          transactionIds: [],
        },
      );

      const updatedSubscriptionOrders: Array<WorkflowInstance> =
        await this.workflowService.updateWorkflowInstancesBatch(
          tenantId,
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          undefined, // No state transition triggered before transaction validation
          mapped.newPrimaryTradeOrder,
        );

      const hookCallbackDatas: Array<HookCallBack> =
        slicedSubscriptionOrders.map((subscriptionOrder, index) =>
          this.craftHookCallbackData(
            subscriptionOrder,
            typeFunctionUser,
            functionName,
            investorsMap.get(subscriptionOrder[OrderKeys.USER_ID]),
            token,
            issuerWallet,
            ethService,
            nextStates[index],
            callerId,
            issuerId, // userId
            issuerId,
            mapped.settlementResponses[index],
            updatedSubscriptionOrders[index],
            tokenCategory,
            authToken,
          ),
        );

      // Save transaction data in off-chain DB (incl. hookCallbackData)
      const asyncTx: boolean =
        this.ethHelperService.checkAsyncTransaction(ethService);
      await this.transactionService.createTransactionBatch(
        tenantId,
        issuerId,
        callerId,
        mapped.transactionIds,
        hookCallbackDatas,
        asyncTx,
      );

      // TODO: Create batch send email

      if (asyncTx) {
        // Aynchronous transaction - waiting for transaction validation...
        return {
          orders: updatedSubscriptionOrders,
          count: updatedSubscriptionOrders.length,
          remaining:
            filteredSubscriptionOrders.length - slicedSubscriptionOrders.length,
          total: filteredSubscriptionOrders.length,
          message: `Settlement of ${slicedSubscriptionOrders.length} orders of cycle with id ${cycleId} of token ${tokenId} has been successfully requested (${subscriptionOrders.length} orders in cycle, including ${filteredSubscriptionOrders.length} to settle)`,
        };
      } else {
        // Synchronous transaction - Transaction is already validated
        const hookPromises = hookCallbackDatas.map(
          async (hookCallbackData, index) =>
            this.transactionHelperService.action_hook(
              tenantId,
              hookCallbackData,
              mapped.transactionIds[index],
              TxStatus.VALIDATED,
            ),
        );
        const responsesBatch: Array<{
          tokenAction: Action;
          created: boolean;
          updated: boolean;
          transactionId: string;
          message: string;
        }> = await Promise.all(hookPromises);

        return {
          orders: responsesBatch.map((response) => response.tokenAction),
          count: responsesBatch.length,
          remaining:
            filteredSubscriptionOrders.length - slicedSubscriptionOrders.length,
          total: filteredSubscriptionOrders.length,
          message: `Settlement of ${slicedSubscriptionOrders.length} orders of cycle with id ${cycleId} of token ${tokenId}, succeeded (${subscriptionOrders.length} orders in cycle, including ${filteredSubscriptionOrders.length} to settle)`,
        };
      }
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling order batch',
        'settleOrderBatch',
        false,
        500,
      );
    }
  }
}
