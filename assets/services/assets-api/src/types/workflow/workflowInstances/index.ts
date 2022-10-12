export const defaultWorkflowsName = 'defaultProcesses';
import { TokenState } from '../../states';
import { TransitionTemplate } from '../transition';
import { EntityType } from '../../entity';
import { Wallet } from '../../wallet';
import { AssetType } from 'src/types/asset/template';
import { Fees } from 'src/types/fees';
import { SmartContract } from 'src/types/smartContract';
import { HTLC } from 'src/types/htlc';
import { UserType } from 'src/types/user';
import { Order } from './order';
import { ApiSCResponse } from 'src/types/apiResponse';
// import { FunctionName } from '../smartContractFunctions';
// import { UserType } from '../user';

export enum WorkflowType {
  TOKEN = 'TOKEN',
  ACTION = 'ACTION',
  NAV = 'NAV', // Net Asset Value
  LINK = 'LINK',
  ORDER = 'ORDER',
  OFFER = 'OFFER',
  EVENT = 'EVENT',
}

export enum PrimaryTradeType {
  SUBSCRIPTION = 'subscription',
  REDEMPTION = 'redemption',
}

export enum OrderType {
  QUANTITY = 'QUANTITY',
  AMOUNT = 'AMOUNT',
}

export enum EventType {
  COUPON = 'COUPON',
  REDEMPTION = 'REDEMPTION',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  SETTLED = 'settled',
  CANCELLED = 'canceled',
}

export enum EventInvestors {
  INVESTOR_ID = 'id',
  INVESTOR_NAME = 'investorName',
  EVENT_STATE = 'eventState',
}
export enum BuyOrderType {
  ENQUIRE = 'ENQUIRE',
  PURCHASE = 'PURCHASE',
  BID = 'BID',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum DvpType {
  ATOMIC = 'ATOMIC',
  NON_ATOMIC = 'NON_ATOMIC',
}

export enum OfferStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum ListingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum keys {
  // following keys used in workflow instance / template types
  ID = 'id',
  TENANT_ID = 'tenantId',
  BROKER_ID = 'brokerId',
  AGENT_ID = 'agentId',
  IDEMPOTENCY_KEY = 'idempotencyKey',
  TYPE = 'workflowType',
  USER_ID = 'userId',
  ENTITY_ID = 'entityId',
  ENTITY_TYPE = 'entityType',
  OBJECT_ID = 'objectId',
  RECIPIENT_ID = 'recipientId',
  WORKFLOW_ID = 'workflowId',
  WORKFLOW_TEMPLATE_ID = 'workflowTemplateId',
  QUANTITY = 'quantity',
  PRICE = 'price',
  PAYMENT_ID = 'paymentId',
  DOCUMENT_ID = 'documentId',
  ASSET_CLASS = 'assetClassKey',
  DATE = 'date',
  COMMENT = 'comment',
  DATA = 'data',
  STATE = 'state',
  NAME = 'name',
  ROLE = 'role',
  WALLET = 'wallet',
  DATA__WALLET_USED = 'walletUsed',
  DATA__NEXT_STATUS = 'nextStatus',
  DATA__TRANSACTION = 'transaction',
  DATA__TRANSACTION__STATUS = 'status',
  DATA__TRANSACTION__ID = 'transactionId',
  DATA__IS_LEDGER_TX = 'isLedgerTx',
  DATA__TX_SERIALIZED = 'txSerialized',
  DATA__RAW_TRANSACTION = 'rawTransaction',
  DATA__FROM_STATE = 'fromState',
  DATA__TO_STATE = 'toState',
  DATA__FROM_CLASS = 'fromClass',
  DATA__TO_CLASS = 'toClass',
  DATA__TX_SIGNER_ID = 'txSignerId',
  DATA__REMAINING = 'remaining',
  DATA__ONGOING = 'ongoing',
  DATA__COUNTER = 'counter',
  DATA__ORDER_TYPE = 'type',
  DATA__EVENT_TYPE = 'eventType',

