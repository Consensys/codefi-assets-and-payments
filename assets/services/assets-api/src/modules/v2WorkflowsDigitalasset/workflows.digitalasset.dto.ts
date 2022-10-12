import { ApiProperty } from '@nestjs/swagger';
import {
  ValidateNested,
  IsOptional,
  IsEnum,
  IsEmail,
  Validate,
  IsArray,
  IsString,
} from 'class-validator';
import { XorConstraint } from 'src/utils/XorConstraint';
import {
  keys as TokenKeys,
  TokenExample,
  Token,
  AssetExample,
  DEFAULT_TOKEN_NAME,
  TOKEN_SYMBOL_MAX_LENGTH,
  DEFAULT_TOKEN_SYMBOL,
  TokenInputDataExample,
} from 'src/types/token';
import { keys as UserKeys, UserExample } from 'src/types/user';

import {
  keys as NavKeys,
  keys as ActionKeys,
  keys as OrderKeys,
  keys as OfferKeys,
  keys as EventKeys,
  OrderType,
  DvpType,
  PrimaryTradeType,
  OfferStatus,
  OrderSide,
  EventType,
} from 'src/types/workflow/workflowInstances';
import { NAV, NavExample } from 'src/types/workflow/workflowInstances/nav';
import {
  ActionExample,
  Action,
} from 'src/types/workflow/workflowInstances/action';
import { TransactionExample } from 'src/types/transaction';
import { keys as TxKeys } from 'src/types/transaction';
import { keys as NetworkKeys, NetworkExample } from 'src/types/network';
import { CertificateType, SmartContract } from 'src/types/smartContract';
import { AssetTemplateExample } from 'src/types/asset/template';
import {
  Order,
  OrderExample,
} from 'src/types/workflow/workflowInstances/order';
import { AssetCycleInstanceExample } from 'src/types/asset/cycle';
import { keys as CycleKeys } from 'src/types/asset/cycle';
import { InitialSupply, InitialSupplyExample } from 'src/types/supply';
import {
  Offer,
  OfferExample,
} from 'src/types/workflow/workflowInstances/offer';
import {
  Event,
  EventExample,
} from 'src/types/workflow/workflowInstances/event';
import { AssetElementInstance } from 'src/types/asset/elementInstance';

export class SubmitNavBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: NavExample[NavKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      'ID of token, NAV manager wants to submit the NAV (net asset value) for',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, NAV manager wants to submit the NAV (net asset value) for',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: 'New NAV value',
    example: NavExample[NavKeys.QUANTITY],
  })
  navValue: number;

  @ApiProperty({
    description: 'Date after which value can be used as NAV',
    example: '2020-07-22T08:29:56.009Z',
  })
  @IsOptional()
  navDate: Date;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;
}
export class SubmitNavOutput {
  @ApiProperty({
    description: 'Submitted NAV data',
    example: NavExample,
  })
  @ValidateNested()
  nav: Action;

  @ApiProperty({
    description:
      "'true' if NAV has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Nav submitted successfully',
  })
  message: string;
}
export class ValidateNavBodyInput {
  @ApiProperty({
    description:
      'ID of nav value, issuer wants to validate (previously submitted by NAV manager)',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  navId: string;
}
export class ValidateNavOutput {
  @ApiProperty({
    description: 'Validated NAV data',
    example: NavExample,
  })
  @ValidateNested()
  nav: NAV;

  @ApiProperty({
    description:
      "'true' if NAV status has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Nav validated successfully',
  })
  message: string;
}
export class RejectNavBodyInput {
  @ApiProperty({
    description:
      'ID of nav value, issuer wants to reject (previously submitted by NAV manager)',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  navId: string;

  @ApiProperty({
    description:
      'Comment provided by the issuer, to indicate why the NAV has been rejected',
    example: 'Value is not correct: NAV can never be higher than 999,999€',
  })
  @IsOptional()
  comment: string;
}
export class RejectNavOutput {
  @ApiProperty({
    description: 'Rejected NAV data',
    example: NavExample,
  })
  @ValidateNested()
  nav: NAV;

  @ApiProperty({
    description:
      "'true' if NAV status has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Nav rejected successfully',
  })
  message: string;
}

export class CreatePrimaryTradeOrderBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OrderExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      'ID of token, investor wants to create a primary trade order for',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, investor wants to create a primary trade order for',
    example: OrderExample[OrderKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: `Type of order (${OrderType.AMOUNT} | ${OrderType.QUANTITY})`,
    example: OrderType.AMOUNT,
  })
  orderType: OrderType;

  @ApiProperty({
    description: `Quantity of tokens, investor wants to trade for (if orderType = ${OrderType.QUANTITY}) on primary market`,
    example: OrderExample[OrderKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description: `Value of tokens, investor wants to trade for (if orderType = ${OrderType.AMOUNT}) on primary`,
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  amount: number;

  @ApiProperty({
    description: `Type of trade order the investor wants to create ${PrimaryTradeType.SUBSCRIPTION} or ${PrimaryTradeType.REDEMPTION}`,
    example: PrimaryTradeType.SUBSCRIPTION,
  })
  tradeType: PrimaryTradeType;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class UpdateOfferBodyInput {
  @ApiProperty({
    description: 'ID of offer to be updated',
    example: OfferExample[OfferKeys.ID],
  })
  offerId: number;

  @ApiProperty({
    description: `Value of tokens, investor wants to trade for (if orderType = ${OrderType.AMOUNT}) on primary`,
    example: OfferExample[OfferKeys.PRICE],
  })
  @IsOptional()
  price: number;

  @ApiProperty({
    description: `Quantity of tokens, investor wants to trade for (if orderType = ${OrderType.QUANTITY}) on primary market`,
    example: OfferExample[OfferKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for purchase/not',
    example: OfferStatus.OPEN,
  })
  @IsOptional()
  offerStatus: OfferStatus;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for direct purchase order',
  })
  enableAtPriceOrder: boolean;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for bid order',
  })
  enableBidPriceOrder: boolean;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for negotiation order',
  })
  enableNegotiation: boolean;

  @ApiProperty({
    description:
      'Flag denoting if auto retirement is available for all orders after settlement',
  })
  @IsOptional()
  automateRetirement: boolean;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class CreateOfferBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OfferExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description:
      'ID of token, investor wants to create a primary trade order for',
    example: OfferExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, investor wants to create a primary trade order for',
    example: OfferExample[OrderKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: 'Price/unit for this sale offer',
    example: OfferExample[OrderKeys.PRICE],
  })
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'Quantity of tokens, investor wants to offer for sale',
    example: OfferExample[OrderKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for purchase/not',
    example: OfferStatus.OPEN,
  })
  @IsOptional()
  offerStatus: OfferStatus;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for direct purchase order',
  })
  @IsOptional()
  enableAtPriceOrder: boolean;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for bid order',
  })
  @IsOptional()
  enableBidPriceOrder: boolean;

  @ApiProperty({
    description:
      'Flag denoting if Tokens advertised/offered is available for negotiation order',
  })
  @IsOptional()
  enableNegotiation: boolean;

  @ApiProperty({
    description:
      'Flag denoting if auto retirement is available for all orders after settlement',
  })
  @IsOptional()
  automateRetirement: boolean;

  @ApiProperty({
    description: `Type of delivery-vs-payment. Shall be chosen amongst ${DvpType.ATOMIC} and ${DvpType.NON_ATOMIC}`,
    example: DvpType.ATOMIC,
  })
  @IsOptional()
  @IsEnum(DvpType)
  dvpType: DvpType;

  @ApiProperty({
    description:
      '[Optional] Address of token smart contract, where payment hold has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OfferExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentTokenAddress: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  paymentTokenStandard: SmartContract;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CreateOfferOutput {
  @ApiProperty({
    description: 'Created Offer',
    example: OfferExample,
  })
  @ValidateNested()
  offer: Offer;

  @ApiProperty({
    description:
      "'true' if offer has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Offer ${OfferExample[OfferKeys.ID]} created successfully`,
  })
  message: string;
}

export class UpdateOfferOutput {
  @ApiProperty({
    description: 'Update Offer',
    example: OfferExample,
  })
  @ValidateNested()
  offer: Offer;

  @ApiProperty({
    description: 'Response message',
    example: `Offer ${OfferExample[OfferKeys.ID]} updated successfully`,
  })
  message: string;
}

export class PurchaseOfferBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OfferExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of offer',
    example: OfferExample[OfferKeys.ID],
  })
  offerId: number;

  @ApiProperty({
    description: 'Quantity of tokens, investor wants to purchase',
    example: OfferExample[OfferKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: OfferExample[OfferKeys.DATA],
  })
  @IsOptional()
  offerMetadata: Record<string, unknown>;
}

