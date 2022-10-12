import {
  EntityType,
  ILink,
  IUser,
  IUserTokenData,
  IWallet,
  UserType,
} from 'User';
import { Region, TenantType } from 'constants/tenantKeys';

import { IKYCTemplate } from 'types/KYCTemplate';
import { IKycReview } from 'types/KYCReview';
import { ITranslation } from './insuanceDataType';
import { AssetData } from './assetTypes';

export interface IDocument {
  filename: string;
  docId: string;
}

export enum PrimaryTradeType {
  SUBSCRIPTION = 'subscription',
  REDEMPTION = 'redemption',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export type DigitalCurrency = {
  digitalCurrencyId: string;
  currency: string;
  address: string; // Contract address of the currency token. example: 0xc004f7da0df2f63ad43479133664afcbc7610721
  publicTokenAddress?: string | null; // Contract address of the linked public token. example: 0xeafa962e6b2b49308bfbaca5d9955f46422dd9f7
  interestRate?: number;
  decimals?: number; // Decimals used for the linked public token. example: 18
  scalingFactor?: number; // Used for Aztec Zero-Knowledge tokens. example: 1
  issuerId: string; // The identifier of the issuer of the digital currency
  omniCashAccountId?: string; // The identifier of the issuer's cash account that holds the cash for all the digital currency on issue. This is only visible by issuer users.
  tokenId: string;
};

export type DigitalCurrencyLegalEntity = {
  legalEntityId: string;
  type: 'Issuer' | 'Provider' | 'Holder';
  name: string;
  bic: string; // Business Identity Code. eg SWIFT BIC, Australian Business Number. example: ABN 86 000 431 827
  approved: boolean;
  issuerId?: string; // The identifier of the digital currency issuer if this entity is a currency provider
  providerId?: string; // The identifier of the digital currency provider if this entity is a currency holder
};

export interface KycData {
  elementReviews: IKYCTemplate;
  templateReview: IKycReview;
}

export interface KycValidations {
  // workaround it should be [boolean, string]
  elements: any[];
  template: any[];
}

export interface KycDataResponse {
  kycData: KycData;
  kycValidations: KycValidations;
  message: string;
}
export enum DvpType {
  ATOMIC = 'ATOMIC',
  NON_ATOMIC = 'NON_ATOMIC',
}

export interface IIssuanceTemplate {
  id: string;
  name: string;
  title?: ITranslation;
  description: ITranslation;
  type: AssetType;
  label: ITranslation;
  topSections: Array<ITopSection>;
}

export enum TokenState {
  LOCKED = 'locked',
  RESERVED = 'reserved',
  ISSUED = 'issued',
  COLLATERAL = 'collateral',
}

export enum AssetType {
  OPEN_END_FUND = 'OPEN_END_FUND',
  CLOSED_END_FUND = 'CLOSED_END_FUND',
  PHYSICAL_ASSET = 'PHYSICAL_ASSET',
  SYNDICATED_LOAN = 'SYNDICATED_LOAN',
  FIXED_RATE_BOND = 'FIXED_RATE_BOND',
  CURRENCY = 'CURRENCY',
}

export enum AssetStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum Recurrence {
  DAILY = 'DAILY',
  BIDAILY = 'BIDAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  NEXT_DAY = 'NEXT_DAY',
  ANY = 'ANY',
}

export enum OrderType {
  QUANTITY = 'QUANTITY',
  AMOUNT = 'AMOUNT',
}

export enum BaseInterestRateType {
  FIXED = 'FIXED',
  FLOATING = 'FLOATING',
}

export enum BaseInterestRate {
  BBSW = 'BBSW',
  CASH_RATE = 'CASH_RATE',
}

export interface Interest {
  baseRateType: BaseInterestRateType;
  baseRate: BaseInterestRate;
  margin: number;
  defaultRate: number;
}

export enum CycleDate {
  START = 'START',
  CUTOFF = 'CUTOFF',
  VALUATION = 'VALUATION',
  SETTLEMENT = 'SETTLEMENT',
  UNPAIDFLAG = 'UNPAIDFLAG',
}

export enum OffsetType {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export enum CycleStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_ENDED = 'SUBSCRIPTION_ENDED',
}

export interface AssetCycleInstance {
  id: string;
  tenantId: string;
  assetInstanceId: string;
  assetInstanceClassKey: string;
  startDate: Date;
  endDate: Date;
  valuationDate: Date;
  settlementDate: Date;
  unpaidFlagDate: Date;
  nav: number;
  status: CycleStatus;
  type: PrimaryTradeType;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBorrowerInformation {
  name: string;
  description: string;
  website: string;
  logo: Array<string>;
  team: Array<any>;
}

export interface ITargets {
  [key: number]: {
    metric: string;
    unit: string;
    category: string;
    target: string;
  };
}

export interface ITopSection {
  label: ITranslation;
  legend?: string;
  sections: Array<ISection>;
  multiple: boolean;
  key: string;
}

export interface ISection {
  label: ITranslation;
  baseline?: ITranslation;
  elements: Array<string>;
}

export interface IDeployment {}

export interface IWorkflowsIDs {
  // FIXME: to be renamed workflowIds
  investorProcesses: {
    kyc: number;
  };
  tokenProcesses: {
    preissuance: number;
    issuance: number;
    otcTransfer: number;
    withdrawal: number;
    fungibleBasics: number;
    nonfungibleBasics: number;
    hybridBasics: number;
    fundCreation: number;
  };
}

export interface IErc20CompliantAssetClass {
  name: string;
  erc20CompliantTokenStates: Array<string>;
}

export interface IReducedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string; // Renamed version of DEFAULT_WALLET
  picture?: string;
  prefix?: string;
  docuSignId?: string;
  bankAccount?: any;
  link?: ILink;
}

export interface IToken {
  id: string;
  name: string;
  symbol: string;
  assetTemplateId: string;
  defaultDeployment: string | null;
  standard: string;
  defaultChainId: string;
  workflowIds: IWorkflowsIDs;
  deployments: Array<IDeployment>;
  issuerId: string;
  creatorId?: string;
  reviewerId?: string;
  assetData?: AssetData;
  data: {
    kycTemplateId: string;
    deprecatedChainId: boolean;
    bypassKycChecks: boolean;
    bypassSecondaryTradeIssuerApproval?: boolean;
    automateForceBurn?: Array<OrderSide>;
    walletUsed: {
      address: string;
      type: string;
    };
    nextStatus: string;
    transaction: {
      [key: string]: {
        transactionId: string;
        status: string;
      };
    };
    isLedgerTx: boolean;
    certificateActivated?: boolean;
    borrowerInformation?: IBorrowerInformation;
    assetDataDeprecated?: any;
    worflowInstanceState: string;
    assetCreationFlow: string;
  };
  assetClasses?: Array<string>;
  tokenStates?: Array<TokenState>;
  erc20CompliantAssetClasses?: Array<IErc20CompliantAssetClass>;
  issuer?: IReducedUser;
  investors?: Array<IUser>;
  notaries?: Array<IUser>;
  fetchedAllInvestorProcesses?: any;
  fetchedAllTokenProcesses?: any;
  userRelatedData?: IUserTokenData;
  createdAt: Date;
  updatedAt: Date;
  totalSupply?: number;
  cycles?: Array<AssetCycleInstance>;
}

export interface ITransitionTemplate {
  name: string;
  fromState: string;
  toState: string;
  role: string;
}

export enum WorkflowType {
  TOKEN = 'TOKEN',
  ACTION = 'ACTION',
  NAV = 'NAV', // Net Asset Value
  LINK = 'LINK',
  ORDER = 'ORDER',
  EVENT = 'EVENT',
}

export interface IWorkflowInstanceMetadataRecipient {
  id: string;
  firstName: string;
  lastName: string;
  entityName: string;
  userType: UserType;
  defaultWallet: string;
}

export interface IWorkflowInstanceMetadata {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    entityName: string;
    userType: UserType;
    defaultWallet: string;
  };
  issuer?: {
    id: string;
    firstName: string;
    lastName: string;
    entityName: string;
    userType: UserType;
    defaultWallet: string;
    company: string;
  };
  recipient?: IWorkflowInstanceMetadataRecipient;
  token?: {
    name: string;
    symbol: string;
    assetType: AssetType;
    currency: string;
  };
}

