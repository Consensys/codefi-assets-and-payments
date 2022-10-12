// import { ClientCategory, RiskProfile } from './kyc/review';
// import { Recurrence } from './recurrence';
// import { AssetCycleTemplate, AssetCycleTemplateExample } from './asset/cycle';
// import { NavExample, NAV } from './workflow/workflowInstances/nav';
// import { AssetType } from './asset/template';
// import { OrderType } from './workflow/workflowInstances';
// import { Fees, FeesExample } from './fees';
// import { Interest, InterestExample } from './interest';
// import { LoanSecurity, LoanSecurityExample } from './loanSecurity';
// import { Participants, ParticipantsExample } from './participants';
// import { TokenUnit } from './token';
// import { Coupon, CouponExample } from './coupon';

// export enum AssetStatus {
//   OPEN = 'OPEN',
//   PAUSED = 'PAUSED',
//   CLOSED = 'CLOSED',
// }

// export enum Currency {
//   EUR = 'EUR',
//   USD = 'USD',
//   GBP = 'GBP',
//   CHF = 'CHF',
//   AUD = 'AUD',
//   SGD = 'SGD',
//   JPY = 'JPY',
// }

// export enum CalendarType {
//   FIVE_DAYS = 'FIVE_DAYS',
//   SEVEN_DAYS = 'SEVEN_DAYS',
// }

// export enum LoanSyndication {
//   UNDERWRITTEN = 'UNDERWRITTEN',
//   BEST_EFFORT = 'BEST_EFFORT',
// }

// export enum LoanSecurityEnum {
//   SECURED = 'SECURED',
//   UNSECURED = 'UNSECURED',
//   SUBORDINATED = 'SUBORDINATED',
// }

// export enum LoanTerms {
//   TERM = 'TERM',
//   REVOLVING = 'REVOLVING',
// }

// export enum ReferenceData {
//   CATEGORY = 'category',
//   METRIC = 'metric',
//   UNIT = 'unit',
//   TARGET = 'target',
// }

// export enum keys {
//   ASSET_ISSUER_ID = 'issuerId',
//   ASSET_TYPE = 'assetType',
//   ASSET_STATUS = 'assetStatus',
//   ASSET_LIQUIDATION_HOUR = 'assetLiquidationHour',
//   ASSET_PROSPECTUS = 'assetProspectus',
//   ASSET_BANNER = 'assetBanner',
//   ASSET_TEAM = 'assetTeam',
//   ASSET_CLASSES_DATA = 'assetClassesData',
//   CLASS_ID = 'id',
//   CLASS_NAME = 'name',
//   CLASS_KEY = 'key',
//   CLASS_STATUS = 'status',
//   CLASS_ISIN = 'ISIN',
//   CLASS_TYPE = 'type',
//   CLASS_CURRENCY = 'currency',
//   CLASS_DECIMALISATION = 'decimalisation',
//   CLASS_CALENDAR = 'calendar',
//   CLASS_LEGAL_AGREEMENT = 'legalAgreement',
//   CLASS_DOCUMENTS = 'documents',
//   CLASS_TOTALSUPPLY = 'totalSupply',
//   CLASS_CLIENT_CATEGORIES = 'clientCategories',
//   CLASS_RISK_PROFILES = 'riskProfiles',
//   CLASS_SUBS_RULES = 'subscriptionRules',
//   RULE_CLASS_SUBS_TYPES = 'subscriptionTypes',
//   RULE_MIN_SUBS_QUANTITY = 'minSubscriptionQuantity',
//   RULE_MIN_SUBS_AMOUNT = 'minSubscriptionAmount',
//   RULE_MAX_SUBS_QUANTITY = 'maxSubscriptionQuantity',
//   RULE_MAX_SUBS_AMOUNT = 'maxSubscriptionAmount',
//   RULE_MAX_GLOBAL_SUBS_QUANTITY = 'maxGlobalSubscriptionQuantity',
//   RULE_MAX_GLOBAL_SUBS_AMOUNT = 'maxGlobalSubscriptionAmount',
//   RULE_MIN_GLOBAL_SUBS_QUANTITY = 'minGlobalSubscriptionQuantity',
//   RULE_MIN_GLOBAL_SUBS_AMOUNT = 'minGlobalSubscriptionAmount',
//   RULE_MAX_CANCELLATION_PERIOD = 'maxCancellationPeriod',
//   RULE_BYPASS_VALUATION_DATE = 'bypassValuationDate',
//   RULE_BYPASS_SETTLEMENT_DATE = 'bypassSettlementDate',
//   RULE_BYPASS_UNPAID_FLAG_DATE = 'bypassUnpaidFlagDate',
//   NAV = 'nav',
//   NAV_CURRENT_VALUE = 'navValueCurrent',
//   NAV_RECURRENCE = 'navRecurrence',
//   NAV_VALUE_HISTORY = 'navValueHistory',
//   CYCLE_INITIAL_SUBSCRIPTION = 'initialSubscriptionCycle',
//   CYCLE_SUBSCRIPTION = 'subscriptionCycle',
//   CYCLE_INITIAL_REDEMPTION = 'initialRedemptionCycle',
//   CYCLE_REDEMPTION = 'redemptionCycle',
//   FEES = 'fees',
//   COUPON = 'coupon',
//   REDEMPTION_FEES = 'redemptionFees',
//   INTEREST = 'interest',
//   FACILITY_AMOUNT = 'amount',
//   TOKEN_UNIT = 'tokenUnit',
//   LOAN_SYNDICATION = 'loanSyndication',
//   LOAN_SECURITY = 'loanSecurity',
//   SECURITY = 'security',
//   PARTICIPANTS = 'participants',
//   LOAN_TERMS = 'loanTerms',
//   LOAN_LIMIT = 'loanLimit',
// }