export class PurchaseOfferOutput {
  @ApiProperty({
    description: 'Updated Offer, on foot of offer-purchaseNow',
    example: OfferExample,
  })
  @ValidateNested()
  offer: Offer;

  @ApiProperty({
    description: 'Order Created(accepted status) on foot of offer-purchaseNow',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if a new order created for the current offer, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Order ${
      OrderExample[OrderKeys.ID]
    } created successfully based on Offer ${OfferExample[OfferKeys.ID]} `,
  })
  message: string;
}
export class CreateBindingOfferBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OfferExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of offer',
    example: OfferExample[OfferKeys.ID],
  })
  offerId: number;

  @ApiProperty({
    description:
      'Quantity of tokens, investor wants to purchase for this binding offer',
    example: OfferExample[OfferKeys.QUANTITY],
  })
  bindOfferQuantity: number;

  @ApiProperty({
    description: 'Price/unit for this binding offer',
    example: OfferExample[OfferKeys.PRICE],
  })
  bindOfferPrice: number;

  @ApiProperty({
    description: 'Binding offer expiration date',
  })
  @IsOptional()
  bindOfferExpiryDate: Date;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: OfferExample[OfferKeys.DATA],
  })
  @IsOptional()
  bindOfferMetadata: Record<string, unknown>;
}

export class CreateBindingOfferOutput {
  @ApiProperty({
    description: 'Order Created(submitted status) on foot of binding offer',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if a new order created for the current offer, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Order ${
      OrderExample[OrderKeys.ID]
    } created successfully based on Offer ${OfferExample[OfferKeys.ID]} `,
  })
  message: string;
}

export class NegotiateBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OfferExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of offer',
    example: OfferExample[OfferKeys.ID],
  })
  offerId: number;

  @ApiProperty({
    description:
      'Quantity of tokens, investor wants to purchase thru this negotiating order',
    example: OfferExample[OfferKeys.QUANTITY],
  })
  negotiationQuantity: number;

  @ApiProperty({
    description: 'Price/unit offered for this negotiating order',
    example: OfferExample[OfferKeys.PRICE],
  })
  @IsOptional()
  negotiationPrice: number;

  @ApiProperty({
    description: 'Request to hold inventory',
    example: true,
  })
  @IsOptional()
  negotiationHoldRequested: boolean;

  @ApiProperty({
    description: 'Receiver Email for non binding enquiry',
  })
  @IsOptional()
  recipientEmail: string;

  @ApiProperty({
    description: 'Receiver phone number for non binding enquiry',
  })
  @IsOptional()
  recipientPhoneNumber: string;

  @ApiProperty({
    description: 'Notes for non binding enquiry',
  })
  @IsOptional()
  enquiryNotes: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: OfferExample[OfferKeys.DATA],
  })
  @IsOptional()
  negotiationMetadata: Record<string, unknown>;
}

export class NegotiateOutput {
  @ApiProperty({
    description: 'Order Created(submitted status) for non-binding enquiry',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if a new order created for the current offer, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Order ${
      OrderExample[OrderKeys.ID]
    } created successfully based on Offer ${OfferExample[OfferKeys.ID]} `,
  })
  message: string;
}

export class CreatePrimaryTradeOrderOutput {
  @ApiProperty({
    description: 'Subscription order, which has been created',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } created successfully`,
  })
  message: string;
}