  DATA__EVENT_INVESTORS = 'eventInvestors',
  DATA__EVENT_AMOUNT = 'amount',
  DATA__EVENT_SETTLEMENT_DATE = 'settlementDate',
  DATA__TRADE_TYPE = 'tradeType',
  DATA__PAYMENT_ACCOUNT_ADDRESS = 'paymentAccountAddress',
  DATA__TRADE_EXPIRES_ON = 'tradeExpiresOn',
  DATA__ORDER_CYCLE = 'cycleId',
  DATA__FEES = 'fees',
  DATA__HOLD = 'hold',
  DATA__HOLD__HOLD_ID = 'holdId',
  DATA__HOLD__HTLC = 'htlcSecret',
  DATA__DVP = 'dvp',
  DATA__DVP__RECIPIENT = 'recipient',
  DATA__DVP__RECIPIENT__ID = 'id',
  DATA__DVP__RECIPIENT__ADDRESS = 'address',
  DATA__DVP__RECIPIENT__EMAIL = 'email',
  DATA__DVP__RECIPIENT__PHONE_NUMBER = 'phoneNumber',
  DATA__DVP__SENDER = 'sender',
  DATA__DVP__SENDER__ID = 'id',
  DATA__DVP__SENDER__EMAIL = 'email',
  DATA__DVP__TYPE = 'type',
  DATA__DVP__ADDRESS = 'dvpAddress',
  DATA__DVP__HTLC = 'htlcSecret',
  DATA__DVP__DELIVERY = 'delivery',
  DATA__DVP__DELIVERY__HOLD_ID = 'holdId',
  DATA__DVP__DELIVERY__TOKEN_ADDRESS = 'tokenAddress',
  DATA__DVP__DELIVERY__TOKEN_STANDARD = 'tokenStandard',
  DATA__DVP__PAYMENT = 'payment',
  DATA__DVP__PAYMENT__HOLD_ID = 'holdId',
  DATA__DVP__PAYMENT__PROOF = 'proof',
  DATA__DVP__PAYMENT__TOKEN_ID = 'tokenId',
  DATA__DVP__PAYMENT__TOKEN_ADDRESS = 'tokenAddress',
  DATA__DVP__PAYMENT__TOKEN_STANDARD = 'tokenStandard',
  DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS = 'tokenAssetClass', // for hybrid tokens.
  DATA__STATE_UPDATED_TIMESTAMPS = 'stateUpdatedTimestamps',
  DATA__ENABLE_NEGOTIATION = 'enableNegotiation',
  DATA__NEGOTIATIONS = 'negotiations',
  DATA__NEGOTIATION_HOLD_GRANTED = 'negotiationHoldGranted',
  DATA__NEGOTIATION_HOLD_REQUESTED = 'negotiationHoldRequested',
  DATA__NEGOTIATION_ENQUIRY_NOTES = 'negotiationEnquiryNotes',
  DATA__NEGOTIATION_RECIPIENT_EMAIL = 'negotiationRecipientEmail',
  DATA__NEGOTIATION_RECIPIENT_PHONE_NUMBER = 'negotiationRecipientPhoneNumber',
  DATA__BUY_ORDER_TYPE = 'buyOrderType',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TRANSITION_TEMPLATES = 'transitionTemplates',
  METADATA = 'metadata',
  METADATA_USER = 'user',
  METADATA_USER_ID = 'id',
  METADATA_USER_FIRST_NAME = 'firstName',
  METADATA_USER_LAST_NAME = 'lastName',
  METADATA_USER_ENTITY_NAME = 'entityName',
  METADATA_USER_USER_TYPE = 'userType',
  METADATA_USER_DEFAULT_WALLET = 'defaultWallet',
  METADATA_USER_WALLETS = 'wallets',
  METADATA_ISSUER = 'issuer',
  METADATA_ISSUER_ID = 'id',
  METADATA_ISSUER_FIRST_NAME = 'firstName',
  METADATA_ISSUER_LAST_NAME = 'lastName',
  METADATA_ISSUER_ENTITY_NAME = 'entityName',
  METADATA_ISSUER_COMPANY = 'company',
  METADATA_ISSUER_DEFAULT_WALLET = 'defaultWallet',
  METADATA_ISSUER_WALLETS = 'wallets',
  METADATA_RECIPIENT = 'recipient',
  METADATA_RECIPIENT_ID = 'id',
  METADATA_RECIPIENT_FIRST_NAME = 'firstName',
  METADATA_RECIPIENT_LAST_NAME = 'lastName',
  METADATA_RECIPIENT_ENTITY_NAME = 'entityName',
  METADATA_RECIPIENT_USER_TYPE = 'userType',
  METADATA_TOKEN = 'token',
  METADATA_TOKEN_ID = 'id',
  METADATA_TOKEN_NAME = 'name',
  METADATA_TOKEN_SYMBOL = 'symbol',
  METADATA_TOKEN_CURRENCY = 'currency',
  METADATA_TOKEN_AUTOMATE_RETIREMENT = 'automateRetirement',
  METADATA_TOKEN_AUTOMATE_HOLD_CREATION = 'automateHoldCreation',
  METADATA_TOKEN_AUTOMATE_SETTLEMENT = 'automateSettlement',
  METADATA_ASSET_TYPE = 'assetType',
  METADATA_ASSET_TEMPLATE_ID = 'assetTemplateId',
  METADATA_ASSET_DATA = 'assetData',
  DATA__OFFER_STATUS = 'offerStatus',
  DATA__OFFER_ENABLE_AT_PRICE_ORDER = 'enableAtPriceOrder',
  DATA__OFFER_ENABLE_BID_PRICE_ORDER = 'enableBidPriceOrder',
  DATA__OFFER_ENABLE_NEGOTIATION = 'enableNegotiation',
  DATA__OFFER_QUANTITY_DISTRIBUTION = 'quantityDistribution',
  DATA__AUTOMATE_RETIREMENT = 'automateRetirement',
  DATA__AUTOMATE_PAYMENT = 'automatePayment',
  DATA__MARKETPLACE = 'marketplace',
  DATA__LISTING_STATUS = 'listingStatus',
  DATA__ACCEPTED_ORDER_ID = 'acceptedOrderId',
  QUANTITY_DISTRIBUTION_AVAILABLE = 'available',
  QUANTITY_DISTRIBUTION_PURCHASED = 'purchased',
  QUANTITY_DISTRIBUTION_HELD = 'held',
  OFFER_ID = 'offerId',
  ORDER_SIDE = 'orderSide',
}

export interface WorkflowInstanceMetadata {
  [keys.METADATA_USER]?: {
    [keys.METADATA_USER_ID]: string;
    [keys.METADATA_USER_FIRST_NAME]: string;
    [keys.METADATA_USER_LAST_NAME]: string;
    [keys.METADATA_USER_ENTITY_NAME]: string;
    [keys.METADATA_USER_USER_TYPE]: UserType;
    [keys.METADATA_USER_DEFAULT_WALLET]?: string;
    [keys.METADATA_USER_WALLETS]?: Wallet[];
  };
  [keys.METADATA_ISSUER]?: {
    [keys.METADATA_ISSUER_ID]: string;
    [keys.METADATA_ISSUER_FIRST_NAME]: string;
    [keys.METADATA_ISSUER_LAST_NAME]: string;
    [keys.METADATA_ISSUER_ENTITY_NAME]?: string;
    [keys.METADATA_ISSUER_COMPANY]: string;
    [keys.METADATA_ISSUER_DEFAULT_WALLET]?: string;
    [keys.METADATA_ISSUER_WALLETS]?: Wallet[];
  };
  [keys.METADATA_RECIPIENT]?: {
    [keys.METADATA_RECIPIENT_ID]: string;
    [keys.METADATA_RECIPIENT_FIRST_NAME]: string;
    [keys.METADATA_RECIPIENT_LAST_NAME]: string;
    [keys.METADATA_RECIPIENT_ENTITY_NAME]: string;
    [keys.METADATA_RECIPIENT_USER_TYPE]: UserType;
    [keys.METADATA_ISSUER_DEFAULT_WALLET]?: string;
    [keys.METADATA_ISSUER_WALLETS]?: Wallet[];
  };
  [keys.METADATA_TOKEN]?: {
    [keys.METADATA_TOKEN_ID]: string;
    [keys.METADATA_TOKEN_NAME]: string;
    [keys.METADATA_TOKEN_SYMBOL]: string;
    [keys.METADATA_TOKEN_CURRENCY]: string;
    [keys.METADATA_TOKEN_AUTOMATE_RETIREMENT]: boolean;
    [keys.METADATA_TOKEN_AUTOMATE_HOLD_CREATION]: boolean;
    [keys.METADATA_TOKEN_AUTOMATE_SETTLEMENT]: boolean;
    [keys.METADATA_ASSET_TYPE]?: AssetType;
    [keys.METADATA_ASSET_TEMPLATE_ID]: string;
  };
  [keys.METADATA_ASSET_DATA]?: any;
}

export interface QuantityDistribution {
  // The sum of these three counters should be equal
  // to keys.QUANTITY of an offer instance
  [keys.QUANTITY_DISTRIBUTION_AVAILABLE]: number;
  [keys.QUANTITY_DISTRIBUTION_PURCHASED]: number;
  [keys.QUANTITY_DISTRIBUTION_HELD]: number;
}

export interface WorkflowInstance {
  [keys.ID]?: number;
  [keys.TENANT_ID]?: string;
  [keys.BROKER_ID]?: string;
  [keys.AGENT_ID]?: string;
  [keys.IDEMPOTENCY_KEY]?: string;
  [keys.TYPE]: WorkflowType;
  [keys.NAME]: string;
  [keys.ROLE]: string;
  [keys.STATE]: string;
  [keys.WORKFLOW_TEMPLATE_ID]: number;
  [keys.TRANSITION_TEMPLATES]?: TransitionTemplate[];
  [keys.USER_ID]: string;
  [keys.RECIPIENT_ID]: string;
  [keys.ENTITY_ID]: string;
  [keys.ENTITY_TYPE]: EntityType;
  [keys.ASSET_CLASS]: string;
  [keys.QUANTITY]: number;
  [keys.PRICE]: number;
  [keys.OBJECT_ID]: string;
  [keys.PAYMENT_ID]: string; // Previously called paymentIdentifier
  [keys.DOCUMENT_ID]: string; // Previously called legalAgreementId
  [keys.WALLET]: string;
  [keys.DATE]: Date;
  [keys.DATA]: {
    [keys.COMMENT]?: string;
    [keys.DATA__WALLET_USED]?: Wallet;
    [keys.DATA__NEXT_STATUS]?: string;
    [keys.DATA__TRANSACTION]?: {
      [key: string]: {
        [keys.DATA__TRANSACTION__ID]: string;
        [keys.DATA__TRANSACTION__STATUS]: string;
      };
    };
    [keys.DATA__IS_LEDGER_TX]?: boolean;
    [keys.DATA__FROM_STATE]?: TokenState;
    [keys.DATA__TO_STATE]?: TokenState;
    [keys.DATA__FROM_CLASS]?: string;
    [keys.DATA__TO_CLASS]?: string;
    [keys.DATA__TX_SIGNER_ID]?: string;
    [keys.DATA__FEES]?: Fees;
    [keys.DATA__HOLD]?: {
      [keys.DATA__HOLD__HOLD_ID]: string;
      [keys.DATA__HOLD__HTLC]: HTLC;
    };
    [keys.DATA__PAYMENT_ACCOUNT_ADDRESS]?: string;
    [keys.DATA__TRADE_EXPIRES_ON]?: Date;
    [keys.DATA__DVP]?: {
      [keys.DATA__DVP__RECIPIENT]?: {
        [keys.DATA__DVP__RECIPIENT__EMAIL]: string;
        [keys.DATA__DVP__RECIPIENT__ID]: string;
        [keys.DATA__DVP__RECIPIENT__PHONE_NUMBER]?: string;
        [keys.DATA__DVP__RECIPIENT__ADDRESS]?: string;
      };
      [keys.DATA__DVP__SENDER]?: {
        [keys.DATA__DVP__SENDER__EMAIL]: string;
        [keys.DATA__DVP__SENDER__ID]: string;
      };
      [keys.DATA__DVP__TYPE]: DvpType;
      [keys.DATA__DVP__ADDRESS]: string;
      [keys.DATA__DVP__HTLC]?: HTLC;
      [keys.DATA__DVP__DELIVERY]?: {
        [keys.DATA__DVP__DELIVERY__HOLD_ID]?: string;
        [keys.DATA__DVP__DELIVERY__TOKEN_ADDRESS]: string;
        [keys.DATA__DVP__DELIVERY__TOKEN_STANDARD]: SmartContract;
      };
      [keys.DATA__DVP__PAYMENT]?: {
        [keys.DATA__DVP__PAYMENT__HOLD_ID]: string;
        [keys.DATA__DVP__PAYMENT__PROOF]: string[];
        [keys.DATA__DVP__PAYMENT__TOKEN_ID]?: string;
        [keys.DATA__DVP__PAYMENT__TOKEN_ADDRESS]: string;
        [keys.DATA__DVP__PAYMENT__TOKEN_STANDARD]: SmartContract;
        [keys.DATA__DVP__PAYMENT__TOKEN_ASSET_CLASS]?: string;
      };
    };
    [keys.DATA__ORDER_TYPE]?: OrderType;
    [keys.DATA__TRADE_TYPE]?: PrimaryTradeType;
    [keys.DATA__OFFER_STATUS]?: OfferStatus;
    [keys.DATA__LISTING_STATUS]?: ListingStatus;
    [keys.DATA__OFFER_ENABLE_AT_PRICE_ORDER]?: boolean;
    [keys.DATA__OFFER_ENABLE_BID_PRICE_ORDER]?: boolean;
    [keys.DATA__OFFER_ENABLE_NEGOTIATION]?: boolean;
    [keys.DATA__MARKETPLACE]?: string;
    [keys.DATA__EVENT_TYPE]?: EventType;
    [keys.DATA__EVENT_AMOUNT]?: number;
    [keys.DATA__EVENT_SETTLEMENT_DATE]?: Date;
    [keys.DATA__EVENT_INVESTORS]?: Array<EventInvestors>;
    [keys.DATA__STATE_UPDATED_TIMESTAMPS]?: { [key: number]: string };
    [keys.DATA__ENABLE_NEGOTIATION]?: boolean;
    [keys.DATA__NEGOTIATIONS]?: INegotiation[];
    [keys.DATA__NEGOTIATION_HOLD_GRANTED]?: boolean;
    [keys.DATA__NEGOTIATION_HOLD_REQUESTED]?: boolean;
    [keys.DATA__NEGOTIATION_ENQUIRY_NOTES]?: string;
    [keys.DATA__NEGOTIATION_RECIPIENT_EMAIL]?: string;
    [keys.DATA__NEGOTIATION_RECIPIENT_PHONE_NUMBER]?: string;
    [keys.DATA__BUY_ORDER_TYPE]?: BuyOrderType;
    [keys.DATA__OFFER_QUANTITY_DISTRIBUTION]?: QuantityDistribution;
    [keys.DATA__AUTOMATE_RETIREMENT]?: boolean;
    [keys.DATA__AUTOMATE_PAYMENT]?: boolean;
    [keys.DATA__ACCEPTED_ORDER_ID]?: string;
  };
  [keys.METADATA]?: WorkflowInstanceMetadata;
  [keys.CREATED_AT]?: Date;
  [keys.UPDATED_AT]?: Date;
  [keys.OFFER_ID]?: number;
  [keys.ORDER_SIDE]?: OrderSide;
}

export interface IEventInvestors {
  [EventInvestors.INVESTOR_ID]: string;
  [EventInvestors.INVESTOR_NAME]: string;
  [EventInvestors.EVENT_STATE]: EventStatus;
}

export interface IOrderTransaction {
  newPrimaryTradeOrder: Order;
  settlementResponse: ApiSCResponse;
  transactionId: string;
}

export interface INegotiation {
  pricePerUnit: number;
  createdAt: Date;
  expiredAt?: Date;
  proposedBy: string;
  acceptedBy: string[];
  rejectedBy: string[];
}