// // FIXME: SubscriptionRules are not used for now
// export interface SubscriptionRules {
//   [keys.RULE_CLASS_SUBS_TYPES]: OrderType;
//   [keys.RULE_MIN_SUBS_QUANTITY]: number;
//   [keys.RULE_MIN_SUBS_AMOUNT]: number;
//   [keys.RULE_MIN_GLOBAL_SUBS_QUANTITY]: number;
//   [keys.RULE_MAX_SUBS_QUANTITY]: number;
//   [keys.RULE_MAX_SUBS_AMOUNT]: number;
//   [keys.RULE_MAX_GLOBAL_SUBS_QUANTITY]: number;
//   [keys.RULE_MAX_GLOBAL_SUBS_AMOUNT]: number;
//   [keys.RULE_MAX_CANCELLATION_PERIOD]: number;
//   [keys.RULE_BYPASS_VALUATION_DATE]: boolean;
//   [keys.RULE_BYPASS_SETTLEMENT_DATE]: boolean;
//   [keys.RULE_BYPASS_UNPAID_FLAG_DATE]: boolean;
// }
// export const SubscriptionRulesExample: SubscriptionRules = {
//   [keys.RULE_CLASS_SUBS_TYPES]: OrderType.AMOUNT,
//   [keys.RULE_MIN_SUBS_QUANTITY]: 100,
//   [keys.RULE_MIN_SUBS_AMOUNT]: 10000,
//   [keys.RULE_MIN_GLOBAL_SUBS_QUANTITY]: 1000,
//   [keys.RULE_MAX_SUBS_QUANTITY]: 500,
//   [keys.RULE_MAX_SUBS_AMOUNT]: 50000,
//   [keys.RULE_MAX_GLOBAL_SUBS_QUANTITY]: 1000000,
//   [keys.RULE_MAX_GLOBAL_SUBS_AMOUNT]: 10000,
//   [keys.RULE_MAX_CANCELLATION_PERIOD]: 24 * 3600 * 1000, // FIXME: to be implemented
//   [keys.RULE_BYPASS_VALUATION_DATE]: false,
//   [keys.RULE_BYPASS_SETTLEMENT_DATE]: false,
//   [keys.RULE_BYPASS_UNPAID_FLAG_DATE]: false,
// };
// export interface NAVRules {
//   [keys.NAV_CURRENT_VALUE]: number;
//   [keys.NAV_RECURRENCE]: Recurrence;
//   [keys.NAV_VALUE_HISTORY]: Array<NAV>;
// }
// export const NAVRulesExample: NAVRules = {
//   [keys.NAV_CURRENT_VALUE]: 7845680.89,
//   [keys.NAV_RECURRENCE]: Recurrence.WEEKLY,
//   [keys.NAV_VALUE_HISTORY]: [NavExample],
// };