export class SettlePrimaryTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of subscription order, which shall be settled',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class SettlePrimaryTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which settlement has been requested ',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Creation of ${
      OrderExample[OrderKeys.QUANTITY]
    } issued token(s) (settlement order), for investor ${
      UserExample[UserKeys.USER_ID]
    }`,
  })
  message: string;
}
export class SettlePrimaryTradeOrderBatchBodyInput {
  @ApiProperty({
    description: 'ID of cycle, which shall be settled',
    example: AssetCycleInstanceExample[CycleKeys.CYCLE_ID],
  })
  cycleId: string;

  @ApiProperty({
    description: 'IDs of orders, which shall be settled',
  })
  @IsOptional()
  orderIds: Array<number>;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description: 'states of orders which we want to settle',
    example: ['paid', 'subscribed'],
  })
  states: Array<string>;

  @ApiProperty({
    description: 'batch limit of orders that we want to settle',
    example: 50,
  })
  limit: number;
}

export class SettlePrimaryTradeOrderBatchOutput {
  @ApiProperty({
    description: 'Array of orders, which settlement has been requested',
    example: [OrderExample],
  })
  orders: Array<Order>;

  @ApiProperty({
    description: 'Number of orders, which settlement has been requested',
    example: 50,
  })
  count: number;

  @ApiProperty({
    description: 'Number of orders, which settlement remains to be requested',
    example: 50,
  })
  remaining: number;

  @ApiProperty({
    description:
      'Total number of orders to settle (settlement already requested + remaining to be requested)',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'batch limit of orders that we want to settle',
    example: `Settlement of 50 orders of cycle with id ${
      AssetCycleInstanceExample[CycleKeys.CYCLE_ID]
    } of token ${
      OrderExample[OrderKeys.ENTITY_ID]
    } has been successfully requested (10 orders in cycle, including 8 to settle)`,
  })
  message: string;
}

export class RejectPrimaryTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of subscription order, that shall be rejected',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Comment, explaining why the order has been rejected',
    example: OrderExample[OrderKeys.PRICE],
  })
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class RejectPrimaryTradeOrderOutput {
  @ApiProperty({
    description: 'Subscription order, which has been rejected',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (order rejected)`,
  })
  message: string;
}
export class CancelPrimaryTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of subscription order, that shall be cancelled',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Comment, explaining why the order shall be cancelled',
    example: OrderExample[OrderKeys.PRICE],
  })
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CancelSecondaryTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of subscription order, that shall be cancelled',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Comment, explaining why the order shall be cancelled',
    example: OrderExample[OrderKeys.PRICE],
  })
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CancelPrimaryTradeOrderOutput {
  @ApiProperty({
    description: 'Subscription order, which has been cancelled',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (order cancelled)`,
  })
  message: string;
}

export class CancelSecondaryTradeOrderOutput {
  @ApiProperty({
    description: 'Subscription order, which has been cancelled',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (order cancelled)`,
  })
  message: string;
}
export class CancelOfferOutput {
  @ApiProperty({
    description: 'Subscription order, which has been cancelled',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (order cancelled)`,
  })
  message: string;
}
export class ReceivePaymentPrimaryTradeBodyInput {
  @ApiProperty({
    description:
      'ID of subscription order, payment shall be set as received for',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Amount paid by the investor',
    example: OrderExample[OrderKeys.PRICE],
  })
  paymentAmount: number;

  @ApiProperty({
    description:
      '[OPTIONAL] Payment identifier, indicated in the order. The investor is supposed to provide this paymentId in the label of his bank wire transfer',
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  paymentId: string;

  @ApiProperty({
    description:
      "If defined, the order's price will be set to this value. Otherwise, order's price will be calculated based on NAV value",
    example: 113,
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class ReceivePaymentPrimaryTradeOutput {
  @ApiProperty({
    description: 'Subscription order, payment has been executed for',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Subscription order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (payment received)`,
  })
  message: string;
}
export class CreateTradeOrderBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OrderExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of recipient, the trade is destined to',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @Validate(XorConstraint, ['recipientEmail'])
  recipientId: string;

  @ApiProperty({
    description: 'EMAIL of recipient, the trade is destined to',
    example: 'test@mail.com',
  })
  @IsEmail()
  @IsOptional()
  @Validate(XorConstraint, ['recipientId'])
  recipientEmail: string;

  @ApiProperty({
    description: 'ID of token, investor wants to create a trade order for',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, investor wants to create a trade order for',
    example: OrderExample[OrderKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: `Type of order (${OrderType.AMOUNT} | ${OrderType.QUANTITY})`,
    example: OrderType.AMOUNT,
  })
  orderType: OrderType;

  @ApiProperty({
    description: `Order  side (${OrderSide.BUY} | ${OrderSide.SELL})`,
    example: OrderSide.SELL,
  })
  @IsOptional()
  orderSide: OrderSide;

  @ApiProperty({
    description: `Quantity of tokens, investor wants to trade (if orderType = ${OrderType.QUANTITY})`,
    example: OrderExample[OrderKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description: `Value of tokens, investor wants to trade (if orderType = ${OrderType.AMOUNT})`,
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  amount: number;

  @ApiProperty({
    description: `Type of delivery-vs-payment. Shall be chosen amongst ${DvpType.ATOMIC} and ${DvpType.NON_ATOMIC}`,
    example: DvpType.ATOMIC,
  })
  @IsEnum(DvpType)
  dvpType: DvpType;

  @ApiProperty({
    description:
      '[Optional] Id of payment token, where payment hold has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OrderExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentTokenId: string;

  @ApiProperty({
    description:
      '[Optional] Asset class of ERC1400 token smart contract, where payment hold has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OrderExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentTokenAssetClass: string;

  @ApiProperty({
    description:
      '[Optional] Address of token smart contract, where payment hold has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OrderExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentTokenAddess: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  paymentTokenStandard: SmartContract;

  @ApiProperty({
    description:
      'Id of the token sender for this order, Applicable to Buy Orders only',
  })
  @IsOptional()
  senderId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class CreateTradeOrderOutput {
  @ApiProperty({
    description: 'Trade order, which has been created',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${OrderExample[OrderKeys.ID]} created successfully`,
  })
  message: string;
}
export class ApproveTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be approved by issuer',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;

  @ApiProperty({
    description:
      'Send invite notification flag (if true user will be notified by mail to join the plateform)',
  })
  @IsOptional()
  sendInviteNotification: boolean;
}
export class ApproveTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which has been approved by issuer',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } approved successfully by issuer`,
  })
  message: string;
}

export class SubmitNegotiationTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be accepted by recipient',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Price/unit offered for this non-binding enquiry negotiation',
    example: OfferExample[OfferKeys.PRICE],
  })
  @IsOptional()
  price: number;

  @ApiProperty({
    description: 'Expiration date for this negotiation offer',
  })
  @IsOptional()
  expirationDate: Date;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class SubmitNegotiationTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which has been accepted by recipient',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } accepted successfully by recipient`,
  })
  message: string;
}
export class AcceptTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be accepted by recipient',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class AcceptTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which has been accepted by recipient',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } accepted successfully by recipient`,
  })
  message: string;
}
export class ForceCreateAcceptedTradeOrderBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OrderExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of recipient, the trade is destined to',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @Validate(XorConstraint, ['recipientEmail'])
  recipientId: string;

  @ApiProperty({
    description: 'ID of token, investor wants to create a trade order for',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Asset class of token, investor wants to create a trade order for',
    example: OrderExample[OrderKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: `Type of order (${OrderType.AMOUNT} | ${OrderType.QUANTITY})`,
    example: OrderType.AMOUNT,
  })
  orderType: OrderType;

  @ApiProperty({
    description: `Order  side (${OrderSide.BUY} | ${OrderSide.SELL})`,
    example: OrderSide.SELL,
  })
  @IsOptional()
  orderSide: OrderSide;

  @ApiProperty({
    description: `Quantity of tokens, investor wants to trade (if orderType = ${OrderType.QUANTITY})`,
    example: OrderExample[OrderKeys.QUANTITY],
  })
  @IsOptional()
  quantity: number;

  @ApiProperty({
    description: `Value of tokens, investor wants to trade (if orderType = ${OrderType.AMOUNT})`,
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  amount: number;

  @ApiProperty({
    description: `Type of delivery-vs-payment. Shall be chosen amongst ${DvpType.ATOMIC} and ${DvpType.NON_ATOMIC}`,
    example: DvpType.ATOMIC,
  })
  @IsEnum(DvpType)
  dvpType: DvpType;

  @ApiProperty({
    description:
      'Address of the wallet to which the payment hold receiverAddress should be set',
    example: OrderExample[OrderKeys.DATA__PAYMENT_ACCOUNT_ADDRESS],
  })
  @IsOptional()
  paymentAccountAddress: string;

  @ApiProperty({
    description:
      '[Optional] Address of token smart contract, where payment hold has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OrderExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentTokenAddess: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  paymentTokenStandard: SmartContract;

  @ApiProperty({
    description:
      'Id of the token sender for this order, Applicable to Buy Orders only',
  })
  @IsOptional()
  senderId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class ForceCreateAcceptedTradeOrderOutput {
  @ApiProperty({
    description: 'Trade order, which has been created',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${OrderExample[OrderKeys.ID]} created successfully`,
  })
  message: string;
}

export class HoldTradeOrderDeliveryBodyInput {
  @ApiProperty({
    description:
      'ID of trade order, for which delivery token hold shall be created',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      'When the hold will be expired "default value 604800 seconds (7 days)"',
    example: '604800',
  })
  @IsOptional()
  timeToExpiration: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class HoldTradeOrderDeliveryBodyOutput {
  @ApiProperty({
    description:
      'Order, for which delivery token hold creation has been requested',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Hold trade order delivery, including creation of token hold of ${
      OrderExample[OrderKeys.QUANTITY]
    } issued token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}

export class ForceCreatePaidTradeOrderBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: OrderExample[OrderKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of sender, the payment token is moved from',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  senderId: string;

  @ApiProperty({
    description: 'ID of recipient, the trade is destined to',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  @IsOptional()
  @Validate(XorConstraint, ['recipientEmail'])
  recipientId: string;

  @ApiProperty({
    description:
      'Network key of network, where delivery token contract is deployed',
    example: NetworkExample[NetworkKeys.KEY],
  })
  deliveryTokenNetworkKey: string;

  @ApiProperty({
    description:
      'Address of delivery token smart contract, where delivery hold has been created by the sender of the trade',
    example: TokenExample[TokenKeys.DEFAULT_DEPLOYMENT],
  })
  @IsOptional()
  deliveryTokenAddress: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  deliveryTokenStandard: SmartContract;

  @ApiProperty({
    description: 'ID of delivery token hold',
    example:
      '0xdee57eec5fa3e15df2c65a1600b5b5fad62700d6696996d31a3da528549e265b',
  })
  @IsOptional()
  deliveryHoldId: string;

  @ApiProperty({
    description: 'ID of payment token, investor will pay with',
    example: OrderExample[TokenKeys.TOKEN_ID],
  })
  paymentTokenId: string;

  @ApiProperty({
    description: 'Asset class of payment token, investor will pay with',
    example: OrderExample[OrderKeys.ASSET_CLASS],
  })
  paymentAssetClass: string;

  @ApiProperty({
    description:
      'amounts of payment tokens, investor will put send to the seller',
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  paymentAmount: number;

  @ApiProperty({
    description: `Type of order (${OrderType.AMOUNT} | ${OrderType.QUANTITY})`,
    example: OrderType.AMOUNT,
  })
  orderType: OrderType;

  @ApiProperty({
    description: `Type of delivery-vs-payment. Shall be chosen amongst ${DvpType.ATOMIC} and ${DvpType.NON_ATOMIC}`,
    example: DvpType.ATOMIC,
  })
  @IsEnum(DvpType)
  dvpType: DvpType;

  @ApiProperty({
    description: `Order  side (${OrderSide.BUY} | ${OrderSide.SELL})`,
    example: OrderSide.SELL,
  })
  @IsOptional()
  orderSide: OrderSide;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class ForceCreatePaidTradeOrderOutput {
  @ApiProperty({
    description: 'Trade order, which has been created',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${OrderExample[OrderKeys.ID]} created successfully`,
  })
  message: string;
}
export class HoldTradeOrderPaymentBodyInput {
  @ApiProperty({
    description:
      'ID of trade order, for which payment token hold shall be provided',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'ID of payment token hold',
    example:
      '0xdee57eec5fa3e15df2c65a1600b5b5fad62700d6696996d31a3da528549e265b',
  })
  @IsOptional()
  paymentHoldId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class HoldTradeOrderPaymentBodyOutput {
  @ApiProperty({
    description: 'Order, for which payment token hold has been provided',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (payment hold ID provided by recipient)`,
  })
  message: string;
}

export class SettleAtomicTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be settled',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      '[Optional] ID of payment hold ID, that has been created by the recipient of the trade (only if payment is done on-chain)',
    example: OrderExample[OrderKeys.ID],
  })
  @IsOptional()
  paymentHoldId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class SettleAtomicTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which settlement has been requested ',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example:
      'Trade order settlement, including execution of token holds, has been succesfully requested (transaction sent)',
  })
  message: string;
}

export class SendTradeOrderPaymentBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which payment has been sent for',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Amount paid by the payer (recipient of the trade)',
    example: OrderExample[OrderKeys.PRICE],
  })
  paymentAmount: number;

  @ApiProperty({
    description:
      '[OPTIONAL] Payment identifier, indicated in the order. The payer (recipient of the trade) is supposed to provide this paymentId in the label of his bank wire transfer',
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  paymentId: string;

  @ApiProperty({
    description:
      '[OPTIONAL] Payment proof, uploaded by the payer (recipient of the trade) as a confirmation of his bank wire transfer',
    example: OrderExample[OrderKeys.PRICE],
  })
  paymentProof: string[];

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class SendTradeOrderPaymentOutput {
  @ApiProperty({
    description: 'Order, which payment has been sent for',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (payment sent)`,
  })
  message: string;
}

export class ReceiveTradeOrderPaymentBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which payment has been received for',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description: 'Amount paid by the payer (recipient of the trade)',
    example: OrderExample[OrderKeys.PRICE],
  })
  paymentAmount: number;

  @ApiProperty({
    description:
      '[OPTIONAL] Payment identifier, indicated in the order. The payer (recipient of the trade) is supposed to provide this paymentId in the label of his bank wire transfer',
    example: OrderExample[OrderKeys.PRICE],
  })
  @IsOptional()
  paymentId: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class ReceiveTradeOrderPaymentOutput {
  @ApiProperty({
    description: 'Order, which payment has been received for',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order ${
      OrderExample[OrderKeys.ID]
    } updated successfully (payment received)`,
  })
  message: string;
}

export class SettleNonAtomicTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be settled',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      '[OPTIONAL] In case the user calling the endpoint is not the secret owner(e.g. the one who created the secret), he needs to provide the secret',
    example:
      '0xdee57eec5fa3e15df2c65a1600b5b5fad62700d6696996d31a3da528549e265b',
  })
  @IsOptional()
  htlcSecret: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class SettleNonAtomicTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which settlement has been requested ',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example:
      'Trade order settlement, including execution of token hold, has been succesfully requested (transaction sent)',
  })
  message: string;
}

