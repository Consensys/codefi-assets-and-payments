import {
  Controller,
  Post,
  HttpCode,
  Body,
  Delete,
  UseFilters,
} from '@nestjs/common';

import ErrorService from 'src/utils/errorService';

import {
  OfferLockedTokenBodyInput,
  DistributeLockedTokenBodyInput,
  CreateUnLockedTokenBodyInput,
  CreateLockedTokenBodyInput,
  ReserveLockedTokenBodyInput,
  ReleaseReservedTokenBodyInput,
  SendReceiptBodyInput,
  OfferLockedTokenTokenOutput,
  DistributedLockedTokenOutput,
  CreateUnLockedTokenOutput,
  CreateLockedTokenOutput,
  ReserveLockedTokenOutput,
  ReleaseReservedTokenOutput,
  SendReceiptOutput,
  DestroyUnreservedTokenBodyInput,
  DestroyUnreservedTokenOutput,
  InitAssetInstanceOutput,
  InitAssetInstanceBodyInput,
  UpdateAssetInstanceOutput,
  UpdateAssetInstanceBodyInput,
  DeployAssetOutput,
  DeployAssetBodyInput,
  CreatePrimaryTradeOrderOutput,
  CreatePrimaryTradeOrderBodyInput,
  ReceivePaymentPrimaryTradeOutput,
  ReceivePaymentPrimaryTradeBodyInput,
  SettlePrimaryTradeOrderOutput,
  SettlePrimaryTradeOrderBodyInput,
  SettlePrimaryTradeOrderBatchOutput,
  SettlePrimaryTradeOrderBatchBodyInput,
  ValidateNavOutput,
  SubmitNavOutput,
  SubmitNavBodyInput,
  ValidateNavBodyInput,
  RejectNavBodyInput,
  RejectNavOutput,
  RejectPrimaryTradeOrderBodyInput,
  RejectPrimaryTradeOrderOutput,
  CancelPrimaryTradeOrderOutput,
  CancelPrimaryTradeOrderBodyInput,
  CancelSecondaryTradeOrderOutput,
  CancelSecondaryTradeOrderBodyInput,
  CreateTradeOrderBodyInput,
  CreateTradeOrderOutput,
  ApproveTradeOrderBodyInput,
  ApproveTradeOrderOutput,
  AcceptTradeOrderBodyInput,
  AcceptTradeOrderOutput,
  SettleAtomicTradeOrderBodyInput,
  SettleAtomicTradeOrderOutput,
  RejectTradeOrderBodyInput,
  RejectTradeOrderOutput,
  ReceiveTradeOrderPaymentOutput,
  ReceiveTradeOrderPaymentBodyInput,
  SettleNonAtomicTradeOrderOutput,
  SettleNonAtomicTradeOrderBodyInput,
  HoldTradeOrderPaymentBodyInput,
  HoldTradeOrderPaymentBodyOutput,
  HoldTradeOrderDeliveryBodyInput,
  HoldTradeOrderDeliveryBodyOutput,
  SendTradeOrderPaymentBodyInput,
  SendTradeOrderPaymentOutput,
  RejectAssetBodyInput,
  SubmitAssetBodyInput,
  CreateOfferBodyInput,
  CreateOfferOutput,
  UpdateOfferBodyInput,
  UpdateOfferOutput,
  PurchaseOfferBodyInput,
  CreateBindingOfferBodyInput,
  CreateBindingOfferOutput,
  CreateEventOutput,
  CreateEventBodyInput,
  SettleEventOutput,
  SettleEventBodyInput,
  CancelEventBodyInput,
  CancelEventOutput,
  NegotiateBodyInput,
  NegotiateOutput,
  SubmitNegotiationTradeOrderBodyInput,
  SubmitNegotiationTradeOrderOutput,
  ForceCreateAcceptedTradeOrderOutput,
  ForceCreateAcceptedTradeOrderBodyInput,
  ForceCreatePaidTradeOrderBodyInput,
  ForceCreatePaidTradeOrderOutput,
} from './workflows.digitalasset.dto';
import { IUserContext, keys as UserContextKeys } from 'src/types/userContext';
import { WorkFlowsPreIssuanceService } from './workflows.digitalasset.service/preIssuance';
import { WorkFlowsDirectIssuanceService } from './workflows.digitalasset.service/directIssuance';
import { WorkFlowsIndirectIssuanceService } from './workflows.digitalasset.service/indirectIssuance';
import { WorkFlowsFundCreationService } from './workflows.digitalasset.service/assetCreation';
import { keys as UserKeys, UserType } from 'src/types/user';
import { WorkFlowsPrimaryTradeService } from './workflows.digitalasset.service/primaryTrade';
import { WorkFlowsNavManagementService } from './workflows.digitalasset.service/navManagement';
import { setToLowerCase } from 'src/utils/case';
import { WorkFlowsSecondaryTradeService } from './workflows.digitalasset.service/secondaryTrade';
import { checkUserType } from 'src/utils/checks/userType';
import { UserContext } from 'src/utils/decorator/userContext.decorator';
import { FunctionName } from 'src/types/smartContract';
import { WorkFlowsOfferService } from './workflows.digitalasset.service/offer';
import { OrderSide } from 'src/types/workflow/workflowInstances';
import { WorkFlowsEventService } from './workflows.digitalasset.service/event';
import { Protected } from '@consensys/auth';
import { AppToHttpFilter } from '@consensys/error-handler';