// export interface ClassData {
//   [keys.CLASS_ID]: string;
//   [keys.CLASS_NAME]: string;
//   [keys.CLASS_KEY]: string;
//   [keys.CLASS_STATUS]: AssetStatus;
//   [keys.CLASS_ISIN]: string;
//   [keys.CLASS_TYPE]: string;
//   [keys.CLASS_CURRENCY]: Currency;
//   [keys.CLASS_DECIMALISATION]: number;
//   [keys.CLASS_CALENDAR]: CalendarType;
//   [keys.CLASS_LEGAL_AGREEMENT]?: any;
//   [keys.CLASS_CLIENT_CATEGORIES]: Array<ClientCategory>;
//   [keys.CLASS_RISK_PROFILES]: Array<RiskProfile>;
//   [keys.CLASS_DOCUMENTS]?: Array<any>;
//   [keys.CLASS_SUBS_RULES]: SubscriptionRules;
//   [keys.NAV]: NAVRules;
//   [keys.CYCLE_INITIAL_SUBSCRIPTION]: AssetCycleTemplate;
//   [keys.CYCLE_SUBSCRIPTION]: AssetCycleTemplate;
//   [keys.CYCLE_INITIAL_REDEMPTION]: AssetCycleTemplate;
//   [keys.CYCLE_REDEMPTION]: AssetCycleTemplate;
//   [keys.FEES]: Fees;
//   [keys.COUPON]: Coupon;
//   [keys.REDEMPTION_FEES]: Fees;
//   [keys.INTEREST]: Interest;
//   [keys.FACILITY_AMOUNT]: number;
//   [keys.TOKEN_UNIT]?: TokenUnit;
// }
// export const AssetClassDataExample: ClassData = {
//   [keys.CLASS_ID]: 'lighkj5687yu3',
//   [keys.CLASS_NAME]: 'Class A',
//   [keys.CLASS_KEY]: 'classa',
//   [keys.CLASS_STATUS]: AssetStatus.OPEN,
//   [keys.CLASS_ISIN]: '9876FTYGHJKIO',
//   [keys.CLASS_TYPE]: 'Capitalisation',
//   [keys.CLASS_CURRENCY]: Currency.EUR,
//   [keys.CLASS_DECIMALISATION]: 18,
//   [keys.CLASS_CALENDAR]: CalendarType.SEVEN_DAYS,
//   [keys.CLASS_LEGAL_AGREEMENT]: [
//     'Legal_agreement_doc.pdf',
//     'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//   ],
//   [keys.CLASS_CLIENT_CATEGORIES]: [ClientCategory.PROFESSIONAL_CLIENTS],
//   [keys.CLASS_RISK_PROFILES]: [RiskProfile.DYNAMIC],
//   [keys.CLASS_DOCUMENTS]: [
//     [
//       'ept.pdf',
//       'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//     ],
//     [
//       'tpt.pdf',
//       'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//     ],
//     [
//       'kiid.pdf',
//       'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//     ],
//   ],
//   [keys.CLASS_SUBS_RULES]: SubscriptionRulesExample,
//   [keys.NAV]: NAVRulesExample,
//   [keys.CYCLE_INITIAL_SUBSCRIPTION]: AssetCycleTemplateExample,
//   [keys.CYCLE_SUBSCRIPTION]: AssetCycleTemplateExample,
//   [keys.CYCLE_INITIAL_REDEMPTION]: AssetCycleTemplateExample,
//   [keys.CYCLE_REDEMPTION]: AssetCycleTemplateExample,
//   [keys.FEES]: FeesExample,
//   [keys.COUPON]: CouponExample,
//   [keys.REDEMPTION_FEES]: FeesExample,
//   [keys.INTEREST]: InterestExample,
//   [keys.FACILITY_AMOUNT]: 54445540,
// };

// export interface AssetTeam {
//   name: string;
//   role: string;
//   url: string;
//   bio: string;
//   image: {
//     filename: string;
//     docId: string;
//   };
// }

// export interface AssetData {
//   [keys.ASSET_ISSUER_ID]?: string;
//   [keys.ASSET_TYPE]: AssetType;
//   [keys.ASSET_STATUS]: AssetStatus;
//   [keys.ASSET_LIQUIDATION_HOUR]: Date;
//   [keys.ASSET_PROSPECTUS]: any;
//   [keys.ASSET_BANNER]: any;
//   [keys.ASSET_TEAM]: Array<AssetTeam>;
//   [keys.FEES]?: Fees;
//   [keys.ASSET_CLASSES_DATA]?: Array<ClassData>;
//   [keys.LOAN_SYNDICATION]?: LoanSyndication;
//   [keys.LOAN_SECURITY]?: LoanSecurityEnum;
//   [keys.LOAN_TERMS]?: LoanTerms;
//   [keys.LOAN_LIMIT]?: number;
//   [keys.SECURITY]?: LoanSecurity;
//   [keys.PARTICIPANTS]?: Participants;
// }
// export const AssetDataExample: AssetData = {
//   [keys.ASSET_ISSUER_ID]: '9143c10c-c09d-4926-a31e-98b146aa60e8',
//   [keys.ASSET_TYPE]: AssetType.OPEN_END_FUND,
//   [keys.ASSET_STATUS]: AssetStatus.OPEN,
//   [keys.ASSET_LIQUIDATION_HOUR]: new Date('December 19, 1990 10:24:00'),
//   [keys.ASSET_PROSPECTUS]: [
//     'Prospectus_doc.pdf',
//     'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//   ],
//   [keys.ASSET_BANNER]: [
//     'banner.jpg',
//     'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//   ],
//   [keys.ASSET_TEAM]: [
//     {
//       name: 'Name',
//       role: 'Role',
//       url: 'https://www.linkedin.com/in/name',
//       bio: '',
//       image: {
//         filename: 'banner.jpg',
//         docId:
//           'https://unsplash.com/photos/L2oedF1AsH8/download?force=true&w=640',
//       },
//     },
//   ],
//   [keys.ASSET_CLASSES_DATA]: [AssetClassDataExample],
//   [keys.LOAN_SYNDICATION]: LoanSyndication.UNDERWRITTEN,
//   [keys.LOAN_SECURITY]: LoanSecurityEnum.SECURED,
//   [keys.LOAN_TERMS]: LoanTerms.REVOLVING,
//   [keys.LOAN_LIMIT]: 1000000,
//   [keys.SECURITY]: LoanSecurityExample,
//   [keys.PARTICIPANTS]: ParticipantsExample,
//   [keys.FEES]: FeesExample,
// };