export class RejectTradeOrderBodyInput {
  @ApiProperty({
    description: 'ID of trade order, which shall be rejected',
    example: OrderExample[OrderKeys.ID],
  })
  orderId: string;

  @ApiProperty({
    description:
      'Comment provided by the issuer, to indicate why the submitter has been validated/rejected',
    example: OrderExample[OrderKeys.COMMENT],
  })
  @IsOptional()
  comment: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class RejectTradeOrderOutput {
  @ApiProperty({
    description: 'Order, which rejection has been requested ',
    example: OrderExample,
  })
  @ValidateNested()
  order: Order;

  @ApiProperty({
    description:
      "'true' if order has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Trade order rejection, including release of token hold of ${
      OrderExample[OrderKeys.QUANTITY]
    } issued token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class InitAssetInstanceBodyInput {
  @ApiProperty({
    description:
      'Address of wallet to use to create the token (only required if not the default wallet)',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  @IsOptional()
  wallet: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  tokenStandard: SmartContract;

  @ApiProperty({
    description: 'Token name',
    example: DEFAULT_TOKEN_NAME,
  })
  name: string;

  @ApiProperty({
    description: `Must be a less than ${TOKEN_SYMBOL_MAX_LENGTH} characters long`,
    example: DEFAULT_TOKEN_SYMBOL,
  })
  symbol: string;

  @ApiProperty({
    description: 'ID of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.CHAIN_ID],
  })
  @IsOptional()
  chainId: string; // TO BE DEPRECATED (replaced by 'networkKey')

  @ApiProperty({
    description: 'Key of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.KEY],
  })
  @IsOptional()
  networkKey: string;

  @ApiProperty({
    description:
      'ID of the KYC template investors that will be applied to investors (leave undefined if no KYC will be requested from investors)',
    example: 'b32f6346-53b5-4cc6-a3f3-0012ed5e67a3',
  })
  @IsOptional()
  kycTemplateId: string;

  @ApiProperty({
    description:
      '[DEPRECATED - Replaced by certificateType] If set to true, token actions can not be performed without certificates signed by this API (security), thus empowering issuers with strong control capabilities over issued assets, as those can not be transferred without Codefi API',
    example: true,
  })
  @IsOptional()
  certificateActivated: boolean;

  @ApiProperty({
    description: `Type of certificate validation. Shall be chosen amongst ${CertificateType.NONE}, ${CertificateType.NONCE} and ${CertificateType.SALT}`,
    example: true,
  })
  @IsOptional()
  certificateType: CertificateType;

  @ApiProperty({
    description:
      'If set to true, tokens from default partitions can be transferred without restriction, e.g. with unregulated ERC20 transfers',
    example: true,
  })
  @IsOptional()
  unregulatedERC20transfersActivated: boolean;

  @ApiProperty({
    description:
      '[OPTIONAL] Address of "custom" extension contract, the token contract will be linked to. If undefined, token contract will be linked to "generic" extension contract by default.',
    example: '0x0089d53F703f7E0843953D48133f74cE247184c2',
  })
  @IsOptional()
  customExtensionAddress: string;

  @ApiProperty({
    description:
      '[OPTIONAL] Address, the token contract ownership shall be transferred to. If undefined, token contract will not be transferred (but this can still be done afterwards).',
    example: '0x0089d53F703f7E0843953D48133f74cE247184c2',
  })
  @IsOptional()
  initialOwnerAddress: string;

  @ApiProperty({
    description: 'ID of asset template',
    example: AssetTemplateExample.id,
  })
  assetTemplateId: string;

  @ApiProperty({
    description:
      "If set 'true', Issuer is not required to approve secondary trade orders",
    example: true,
  })
  @IsOptional()
  bypassSecondaryTradeIssuerApproval: boolean;

  @ApiProperty({
    description: 'Flag for using Reference Data API (with a specific schema)',
    example: 'f706c986-f5c8-4503-baf8-959dbac2dd40',
  })
  @IsOptional()
  referenceDataSchemaId: string;

  @ApiProperty({
    description:
      'Object containing reference data to store in Reference-Data-Api',
    example: [],
  })
  @IsOptional()
  referenceData: any;

  @ApiProperty({
    description: 'Type of Reference Data that is retrieved',
    example: 'NewImpactTargetOptions',
  })
  @IsOptional()
  referenceDataOptionsType: string;

  @ApiProperty({
    description:
      "If set 'true', tokens/credits will be automatically held on creation of accepted order",
    example: true,
  })
  @IsOptional()
  automateHoldCreation: boolean;

  @ApiProperty({
    description:
      "If set 'true', tokens/credits will be transferred automatically on payment Confirmation",
    example: true,
  })
  @IsOptional()
  automateSettlement: boolean;

  @ApiProperty({
    description:
      "If set 'true', tokens will be automatically retired on purchase",
    example: true,
  })
  @IsOptional()
  automateRetirement: boolean;

  @ApiProperty({
    description:
      'If defined, tokens of secondary trade order of defined order side(s) will be automatically burnt after a successful settlement',
    example: true,
  })
  @IsOptional()
  automateForceBurn: Array<OrderSide>;

  @ApiProperty({
    description:
      'Array of initial supplies to be minted right after asset creation',
    example: [InitialSupplyExample],
  })
  @IsOptional()
  initialSupplies: Array<InitialSupply>;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'id of the issuer who is responsible to review & deploy the asset (only required when the asset is initialized by an investor or underwriter, which is the case for assets of the bi-party or tri-party flow)',
  })
  @IsOptional()
  issuerId: string;

  @ApiProperty({
    description:
      'id of the reviewer who is responsible to review the asset (only required when the asset is initialized by an underwriter, which is the case in the tri-party flow)',
  })
  @IsOptional()
  reviewerId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  elementInstances: Array<AssetElementInstance>;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  assetClasses: string[];
}
export class InitAssetInstanceOutput {
  @ApiProperty({
    description: 'Created asset instance',
    example: AssetExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Action, keeping track of the asset instance creation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description: 'Response message',
    example: `Asset instance ${
      AssetExample[TokenKeys.TOKEN_ID]
    } initialized successfully`,
  })
  message: string;
}
export class UpdateAssetInstanceBodyInput {
  @ApiProperty({
    description: 'ID of asset instance, that shall be updated',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Address of wallet to use to create the token (only required if not the default wallet)',
    example: UserExample[UserKeys.DEFAULT_WALLET],
  })
  @IsOptional()
  wallet: string;

  @ApiProperty({
    description: `Must be a valid token standard: ${SmartContract.ERC1400_HOLDABLE_CERTIFICATE}`,
    example: SmartContract.ERC1400_HOLDABLE_CERTIFICATE,
  })
  @IsOptional()
  tokenStandard: SmartContract;

  @ApiProperty({
    description: 'Token name',
    example: DEFAULT_TOKEN_NAME,
  })
  @IsOptional()
  name: string;

  @ApiProperty({
    description: `Must be a less than ${TOKEN_SYMBOL_MAX_LENGTH} characters long`,
    example: DEFAULT_TOKEN_SYMBOL,
  })
  @IsOptional()
  symbol: string;

  @ApiProperty({
    description: 'ID of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.CHAIN_ID],
  })
  @IsOptional()
  chainId: string; // TO BE DEPRECATED (replaced by 'networkKey')

  @ApiProperty({
    description: 'Key of the chain/network where the token shall be created',
    example: NetworkExample[NetworkKeys.KEY],
  })
  @IsOptional()
  networkKey: string;

  @ApiProperty({
    description:
      'ID of the KYC template investors that will be applied to investors (leave undefined if no KYC will be requested from investors)',
    example: 'b32f6346-53b5-4cc6-a3f3-0012ed5e67a3',
  })
  @IsOptional()
  kycTemplateId: string;

  @ApiProperty({
    description:
      '[DEPRECATED - Replaced by certificateType] If set to true, token actions can not be performed without certificates signed by this API (security), thus empowering issuers with strong control capabilities over issued assets, as those can not be transferred without Codefi API',
    example: true,
  })
  @IsOptional()
  certificateActivated: boolean;

  @ApiProperty({
    description: `Type of certificate validation. Shall be chosen amongst ${CertificateType.NONE}, ${CertificateType.NONCE} and ${CertificateType.SALT}`,
    example: true,
  })
  @IsOptional()
  certificateType: CertificateType;

  @ApiProperty({
    description:
      'If set to true, tokens from default partitions can be transferred without restriction, e.g. with unregulated ERC20 transfers',
    example: true,
  })
  @IsOptional()
  unregulatedERC20transfersActivated: boolean;

  @ApiProperty({
    description:
      '[OPTIONAL] Address of "custom" extension contract, the token contract will be linked to. If undefined, token contract will be linked to "generic" extension contract by default.',
    example: '0x0089d53F703f7E0843953D48133f74cE247184c2',
  })
  @IsOptional()
  customExtensionAddress: string;

  @ApiProperty({
    description:
      '[OPTIONAL] Address, the token contract ownership shall be transferred to. If undefined, token contract will not be transferred (but this can still be done afterwards).',
    example: '0x0089d53F703f7E0843953D48133f74cE247184c2',
  })
  @IsOptional()
  initialOwnerAddress: string;

  @ApiProperty({
    description: 'ID of asset template',
    example: AssetTemplateExample.id,
  })
  assetTemplateId: string;

  @ApiProperty({
    description:
      "If set 'true', Issuer is not required to approve secondary trade orders",
    example: true,
  })
  @IsOptional()
  bypassSecondaryTradeIssuerApproval: boolean;

  @ApiProperty({
    description:
      "If set 'true', tokens/credits will be automatically held on creation of accepted order",
    example: true,
  })
  @IsOptional()
  automateHoldCreation: boolean;

  @ApiProperty({
    description:
      "If set 'true', tokens/credits will be transferred automatically on payment Confirmation",
    example: true,
  })
  @IsOptional()
  automateSettlement: boolean;

  @ApiProperty({
    description:
      "If set 'true', tokens will be automatically retired on purchase",
    example: true,
  })
  @IsOptional()
  automateRetirement: boolean;

  @ApiProperty({
    description:
      'If defined, tokens of secondary trade order of defined order side(s) will be automatically burnt after a successful settlement',
    example: true,
  })
  @IsOptional()
  automateForceBurn: Array<OrderSide>;

  @ApiProperty({
    description:
      'Array of initial supplies to be minted right after asset creation',
    example: [InitialSupplyExample],
  })
  @IsOptional()
  initialSupplies: Array<InitialSupply>;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'id of the issuer who is responsible to review & deploy the asset (only required when the asset is initialized by an investor or underwriter, which is the case for assets of the bi-party or tri-party flow)',
  })
  @IsOptional()
  issuerId: string;

  @ApiProperty({
    description:
      'id of the reviewer who is responsible to review the asset (only required when the asset is initialized by an underwriter, which is the case in the tri-party flow)',
  })
  @IsOptional()
  reviewerId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  elementInstances: Array<AssetElementInstance>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assetClasses: Array<string>;
}
export class UpdateAssetInstanceOutput {
  @ApiProperty({
    description: 'Updated asset instance',
    example: AssetExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Action, keeping track of the asset creation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description: 'Response message',
    example: `Asset instance ${
      AssetExample[TokenKeys.TOKEN_ID]
    } updated successfully`,
  })
  message: string;
}
export class SubmitAssetBodyInput {
  @ApiProperty({
    description: 'ID of token to be submitted for deployment',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user need to be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class RejectAssetBodyInput {
  @ApiProperty({
    description: 'ID of token to be rejected',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'Comment, explaining why the asset has been rejected',
    example: JSON.stringify([
      'Project Owner Incorrect',
      'Project Link/ Registry link is incorrect',
    ]),
  })
  comment: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user need to be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class DeployAssetBodyInput {
  @ApiProperty({
    description: 'ID of token, that shall be deployed',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class DeployAssetOutput {
  @ApiProperty({
    description: 'Deployed asset',
    example: AssetExample,
  })
  @ValidateNested()
  token: Token;

  @ApiProperty({
    description: 'Action, keeping track of the asset creation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Asset ${AssetExample[TokenKeys.TOKEN_ID]} deployed successfully`,
  })
  message: string;
}
export class OfferLockedTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of token, that shall be offered to the investor',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'ID of investor, token shall be offered to',
    example: UserExample[UserKeys.USER_ID],
  })
  investorId: string;

  @ApiProperty({
    description: 'Quantity of token, that shall be offered',
    example: ActionExample[ActionKeys.QUANTITY],
  })
  quantity: number;

  @ApiProperty({
    description: 'Asset class of token, that shall be offered',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;
}
export class OfferLockedTokenTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the offering operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Creation of ${
      ActionExample[ActionKeys.QUANTITY]
    } locked token(s) (pre-issuance), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class DistributeLockedTokenBodyInput {
  @ApiProperty({
    description: 'ID of workflow instance, that shall be updated',
    example: ActionExample[ActionKeys.ID],
  })
  tokenActionId: string;

  @ApiProperty({
    description:
      "ID of investor's vehicle, token shall be distributed to (by the investor)",
    example: UserExample[UserKeys.USER_ID],
  })
  vehicleId: string;

  @ApiProperty({
    description: 'Quantity of token, that shall be distributed',
    example: ActionExample[ActionKeys.QUANTITY],
  })
  quantity: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;
}
export class DistributedLockedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the distribution operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction1: Action;

  @ApiProperty({
    description: 'Action, keeping track of the issuance operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction2: Action;

  @ApiProperty({
    description:
      "'true' if token action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Distribution of ${
      ActionExample[ActionKeys.QUANTITY]
    } locked token(s) (pre-issuance),  from investor ${
      UserExample[UserKeys.USER_ID]
    }, to vehicle ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class CreateUnLockedTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of token, that shall be created for the investor',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'ID of investor, token shall be created for',
    example: UserExample[UserKeys.USER_ID],
  })
  investorId: string;

  @ApiProperty({
    description: 'Quantity of token, that shall be created',
    example: ActionExample[ActionKeys.QUANTITY],
  })
  quantity: number;

  @ApiProperty({
    description: 'Asset class of token, that shall be created',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;
}
export class CreateUnLockedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token creation operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Creation of ${
      ActionExample[ActionKeys.QUANTITY]
    } locked token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class CreateLockedTokenBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: ActionExample[ActionKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of token, that shall be created for the investor',
    example: TokenExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'ID of investor, token shall be created for',
    example: UserExample[UserKeys.USER_ID],
  })
  investorId: string;

  @ApiProperty({
    description: 'Quantity of token, that shall be created',
    example: ActionExample[ActionKeys.QUANTITY],
  })
  quantity: number;

  @ApiProperty({
    description: 'Asset class of token, that shall be created',
    example: ActionExample[ActionKeys.ASSET_CLASS],
  })
  @IsOptional()
  assetClass: string;

  @ApiProperty({
    description:
      'Optional parameter to force the price of the operation. If not defined, price will be set automatically, based on NAV value (recommended).',
    example: ActionExample[ActionKeys.PRICE],
  })
  @IsOptional()
  forcePrice: number;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: {},
  })
  @IsOptional()
  data: any;
}
export class CreateLockedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token creation operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if action has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Creation of ${
      ActionExample[ActionKeys.QUANTITY]
    } locked token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class ReserveLockedTokenBodyInput {
  @ApiProperty({
    description: 'ID of workflow instance, that shall be updated',
    example: ActionExample[ActionKeys.ID],
  })
  tokenActionId: string;

  @ApiProperty({
    description: 'Quantity of tokens to reserve',
    example: ActionExample[ActionKeys.QUANTITY],
  })
  quantity: number;

  @ApiProperty({
    description:
      'ID of legal agreement, that got signed by the investor to reserve tokens',
    example: UserExample[UserKeys.USER_ID],
  })
  documentId: string;
}
export class ReserveLockedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token reservation operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if token action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Reservation of ${
      ActionExample[ActionKeys.QUANTITY]
    } locked token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class ReleaseReservedTokenBodyInput {
  @ApiProperty({
    description: 'ID of workflow instance, that shall be updated',
    example: ActionExample[ActionKeys.ID],
  })
  tokenActionId: string;
}
export class ReleaseReservedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token release operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if token action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Release of ${
      ActionExample[ActionKeys.QUANTITY]
    } reserved token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class DestroyUnreservedTokenBodyInput {
  @ApiProperty({
    description: 'ID of workflow instance, that shall be updated',
    example: ActionExample[ActionKeys.ID],
  })
  tokenActionId: string;
}
export class DestroyUnreservedTokenOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token destruction operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if token action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'ID of the transaction envelope/context in off-chain DB',
    example: TransactionExample[TxKeys.ENV_IDENTIFIER_ORCHESTRATE_ID],
  })
  transactionId: string;

  @ApiProperty({
    description: 'Response message',
    example: `Destruction of ${
      ActionExample[ActionKeys.QUANTITY]
    } unreserved token(s), for investor ${
      UserExample[UserKeys.USER_ID]
    }, has been succesfully requested (transaction sent)`,
  })
  message: string;
}
export class SendReceiptBodyInput {
  @ApiProperty({
    description: 'ID of workflow instance, that shall be updated',
    example: ActionExample[ActionKeys.ID],
  })
  tokenActionId: string;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}
export class SendReceiptOutput {
  @ApiProperty({
    description: 'Action, keeping track of the token receipt sending operation',
    example: ActionExample,
  })
  @ValidateNested()
  tokenAction: Action;