@Controller('v2/workflows/digital/asset')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class WorkFlowsDigitalAssetController {
  constructor(
    private readonly workFlowsNavManagementService: WorkFlowsNavManagementService,
    private readonly workFlowsPrimaryTradeService: WorkFlowsPrimaryTradeService,
    private readonly workFlowsSecondaryTradeService: WorkFlowsSecondaryTradeService,
    private readonly workFlowsFundCreationService: WorkFlowsFundCreationService,
    private readonly workFlowsPreIssuanceService: WorkFlowsPreIssuanceService,
    private readonly workFlowsDirectIssuanceService: WorkFlowsDirectIssuanceService,
    private readonly workFlowsIndirectIssuanceService: WorkFlowsIndirectIssuanceService,
    private readonly workFlowsOfferService: WorkFlowsOfferService,
    private readonly workFlowsEventService: WorkFlowsEventService,
  ) {}

  @Post('/nav/management/submit')
  @HttpCode(201)
  @Protected(true, [])
  async submitNavValue(
    @UserContext() userContext: IUserContext,
    @Body() submitNavBody: SubmitNavBodyInput,
  ): Promise<SubmitNavOutput> {
    try {
      const typeFunctionUser = UserType.NAV_MANAGER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SubmitNavOutput =
        await this.workFlowsNavManagementService.submitNav(
          userContext[UserContextKeys.TENANT_ID],
          submitNavBody.idempotencyKey,
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          submitNavBody.tokenId,
          setToLowerCase(submitNavBody.assetClass),
          submitNavBody.navValue,
          submitNavBody.navDate,
          submitNavBody.data,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting new NAV value',
        'submitNavValue',
        true,
        500,
      );
    }
  }

  @Post('/nav/management/validate')
  @HttpCode(200)
  @Protected(true, [])
  async validateNavValue(
    @UserContext() userContext: IUserContext,
    @Body() validateNavBody: ValidateNavBodyInput,
  ): Promise<ValidateNavOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ValidateNavOutput =
        await this.workFlowsNavManagementService.validateNav(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          validateNavBody.navId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'validating new NAV value',
        FunctionName.VALIDATE_NAV,
        true,
        500,
      );
    }
  }

  @Delete('/nav/management/reject')
  @HttpCode(200)
  @Protected(true, [])
  async rejectNavValue(
    @UserContext() userContext: IUserContext,
    @Body() rejectNavBody: RejectNavBodyInput,
  ): Promise<RejectNavOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: RejectNavOutput =
        await this.workFlowsNavManagementService.rejectNav(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          rejectNavBody.navId,
          rejectNavBody.comment,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting new NAV value',
        FunctionName.REJECT_NAV,
        true,
        500,
      );
    }
  }

  @Post('/primary/trade/create/order')
  @HttpCode(201)
  @Protected(true, [])
  async createSubscriptionOrder(
    @UserContext() userContext: IUserContext,
    @Body() createOrderBody: CreatePrimaryTradeOrderBodyInput,
  ): Promise<CreatePrimaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreatePrimaryTradeOrderOutput =
        await this.workFlowsPrimaryTradeService.createPrimaryTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          createOrderBody.idempotencyKey,
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          createOrderBody.tokenId,
          setToLowerCase(createOrderBody.assetClass),
          createOrderBody.orderType,
          createOrderBody.quantity,
          createOrderBody.amount,
          createOrderBody.tradeType,
          createOrderBody.data,
          createOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating primary trade order',
        'createSubscriptionOrder',
        true,
        500,
      );
    }
  }

  @Post('/primary/trade/validate/payment')
  @HttpCode(200)
  @Protected(true, [])
  async validatePayment(
    @UserContext() userContext: IUserContext,
    @Body() executePaymentBody: ReceivePaymentPrimaryTradeBodyInput,
  ): Promise<ReceivePaymentPrimaryTradeOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ReceivePaymentPrimaryTradeOutput =
        await this.workFlowsPrimaryTradeService.validatePayment(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          executePaymentBody.orderId,
          executePaymentBody.paymentAmount,
          executePaymentBody.paymentId,
          executePaymentBody.forcePrice,
          executePaymentBody.data,
          executePaymentBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'validate payment',
        'validatePayment',
        true,
        500,
      );
    }
  }

  @Post('/primary/trade/settle/order')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async settleOrder(
    @UserContext() userContext: IUserContext,
    @Body() settleOrderBody: SettlePrimaryTradeOrderBodyInput,
  ): Promise<SettlePrimaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SettlePrimaryTradeOrderOutput =
        await this.workFlowsPrimaryTradeService.settleOrder(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          settleOrderBody.orderId,
          settleOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling order',
        'settleOrder',
        true,
        500,
      );
    }
  }

  @Post('/primary/trade/settle/order/batch')
  @HttpCode(202)
  @Protected(true, [])
  async settleOrderBatch(
    @UserContext() userContext: IUserContext,
    @Body() settleOrderBatchBody: SettlePrimaryTradeOrderBatchBodyInput,
  ): Promise<SettlePrimaryTradeOrderBatchOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SettlePrimaryTradeOrderBatchOutput =
        await this.workFlowsPrimaryTradeService.settleOrderBatch(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          settleOrderBatchBody.cycleId,
          settleOrderBatchBody.orderIds,
          settleOrderBatchBody.sendNotification,
          settleOrderBatchBody.states,
          settleOrderBatchBody.limit,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'batch settling order',
        'settleOrderBatch',
        true,
        500,
      );
    }
  }

  @Delete('/primary/trade/reject/order')
  @HttpCode(200)
  @Protected(true, [])
  async rejectOrder(
    @UserContext() userContext: IUserContext,
    @Body() rejectOrderBody: RejectPrimaryTradeOrderBodyInput,
  ): Promise<RejectPrimaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: RejectPrimaryTradeOrderOutput =
        await this.workFlowsPrimaryTradeService.rejectOrder(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          rejectOrderBody.orderId,
          rejectOrderBody.comment,
          rejectOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting order',
        'rejectOrder',
        true,
        500,
      );
    }
  }

  @Delete('/primary/trade/cancel/order')
  @HttpCode(200)
  @Protected(true, [])
  async cancelOrder(
    @UserContext() userContext: IUserContext,
    @Body() cancelOrderBody: CancelPrimaryTradeOrderBodyInput,
  ): Promise<CancelPrimaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CancelPrimaryTradeOrderOutput =
        await this.workFlowsPrimaryTradeService.cancelOrder(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          cancelOrderBody.orderId,
          cancelOrderBody.comment,
          cancelOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling order',
        'cancelOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/precreate/order')
  @HttpCode(201)
  @Protected(true, [])
  async precreateTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() createOrderBody: CreateTradeOrderBodyInput,
  ): Promise<CreateTradeOrderOutput> {
    try {
      checkUserType(UserType.AGENT, userContext[UserContextKeys.USER]);

      const response: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.precreateTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          createOrderBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          createOrderBody.senderId, // Id of token sender (SellerId), Mandatory for Buy Orders
          createOrderBody.recipientId,
          createOrderBody.recipientEmail,
          createOrderBody.tokenId,
          setToLowerCase(createOrderBody.assetClass),
          createOrderBody.orderType,
          createOrderBody.quantity,
          createOrderBody.amount,
          createOrderBody.dvpType,
          createOrderBody.paymentTokenId,
          createOrderBody.paymentTokenAddess,
          createOrderBody.paymentTokenStandard,
          createOrderBody.paymentTokenAssetClass,
          undefined, // offerId
          undefined, // callingFunctionName
          createOrderBody.orderSide
            ? createOrderBody.orderSide
            : OrderSide.SELL, //If not provided, default it sell order
          createOrderBody.data,
          createOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'precreating trade order',
        'precreateTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/approve/precreated/order')
  @HttpCode(202)
  @Protected(true, [])
  async acceptPrecreatedTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() approveOrderBody: ApproveTradeOrderBodyInput,
  ): Promise<ApproveTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: ApproveTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.approvePrecreatedTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          approveOrderBody.orderId,
          approveOrderBody.data,
          approveOrderBody.sendNotification,
          approveOrderBody.sendInviteNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'approving pre created trade order',
        'approvePrecreatedTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/create/order')
  @HttpCode(201)
  @Protected(true, [])
  async createTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() createOrderBody: CreateTradeOrderBodyInput,
  ): Promise<CreateTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.createTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          createOrderBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          createOrderBody.senderId, // Id of token sender (SellerId), Mandatory for Buy Orders
          createOrderBody.recipientId,
          createOrderBody.recipientEmail,
          createOrderBody.tokenId,
          setToLowerCase(createOrderBody.assetClass),
          createOrderBody.orderType,
          createOrderBody.quantity,
          createOrderBody.amount,
          createOrderBody.dvpType,
          createOrderBody.paymentTokenId,
          createOrderBody.paymentTokenAddess,
          createOrderBody.paymentTokenStandard,
          createOrderBody.paymentTokenAssetClass,
          undefined, // offerId
          undefined, // callingFunctionName
          createOrderBody.orderSide
            ? createOrderBody.orderSide
            : OrderSide.SELL, //If not provided, default it sell order
          createOrderBody.data,
          createOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating trade order',
        'createTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/approve/order')
  @HttpCode(202)
  @Protected(true, [])
  async approveTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() approveOrderBody: ApproveTradeOrderBodyInput,
  ): Promise<ApproveTradeOrderOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: ApproveTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.approveTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          approveOrderBody.orderId,
          approveOrderBody.data,
          approveOrderBody.sendNotification,
          approveOrderBody.sendInviteNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'approving trade order',
        'approveTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/submit/order/negotiation')
  @HttpCode(200)
  @Protected(true, [])
  async submitTradeOrderNegotiation(
    @UserContext() userContext: IUserContext,
    @Body() submitNegotiationOrderBody: SubmitNegotiationTradeOrderBodyInput,
  ): Promise<SubmitNegotiationTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response =
        await this.workFlowsSecondaryTradeService.submitTradeOrderNegotiation(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          submitNegotiationOrderBody.orderId,
          submitNegotiationOrderBody.price,
          submitNegotiationOrderBody.expirationDate,
          submitNegotiationOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting trade order negotiation',
        'submitNegotiationOrderBody',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/accept/order')
  @HttpCode(200)
  @Protected(true, [])
  async acceptTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() acceptOrderBody: AcceptTradeOrderBodyInput,
  ): Promise<AcceptTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: AcceptTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.acceptTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          acceptOrderBody.orderId,
          acceptOrderBody.data,
          acceptOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'accepting trade order',
        'acceptTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/force/create/accepted/order')
  @HttpCode(201)
  @Protected(true, [])
  async forceCreateAcceptedTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body()
    forceCreateAcceptedOrderBody: ForceCreateAcceptedTradeOrderBodyInput,
  ): Promise<ForceCreateAcceptedTradeOrderOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: CreateTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.forceCreateAcceptedTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          forceCreateAcceptedOrderBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          forceCreateAcceptedOrderBody.senderId, // Id of token sender (SellerId), Mandatory for Buy Orders
          forceCreateAcceptedOrderBody.recipientId,
          forceCreateAcceptedOrderBody.tokenId,
          setToLowerCase(forceCreateAcceptedOrderBody.assetClass),
          forceCreateAcceptedOrderBody.orderType,
          forceCreateAcceptedOrderBody.quantity,
          forceCreateAcceptedOrderBody.amount,
          forceCreateAcceptedOrderBody.dvpType,
          forceCreateAcceptedOrderBody.paymentTokenAddess,
          forceCreateAcceptedOrderBody.paymentTokenStandard,
          forceCreateAcceptedOrderBody.orderSide
            ? forceCreateAcceptedOrderBody.orderSide
            : OrderSide.SELL, // If not provided, default it sell order
          forceCreateAcceptedOrderBody.data,
          forceCreateAcceptedOrderBody.sendNotification,
          forceCreateAcceptedOrderBody.paymentAccountAddress,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing creation of accepted trade order',
        'forceCreateAcceptedTradeOrder',
        true,
        500,
      );
    }
  }

  @Delete('/secondary/trade/cancel/order')
  @HttpCode(200)
  @Protected(true, [])
  async cancelSecondaryOrder(
    @UserContext() userContext: IUserContext,
    @Body() cancelOrderBody: CancelSecondaryTradeOrderBodyInput,
  ): Promise<CancelSecondaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CancelSecondaryTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.cancelTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          cancelOrderBody.orderId,
          cancelOrderBody.comment,
          cancelOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling secondary trade order',
        'cancelSecondaryOrder',
        true,
        500,
      );
    }
  }

  @Delete('/secondary/trade/cancel/precreated/order')
  @HttpCode(200)
  @Protected(true, [])
  async cancelPrecreatedOrder(
    @UserContext() userContext: IUserContext,
    @Body() cancelOrderBody: CancelSecondaryTradeOrderBodyInput,
  ): Promise<CancelSecondaryTradeOrderOutput> {
    try {
      const typeFunctionUser = UserType.AGENT;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CancelSecondaryTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.cancelPrecreatedTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          cancelOrderBody.orderId,
          cancelOrderBody.comment,
          cancelOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'cancelling secondary precreated order',
        'cancelPrecreatedOrder',
        true,
        500,
      );
    }
  }
  @Post('/secondary/trade/hold/order/delivery')
  @HttpCode(202)
  @Protected(true, [])
  async holdTradeOrderDelivery(
    @UserContext() userContext: IUserContext,
    @Body() approveOrderBody: HoldTradeOrderDeliveryBodyInput,
  ): Promise<HoldTradeOrderDeliveryBodyOutput> {
    try {
      checkUserType(UserType.BROKER, userContext[UserContextKeys.USER]);

      const response: HoldTradeOrderDeliveryBodyOutput =
        await this.workFlowsSecondaryTradeService.holdTradeOrderDelivery(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          approveOrderBody.orderId,
          approveOrderBody.timeToExpiration,
          approveOrderBody.data,
          approveOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating delivery token hold',
        'holdTradeOrderDelivery',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/force/create/paid/order')
  @HttpCode(201)
  @Protected(true, [])
  async forceCreatePaidTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body()
    forceCreatePaidOrderBody: ForceCreatePaidTradeOrderBodyInput,
  ): Promise<ForceCreatePaidTradeOrderOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: ForceCreatePaidTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.forceCreatePaidTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          forceCreatePaidOrderBody.idempotencyKey,
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          forceCreatePaidOrderBody.recipientId,
          forceCreatePaidOrderBody.deliveryTokenNetworkKey,
          forceCreatePaidOrderBody.deliveryTokenAddress,
          forceCreatePaidOrderBody.deliveryTokenStandard,
          forceCreatePaidOrderBody.deliveryHoldId,
          forceCreatePaidOrderBody.paymentTokenId,
          setToLowerCase(forceCreatePaidOrderBody.paymentAssetClass),
          forceCreatePaidOrderBody.paymentAmount,
          forceCreatePaidOrderBody.orderType,
          forceCreatePaidOrderBody.dvpType,
          forceCreatePaidOrderBody.orderSide
            ? forceCreatePaidOrderBody.orderSide
            : OrderSide.SELL, // If not provided, default it sell order
          forceCreatePaidOrderBody.data,
          forceCreatePaidOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
          forceCreatePaidOrderBody.senderId,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'forcing creation of paid trade order',
        'forceCreatePaidTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/hold/order/payment')
  @HttpCode(200)
  @Protected(true, [])
  async holdTradeOrderPayment(
    @UserContext() userContext: IUserContext,
    @Body() acceptOrderBody: HoldTradeOrderPaymentBodyInput,
  ): Promise<HoldTradeOrderPaymentBodyOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: AcceptTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.holdTradeOrderPayment(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          acceptOrderBody.orderId,
          acceptOrderBody.paymentHoldId,
          acceptOrderBody.data,
          acceptOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'providing payment token hold ID',
        'holdTradeOrderPayment',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/atomic/settle/order')
  @HttpCode(202)
  @Protected(true, [])
  async settleAtomicTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() settleOrderBody: SettleAtomicTradeOrderBodyInput,
  ): Promise<SettleAtomicTradeOrderOutput> {
    try {
      checkUserType(UserType.ISSUER, userContext[UserContextKeys.USER]);

      const response: SettleAtomicTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.settleAtomicTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          settleOrderBody.orderId,
          settleOrderBody.paymentHoldId, // OPTIONAL (useful in the case the payment hold ID provided by the recipient is not valid anymore, and needs to be overridden by a new one)
          settleOrderBody.data,
          settleOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling atomic trade order',
        'settleAtomicTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/send/payment')
  @HttpCode(200)
  @Protected(true, [])
  async sendTradeOrderPayment(
    @UserContext() userContext: IUserContext,
    @Body() receivePaymentOrderBody: SendTradeOrderPaymentBodyInput,
  ): Promise<SendTradeOrderPaymentOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: ReceiveTradeOrderPaymentOutput =
        await this.workFlowsSecondaryTradeService.sendTradeOrderPayment(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          receivePaymentOrderBody.orderId,
          receivePaymentOrderBody.paymentAmount,
          receivePaymentOrderBody.paymentId,
          receivePaymentOrderBody.paymentProof,
          receivePaymentOrderBody.data,
          receivePaymentOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending trade order payment',
        'sendTradeOrderPayment',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/receive/payment')
  @HttpCode(200)
  @Protected(true, [])
  async receiveTradeOrderPayment(
    @UserContext() userContext: IUserContext,
    @Body() receivePaymentOrderBody: ReceiveTradeOrderPaymentBodyInput,
  ): Promise<ReceiveTradeOrderPaymentOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: ReceiveTradeOrderPaymentOutput =
        await this.workFlowsSecondaryTradeService.receiveTradeOrderPayment(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          receivePaymentOrderBody.orderId,
          receivePaymentOrderBody.paymentAmount,
          receivePaymentOrderBody.paymentId,
          receivePaymentOrderBody.data,
          receivePaymentOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'receiving trade order payment',
        'receiveTradeOrderPayment',
        true,
        500,
      );
    }
  }

  @Post('/secondary/trade/non/atomic/settle/order')
  @HttpCode(202)
  @Protected(true, [])
  async settleNonAtomicTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() settleOrderBody: SettleNonAtomicTradeOrderBodyInput,
  ): Promise<SettleNonAtomicTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: SettleNonAtomicTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.settleNonAtomicTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          settleOrderBody.orderId,
          settleOrderBody.htlcSecret,
          settleOrderBody.data,
          settleOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling non-atomic trade order',
        'settleNonAtomicTradeOrder',
        true,
        500,
      );
    }
  }

  @Delete('/secondary/trade/reject/order')
  @HttpCode(202)
  @Protected(true, [])
  async rejectTradeOrder(
    @UserContext() userContext: IUserContext,
    @Body() rejectOrderBody: RejectTradeOrderBodyInput,
  ): Promise<RejectTradeOrderOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: RejectTradeOrderOutput =
        await this.workFlowsSecondaryTradeService.rejectTradeOrder(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          rejectOrderBody.orderId,
          rejectOrderBody.comment,
          rejectOrderBody.data,
          rejectOrderBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting trade order',
        'rejectTradeOrder',
        true,
        500,
      );
    }
  }

  @Post('/offer/create')
  @HttpCode(201)
  @Protected(true, [])
  async createOffer(
    @UserContext() userContext: IUserContext,
    @Body() createOfferBody: CreateOfferBodyInput,
  ): Promise<CreateOfferOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreateOfferOutput =
        await this.workFlowsOfferService.createOffer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          createOfferBody.idempotencyKey,
          userContext[UserContextKeys.USER],
          createOfferBody.tokenId,
          setToLowerCase(createOfferBody.assetClass),
          createOfferBody.quantity,
          createOfferBody.price,
          createOfferBody.offerStatus,
          createOfferBody.enableAtPriceOrder,
          createOfferBody.enableBidPriceOrder,
          createOfferBody.enableNegotiation,
          createOfferBody.automateRetirement,
          createOfferBody.dvpType,
          createOfferBody.paymentTokenAddress,
          createOfferBody.paymentTokenStandard,
          createOfferBody.data,
          createOfferBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating offer',
        'createOffer',
        true,
        500,
      );
    }
  }

  @Post('/offer/update')
  @HttpCode(201)
  @Protected(true, [])
  async updateOffer(
    @UserContext() userContext: IUserContext,
    @Body() updateOfferBody: UpdateOfferBodyInput,
  ): Promise<UpdateOfferOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: UpdateOfferOutput =
        await this.workFlowsOfferService.updateOffer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.CALLER_ID],
          userContext[UserContextKeys.USER],
          updateOfferBody.offerId,
          updateOfferBody.quantity,
          updateOfferBody.price,
          updateOfferBody.offerStatus,
          updateOfferBody.enableAtPriceOrder,
          updateOfferBody.enableBidPriceOrder,
          updateOfferBody.enableNegotiation,
          updateOfferBody.automateRetirement,
          updateOfferBody.data,
          updateOfferBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating offer',
        'updateOffer',
        true,
        500,
      );
    }
  }

  @Post('/offer/purchase')
  @HttpCode(201)
  @Protected(true, [])
  async purchaseOffer(
    @UserContext() userContext: IUserContext,
    @Body() purchaseOfferBody: PurchaseOfferBodyInput,
  ): Promise<CreateOfferOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response: CreateOfferOutput =
        await this.workFlowsOfferService.purchaseOffer(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER],
          userContext[UserContextKeys.CALLER_ID],
          purchaseOfferBody.idempotencyKey,
          purchaseOfferBody.offerId,
          purchaseOfferBody.quantity,
          purchaseOfferBody.sendNotification,
          purchaseOfferBody.offerMetadata,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'purchasing offer',
        'purchaseOffer',
        true,
        500,
      );
    }
  }

  @Post('/offer/bind')
  @HttpCode(201)
  @Protected(true, [])
  async bindOffer(
    @UserContext() userContext: IUserContext,
    @Body() bindingOfferBody: CreateBindingOfferBodyInput,
  ): Promise<CreateBindingOfferOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response = await this.workFlowsOfferService.bindOffer(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        bindingOfferBody.idempotencyKey,
        bindingOfferBody.offerId,
        bindingOfferBody.bindOfferQuantity,
        bindingOfferBody.bindOfferPrice,
        bindingOfferBody.bindOfferExpiryDate,
        bindingOfferBody.sendNotification,
        bindingOfferBody.bindOfferMetadata,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'binding offer',
        'bindOffer',
        true,
        500,
      );
    }
  }

  @Post('/offer/negotiate')
  @HttpCode(201)
  @Protected(true, [])
  async negotiate(
    @UserContext() userContext: IUserContext,
    @Body() negotiateBody: NegotiateBodyInput,
  ): Promise<NegotiateOutput> {
    try {
      checkUserType(UserType.INVESTOR, userContext[UserContextKeys.USER]);

      const response = await this.workFlowsOfferService.negotiate(
        userContext[UserContextKeys.TENANT_ID],
        userContext[UserContextKeys.USER],
        userContext[UserContextKeys.CALLER_ID],
        negotiateBody.idempotencyKey,
        negotiateBody.offerId,
        negotiateBody.negotiationQuantity,
        negotiateBody.negotiationPrice,
        negotiateBody.negotiationHoldRequested,
        negotiateBody.recipientEmail,
        negotiateBody.recipientPhoneNumber,
        negotiateBody.enquiryNotes,
        negotiateBody.negotiationMetadata,
        negotiateBody.sendNotification,
        userContext[UserContextKeys.AUTH_TOKEN],
      );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'negotiating offer',
        'negotiate',
        true,
        500,
      );
    }
  }

  @Post('/instance/init')
  @HttpCode(201)
  @Protected(true, [])
  async initializeAssetInstance(
    @UserContext() userContext: IUserContext,
    @Body() initAssetBody: InitAssetInstanceBodyInput,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const typeFunctionUser =
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

      const response: InitAssetInstanceOutput =
        await this.workFlowsFundCreationService.initializeAssetInstance(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          initAssetBody.wallet,
          initAssetBody.tokenStandard,
          initAssetBody.name,
          initAssetBody.symbol,
          initAssetBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
          initAssetBody.networkKey,
          initAssetBody.kycTemplateId,
          initAssetBody.certificateActivated, // DEPRECATED (replaced by certificateType)
          initAssetBody.certificateType,
          initAssetBody.unregulatedERC20transfersActivated,
          initAssetBody.assetTemplateId,
          initAssetBody.customExtensionAddress, // [Optional] Address of "custom" extension contract, the token contract will be linked to
          initAssetBody.initialOwnerAddress, // [Optional] Address, the token contract ownership shall be transferred to
          initAssetBody.bypassSecondaryTradeIssuerApproval, // [Optional] flag to bypass Issuer's approval of secondary trade orders
          initAssetBody.automateHoldCreation, // [Optional] flag to automatically create hold on credits on order acceptance
          initAssetBody.automateSettlement, // [Optional] flag to automatically transfer credits on payment Confirmation
          initAssetBody.automateRetirement, // [Optional] flag to automatically retire credits for applicable tokens like Project Carbon flagged for immediate retirements
          initAssetBody.automateForceBurn, // [Optional] flag to automatically burn tokens after dvp settlement (only for specified order sides)
          initAssetBody.initialSupplies,
          initAssetBody.data,
          initAssetBody.issuerId, // [Optional] id of the issuer who is responsible to review & deploy the asset
          initAssetBody.reviewerId, // [Optional] id of the investor who is responsible to review & submit of te asset
          initAssetBody.elementInstances,
          initAssetBody.assetClasses,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'initializing asset instance',
        'initializeAssetInstance',
        true,
        500,
      );
    }
  }

  @Post('/instance/update')
  @HttpCode(200)
  @Protected(true, [])
  async updateAssetInstance(
    @UserContext() userContext: IUserContext,
    @Body() updateAssetBody: UpdateAssetInstanceBodyInput,
  ): Promise<UpdateAssetInstanceOutput> {
    try {
      const typeFunctionUser =
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

      const response: UpdateAssetInstanceOutput =
        await this.workFlowsFundCreationService.updateAssetInstance(
          userContext[UserContextKeys.TENANT_ID],
          updateAssetBody.tokenId,
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          updateAssetBody.wallet,
          updateAssetBody.tokenStandard,
          updateAssetBody.name,
          updateAssetBody.symbol,
          updateAssetBody.chainId, // TO BE DEPRECATED (replaced by 'networkKey')
          updateAssetBody.networkKey,
          updateAssetBody.kycTemplateId,
          updateAssetBody.certificateActivated, // DEPRECATED (replaced by certificateType)
          updateAssetBody.certificateType,
          updateAssetBody.unregulatedERC20transfersActivated,
          updateAssetBody.assetTemplateId,
          updateAssetBody.data,
          updateAssetBody.customExtensionAddress, // [Optional] Address of "custom" extension contract, the token contract will be linked to
          updateAssetBody.initialOwnerAddress, // [Optional] Address, the token contract ownership shall be transferred to
          updateAssetBody.bypassSecondaryTradeIssuerApproval, // [Optional] flag to bypass Issuer's approval of secondary trade orders
          updateAssetBody.automateHoldCreation, // [Optional] flag to automatically create hold on credits on order acceptance
          updateAssetBody.automateSettlement, // [Optional] flag to automatically transfer credits on payment Confirmation
          updateAssetBody.automateRetirement, // [Optional] flag to automatically retire credits for applicable tokens like Project Carbon flagged for immediate retirements
          updateAssetBody.automateForceBurn, // [Optional] flag to automatically burn tokens after dvp settlement (only for specified order sides)
          updateAssetBody.initialSupplies,
          updateAssetBody.reviewerId,
          updateAssetBody.elementInstances,
          updateAssetBody.assetClasses,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'updating asset instance',
        'updateAssetInstance',
        true,
        500,
      );
    }
  }

  @Post('/instance/add/class')
  @HttpCode(200)
  @Protected(true, [])
  async addAssetInstanceClass(
    @UserContext() userContext: IUserContext,
    @Body() updateAssetBody: UpdateAssetInstanceBodyInput,
  ): Promise<UpdateAssetInstanceOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: UpdateAssetInstanceOutput =
        await this.workFlowsFundCreationService.addAssetInstanceClass(
          userContext[UserContextKeys.TENANT_ID],
          updateAssetBody.tokenId,
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          updateAssetBody.assetClasses,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'add asset instance class',
        'addAssetInstanceClass',
        true,
        500,
      );
    }
  }

  @Post('/instance/submit')
  @HttpCode(200)
  @Protected(true, [])
  async submitAssetInstance(
    @UserContext() userContext: IUserContext,
    @Body() submitAssetBody: SubmitAssetBodyInput,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const typeFunctionUser =
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

      const response =
        await this.workFlowsFundCreationService.submitAssetInstance(
          userContext[UserContextKeys.TENANT_ID],
          submitAssetBody.tokenId,
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          submitAssetBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'submitting asset instance for review',
        FunctionName.SUBMIT_ASSET_INSTANCE,
        true,
        500,
      );
    }
  }

  @Post('/instance/reject')
  @HttpCode(200)
  @Protected(true, [])
  async rejectAssetInstance(
    @UserContext() userContext: IUserContext,
    @Body() rejectAssetBody: RejectAssetBodyInput,
  ): Promise<InitAssetInstanceOutput> {
    try {
      const typeFunctionUser =
        userContext[UserContextKeys.USER][UserKeys.USER_TYPE];

      const response =
        await this.workFlowsFundCreationService.rejectAssetInstance(
          userContext[UserContextKeys.TENANT_ID],
          rejectAssetBody.tokenId,
          rejectAssetBody.comment,
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          rejectAssetBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'rejecting asset instance',
        FunctionName.REJECT_ASSET_INSTANCE,
        true,
        500,
      );
    }
  }

  @Post('/instance/deploy')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async deployAssetInstance(
    @UserContext() userContext: IUserContext,
    @Body() deployAssetBody: DeployAssetBodyInput,
  ): Promise<DeployAssetOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: DeployAssetOutput =
        await this.workFlowsFundCreationService.deployAssetInstance(
          userContext[UserContextKeys.TENANT_ID],
          deployAssetBody.tokenId,
          typeFunctionUser,
          userContext[UserContextKeys.USER],
          userContext[UserContextKeys.CALLER_ID],
          deployAssetBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'deploying asset instance',
        'deployAssetInstance',
        true,
        500,
      );
    }
  }

  @Post('/preissuance/offer/locked/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async offerLockedTokens(
    @UserContext() userContext: IUserContext,
    @Body() offerTokensBody: OfferLockedTokenBodyInput,
  ): Promise<OfferLockedTokenTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: OfferLockedTokenTokenOutput =
        await this.workFlowsPreIssuanceService.offerTokens(
          userContext[UserContextKeys.TENANT_ID],
          offerTokensBody.idempotencyKey,
          offerTokensBody.tokenId,
          offerTokensBody.investorId,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          offerTokensBody.quantity,
          offerTokensBody.forcePrice,
          setToLowerCase(offerTokensBody.assetClass),
          offerTokensBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'offering locked tokens',
        'offerLockedTokens',
        true,
        500,
      );
    }
  }

  @Post('/preissuance/distribute/locked/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async distributeLockedTokens(
    @UserContext() userContext: IUserContext,
    @Body() distributeTokensBody: DistributeLockedTokenBodyInput,
  ): Promise<DistributedLockedTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: DistributedLockedTokenOutput =
        await this.workFlowsPreIssuanceService.distributeTokens(
          userContext[UserContextKeys.TENANT_ID],
          distributeTokensBody.tokenActionId,
          distributeTokensBody.vehicleId,
          userContext[UserContextKeys.CALLER_ID],
          Number(distributeTokensBody.quantity),
          distributeTokensBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'distributing locked tokens',
        'distributeLockedTokens',
        true,
        500,
      );
    }
  }

  @Post('/direct/issuance/create/unlocked/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async createUnlockedTokens(
    @UserContext() userContext: IUserContext,
    @Body() createTokensBody: CreateUnLockedTokenBodyInput,
  ): Promise<CreateUnLockedTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreateUnLockedTokenOutput =
        await this.workFlowsDirectIssuanceService.createUnlockedTokens(
          userContext[UserContextKeys.TENANT_ID],
          createTokensBody.idempotencyKey,
          createTokensBody.tokenId,
          createTokensBody.investorId,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          createTokensBody.quantity,
          createTokensBody.forcePrice,
          setToLowerCase(createTokensBody.assetClass),
          createTokensBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating unlocked tokens',
        'createUnlockedTokens',
        true,
        500,
      );
    }
  }

  @Post('/indirect/issuance/create/locked/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async createLockedTokens(
    @UserContext() userContext: IUserContext,
    @Body() createTokensBody: CreateLockedTokenBodyInput,
  ): Promise<CreateLockedTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreateLockedTokenOutput =
        await this.workFlowsIndirectIssuanceService.createLockedTokens(
          userContext[UserContextKeys.TENANT_ID],
          createTokensBody.idempotencyKey,
          createTokensBody.tokenId,
          createTokensBody.investorId,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          createTokensBody.quantity,
          createTokensBody.forcePrice,
          setToLowerCase(createTokensBody.assetClass),
          createTokensBody.data,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating locked tokens',
        'createLockedTokens',
        true,
        500,
      );
    }
  }

  @Post('/indirect/issuance/reserve/locked/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async reserveLockedTokens(
    @UserContext() userContext: IUserContext,
    @Body() reserveTokensBody: ReserveLockedTokenBodyInput,
  ): Promise<ReserveLockedTokenOutput> {
    try {
      const typeFunctionUser = UserType.INVESTOR;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ReserveLockedTokenOutput =
        await this.workFlowsIndirectIssuanceService.reserveTokens(
          userContext[UserContextKeys.TENANT_ID],
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          reserveTokensBody.tokenActionId,
          Number(reserveTokensBody.quantity),
          reserveTokensBody.documentId,
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'reserving locked tokens',
        'reserveLockedTokens',
        true,
        500,
      );
    }
  }

  @Post('/indirect/issuance/release/reserved/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async releaseReservedTokens(
    @UserContext() userContext: IUserContext,
    @Body() releaseTokensBody: ReleaseReservedTokenBodyInput,
  ): Promise<ReleaseReservedTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ReleaseReservedTokenOutput =
        await this.workFlowsIndirectIssuanceService.releaseTokens(
          userContext[UserContextKeys.TENANT_ID],
          releaseTokensBody.tokenActionId,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'releasing reserved tokens',
        'releaseReservedTokens',
        true,
        500,
      );
    }
  }

  @Post('/indirect/issuance/destroy/unreserved/tokens')
  @HttpCode(202) // blockchain transaction
  @Protected(true, [])
  async destroyUnreservedTokens(
    @UserContext() userContext: IUserContext,
    @Body() destroyTokensBody: DestroyUnreservedTokenBodyInput,
  ): Promise<DestroyUnreservedTokenOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: ReleaseReservedTokenOutput =
        await this.workFlowsIndirectIssuanceService.destroyTokens(
          userContext[UserContextKeys.TENANT_ID],
          destroyTokensBody.tokenActionId,
          userContext[UserContextKeys.USER_ID],
          userContext[UserContextKeys.CALLER_ID],
          typeFunctionUser,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'destroying unreserved tokens',
        'destroyUnreservedTokens',
        true,
        500,
      );
    }
  }

  @Post('/indirect/issuance/send/receipt')
  @HttpCode(200)
  @Protected(true, [])
  async sendNotaryReceipt(
    @UserContext() userContext: IUserContext,
    @Body() sendReceiptBody: SendReceiptBodyInput,
  ): Promise<SendReceiptOutput> {
    try {
      const typeFunctionUser = UserType.NOTARY;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SendReceiptOutput =
        await this.workFlowsIndirectIssuanceService.sendNotaryReceipt(
          userContext[UserContextKeys.TENANT_ID],
          sendReceiptBody.tokenActionId,
          userContext[UserContextKeys.USER_ID],
          typeFunctionUser,
          sendReceiptBody.sendNotification,
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'sending notary receipt',
        'sendNotaryReceipt',
        true,
        500,
      );
    }
  }

  @Post('/events/create/event')
  @HttpCode(201)
  async createEvents(
    @UserContext() userContext: IUserContext,
    @Body() createEventBody: CreateEventBodyInput,
  ): Promise<CreateEventOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: CreateEventOutput =
        await this.workFlowsEventService.createEvent(
          userContext[UserContextKeys.TENANT_ID],
          createEventBody.idempotencyKey,
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          createEventBody.tokenId,
          setToLowerCase(createEventBody.assetClass),
          createEventBody.eventType,
          createEventBody.settlementDate,
          createEventBody.amount,
          createEventBody.data,
          createEventBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'creating events',
        'createEvents',
        true,
        500,
      );
    }
  }

  @Post('/events/settle/event')
  @HttpCode(200)
  async settleEvent(
    @UserContext() userContext: IUserContext,
    @Body() settleEventBody: SettleEventBodyInput,
  ): Promise<SettleEventOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SettleEventOutput =
        await this.workFlowsEventService.settleEvent(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          settleEventBody.investorsId,
          settleEventBody.eventId,
          settleEventBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'settling event',
        'settleEvents',
        true,
        500,
      );
    }
  }
  @Post('/events/cancel/event')
  @HttpCode(200)
  async cancelEvent(
    @UserContext() userContext: IUserContext,
    @Body() cancelEventBody: CancelEventBodyInput,
  ): Promise<CancelEventOutput> {
    try {
      const typeFunctionUser = UserType.ISSUER;
      checkUserType(typeFunctionUser, userContext[UserContextKeys.USER]);

      const response: SettleEventOutput =
        await this.workFlowsEventService.cancelEvent(
          userContext[UserContextKeys.TENANT_ID],
          typeFunctionUser,
          userContext[UserContextKeys.USER_ID],
          cancelEventBody.investorsId,
          cancelEventBody.eventId,
          cancelEventBody.sendNotification,
          userContext[UserContextKeys.AUTH_TOKEN],
        );

      return response;
    } catch (error) {
      ErrorService.logAndThrowFunctionError(
        error,
        'canceling event',
        'cancelEvents',
        true,
        500,
      );
    }
  }
}