export interface HTLC {
  owner?: string;
  secretEncrypted?: string;
  secret?: string;
  secretHash: string;
}

export enum SmartContract {
  BATCH_BALANCE_READER = 'BatchBalanceReader', // TO BE DEPRECATED
  BATCH_READER = 'BatchReader',
  BATCH_TOKEN_ISSUER = 'BatchTokenIssuer',
  ERC20_TOKEN = 'ERC20Token',
  ERC721_TOKEN = 'ERC721Token',
  ERC1400ERC20 = 'ERC1400ERC20', // V1
  ERC1400_CERTIFICATE_NONCE = 'ERC1400CertificateNonce', // V2
  ERC1400_CERTIFICATE_SALT = 'ERC1400CertificateSalt', // V2
  ERC1400_HOLDABLE_CERTIFICATE = 'ERC1400HoldableCertificateToken', // V3
  ERC1400_TOKENS_VALIDATOR = 'ERC1400TokensValidator',
  DVP_HOLDABLE_LOCKABLE = 'DVPHoldableLockable',
}

export interface IWorkflowInstance {
  id?: number;
  workflowType: WorkflowType;
  name: string;
  role: string;
  tenantId?: string;
  state: string;
  workflowTemplateId: number;
  transitionTemplates?: ITransitionTemplate[];
  userId: string;
  recipientId: string;
  entityId: string;
  entityType: EntityType;
  assetClassKey: string;
  quantity: number;
  price: number;
  objectId: string;
  paymentId: string; // Previously called paymentIdentifier
  documentId: string; // Previously called legalAgreementId
  wallet: string;
  orderSide?: OrderSide;
  date: Date;
  data: {
    tradeType: PrimaryTradeType;
    paymentAccountAddress?: any;
    dvp?: {
      recipient?: {
        email: string;
        id: string;
      };
      type: DvpType;
      dvpAddress: string;
      tradeExpiresOn: string;
      htlcSecret?: HTLC;
      delivery?: {
        holdId?: string;
        tokenAddress: string;
        tokenStandard: SmartContract;
      };
      payment?: {
        holdId: string;
        proof: string[];
        tokenAddress: string;
        tokenStandard: SmartContract;
      };
    };
    comment?: string;
    wireTransferConfirmation?: IDocument;
    walletUsed?: IWallet;
    nextStatus?: string;
    transaction?: {
      [key: string]: {
        transactionId: string;
        status: string;
      };
    };
    isLedgerTx?: boolean;
    fromState?: TokenState;
    toState?: TokenState;
    fromClass?: string;
    toClass?: string;
    txSignerId?: string;
    type?: OrderType;
    interestPeriod?: string;
    utilizationDate?: number;
    tradeOrderType?: 'Drawdown' | 'Novation' | 'Repayment';
    tradeOrderFee?: number;
    amount?: number;
    eventType?: string;
    settlementDate?: string;
    eventInvestors?: any;
  };
  metadata?: IWorkflowInstanceMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum Features {
  ENABLE_CLIENT_MANAGEMENT = 'ENABLE_CLIENT_MANAGEMENT',
  ENABLE_ASSETS = 'ENABLE_ASSETS',
  ENABLE_PROJECTS = 'ENABLE_PROJECTS',
}

export interface IConfig {
  id: string;
  tenantId: string;
  name: string;
  logo: string;
  mailLogo: string;
  mailColor: string;
  mainColor: string;
  mainColorLight: string;
  mainColorLighter: string;
  mainColorDark: string;
  mainColorDarker: string;
  region: string;
  language: string;
  preferences: any;
  restrictedUserTypes: UserType[];
  restrictedAssetTypes: AssetType[];
  data: {
    ZENDESK_KEY: string;
    DISPLAY_COMPANY_NAME_SCREEN: boolean;
    LOGO_WITHOUT_LABEL: string;
    SIDEBAR_BACKGROUND: string;
    SIDEBAR_BACKGROUND_HOVER: string;
    SIDEBAR_TEXT: string;
    SIDEBAR_TEXT_HOVER: string;
    ENABLE_NAV_UPDATE: boolean;
    ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION: boolean;
    ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES: boolean;
    locale: string;
    ENABLE_ASSETS: boolean;
    ENABLE_CLIENT_MANAGEMENT: boolean;
    ENABLE_PROJECTS: boolean;
    FAVICON: string;
    ENABLE_UNDERWRITERS: boolean;
    defaultAlias: string;
    aliases: string;
    region: Region;
    tenantType: TenantType;
    createdAt: Date;
    firstUserId: string;
    codefiUsersIds: string;
    tenantName: string;
    enableMarketplace: boolean;
    usecase: string;
  };
}