  @ApiProperty({
    description:
      "'true' if token action has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Notary receipt succesfully sent for action #${
      ActionExample[ActionKeys.ID]
    }, already 60 blocks past since transaction validation`,
  })
  message: string;
}

export class CreateEventBodyInput {
  @ApiProperty({
    description:
      '[OPTIONAL] Idempotency key (shall be unique and generated on client side), used to ensure object is not created twice',
    example: EventExample[EventKeys.IDEMPOTENCY_KEY],
  })
  @IsOptional()
  idempotencyKey: string;

  @ApiProperty({
    description: 'ID of token, issuer wants to create a event for',
    example: EventExample[TokenKeys.TOKEN_ID],
  })
  tokenId: string;

  @ApiProperty({
    description: 'Asset class of token, issuer wants to create a event for',
    example: EventExample[EventKeys.ASSET_CLASS],
  })
  assetClass: string;

  @ApiProperty({
    description: `Type of event (${EventType.COUPON} | ${EventType.REDEMPTION})`,
    example: EventType.COUPON,
  })
  eventType: EventType;

  @ApiProperty({
    description: 'Settlement date for event that issuer wants to create',
    example:
      EventExample[EventKeys.DATA][EventKeys.DATA__EVENT_SETTLEMENT_DATE],
  })
  @IsOptional()
  settlementDate: Date;

  @ApiProperty({
    description: 'Amount for event that issuer wants to create',
    example: EventExample[EventKeys.DATA][EventKeys.DATA__EVENT_AMOUNT],
  })
  @IsOptional()
  amount: string;

  @ApiProperty({
    description:
      'Object to store any additional data (potentially use case related data)',
    example: TokenInputDataExample,
  })
  @IsOptional()
  data: any;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CreateEventOutput {
  @ApiProperty({
    description: 'Event which has been created',
    example: EventExample,
  })
  @ValidateNested()
  event: Event;

  @ApiProperty({
    description:
      "'true' if event has been created, 'false' if it was already created (idempotency)",
    example: true,
  })
  created: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Event ${EventExample[EventKeys.ID]} created successfully`,
  })
  message: string;
}

export class SettleEventBodyInput {
  @ApiProperty({
    description: 'ID of event, which shall be settled',
    example: EventExample[EventKeys.ID],
  })
  eventId: string;

  @ApiProperty({
    description: 'IDs of investors, for which issuer settle events',
    example: EventExample[EventKeys.USER_ID],
  })
  investorsId: Array<string>;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class SettleEventOutput {
  @ApiProperty({
    description: 'Event, which settlement has been requested ',
    example: EventExample,
  })
  @ValidateNested()
  event: Event;

  @ApiProperty({
    description:
      "'true' if event has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Settle of ${
      EventExample[EventKeys.DATA][EventKeys.DATA__EVENT_TYPE]
    } event is successful`,
  })
  message: string;
}

export class CancelEventBodyInput {
  @ApiProperty({
    description: 'ID of event, which shall be settled',
    example: EventExample[EventKeys.ID],
  })
  eventId: string;

  @ApiProperty({
    description: 'IDs of investors, for which issuer settle events',
    example: EventExample[EventKeys.USER_ID],
  })
  investorsId: Array<string>;

  @ApiProperty({
    description:
      'Send notification flag (if true user will be notified by mail)',
  })
  @IsOptional()
  sendNotification: boolean;
}

export class CancelEventOutput {
  @ApiProperty({
    description: 'Event which has been cancelled',
    example: EventExample,
  })
  @ValidateNested()
  event: Event;

  @ApiProperty({
    description:
      "'true' if event has been updated, 'false' if it was already in target state",
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Response message',
    example: `Event ${
      EventExample[EventKeys.ID]
    } updated successfully (event cancelled)`,
  })
  message: string;
}
