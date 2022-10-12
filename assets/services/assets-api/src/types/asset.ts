import { Frequency } from '@codefi-assets-and-payments/day-counter/dist/types/Frequency';
import { dayConvention } from '@codefi-assets-and-payments/day-counter/dist/types/DayCounterConventions';
import {
  AssetCycleTemplate,
  PaymentOption,
  keys as CycleKeys,
} from './asset/cycle';
import ErrorService from '../utils/errorService';
import { AssetType } from './asset/template';
import { OrderType } from './workflow/workflowInstances';
import { LoanFees, Fees, keys as FeesKeys, CustomFee } from './fees';
import { Interest } from './interest';
import { LoanSecurity } from './loanSecurity';
import { Participants } from './participants';
import { Token, TokenUnit, keys as TokenKeys } from './token';
import { Coupon, keys as CouponKeys } from './coupon';
import { Recurrence } from './recurrence';

export enum CalendarType {
  FIVE_DAYS = 'FIVE_DAYS',
  SEVEN_DAYS = 'SEVEN_DAYS',
}

export enum AssetCreationFlow {
  SINGLE_PARTY = 'SINGLE_PARTY',
  BI_PARTY = 'BI_PARTY',
  TRI_PARTY = 'TRI_PARTY',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
  AUD = 'AUD',
  SGD = 'SGD',
  JPY = 'JPY',
  HKD = 'HKD',
  RMB = 'RMB',
  CAD = 'CAD',
}

export enum LoanSyndication {
  UNDERWRITTEN = 'UNDERWRITTEN',
  BEST_EFFORT = 'BEST_EFFORT',
}

export enum LoanSecurityEnum {
  SECURED = 'SECURED',
  UNSECURED = 'UNSECURED',
  SUBORDINATED = 'SUBORDINATED',
}

export enum LoanTerms {
  TERM = 'TERM',
  REVOLVING = 'REVOLVING',
}

export enum ReferenceData {
  CATEGORY = 'category',
  METRIC = 'metric',
  UNIT = 'unit',
  TARGET = 'target',
}

export enum TeamKeys {
  NAME = 'name',
  ROLE = 'role',
  URL = 'url',
  BIO = 'bio',
  IMAGE = 'image',
  IMAGE__NAME = 'name',
  IMAGE__KEY = 'key',
}
export interface Team {
  [TeamKeys.NAME]: string;
  [TeamKeys.ROLE]: string;
  [TeamKeys.URL]: string;
  [TeamKeys.BIO]: string;
  [TeamKeys.IMAGE]: {
    [TeamKeys.IMAGE__NAME]: string;
    [TeamKeys.IMAGE__KEY]: string;
  };
}

export enum DocumentKeys {
  NAME = 'name',
  KEY = 'key',
}
export interface Document {
  [DocumentKeys.NAME]: string;
  [DocumentKeys.KEY]: string;
}

export type Docusign = Document & {
  url: string;
};

export enum GeneralDataKeys {
  NAME = 'name',
  SYMBOL = 'symbol',
  STATUS = 'status',
  DESCRIPTION = 'description',
  TYPE_SYNDICATION = 'typeSyndication',
  SECURITY = 'security',
  TERMS = 'terms',
  FACILITY_LIMIT = 'facilityLimit',
  LOAN_SECURITY = 'loanSecurity',
  PARTICIPANTS = 'participants',
  FEES = 'fees',
  BANK_INFORMATIONS = 'bankInformations',
  DOCUMENTS = 'documents',
  IMPACT = 'impact',
  BORROWER_DETAILS = 'borrowerDetails',
  MANAGEMENT_TEAM = 'managementTeam',
  MANAGEMENT_TEAM__TEAM = 'team',
  IMAGE = 'images',
  IMAGE__BANNER = 'banner',
  IMAGE__COVER = 'cover',
  STORAGE = 'storage',
}

export interface BankInformations {
  bankName: string;
  iban: string;
  swift: string;
  holderName?: string;
  accountNumber?: string;
  bankAddress?: string;
  bankAddress2?: string;
  bankCity?: string;
  bankCounty?: string;
  bankZip?: string;
  bankCountry?: string;
}

export interface BorrowerDetails {
  name: string;
  description: string;
  website: string;
  logo: string;
}

interface Target {
  metric: string;
  unit: string;
  target: string;
  category: string;
}

export interface Impact {
  targets: Target[];
}

export enum CollectibleStorageType {
  NONE = 'NONE',
  PUBLIC = 'PUBLIC',
  IPFS = 'IPFS',
}

export interface GeneralData {
  [GeneralDataKeys.NAME]: string;
  [GeneralDataKeys.SYMBOL]: string;
  [GeneralDataKeys.DESCRIPTION]: string;
  [GeneralDataKeys.TYPE_SYNDICATION]?: string;
  [GeneralDataKeys.SECURITY]?: string;
  [GeneralDataKeys.TERMS]?: string;
  [GeneralDataKeys.FACILITY_LIMIT]?: number;
  [GeneralDataKeys.LOAN_SECURITY]?: LoanSecurity;
  [GeneralDataKeys.PARTICIPANTS]?: Participants;
  [GeneralDataKeys.FEES]?: LoanFees | Fees;
  [GeneralDataKeys.BANK_INFORMATIONS]: BankInformations;
  [GeneralDataKeys.DOCUMENTS]: {
    docusign: Docusign;
    prospectus?: Document;
    kiid?: Document;
    other?: Document[];
  };
  [GeneralDataKeys.IMPACT]?: Impact;
  [GeneralDataKeys.BORROWER_DETAILS]?: BorrowerDetails;
  [GeneralDataKeys.MANAGEMENT_TEAM]?: {
    [GeneralDataKeys.MANAGEMENT_TEAM__TEAM]: Team[];
  };
  [GeneralDataKeys.IMAGE]?: {
    [GeneralDataKeys.IMAGE__BANNER]: Document;
    [GeneralDataKeys.IMAGE__COVER]: Document;
  };
  [GeneralDataKeys.STORAGE]?: CollectibleStorageType;
}

export enum ClassDataKeys {
  NAME = 'name',
  DESCRIPTION = 'description',
  IMAGE = 'image',
  ATTRIBUTES = 'attributes',
  KEY = 'key',
  ISIN = 'isin',
  TOKEN_UNIT = 'tokenUnit',
  FACILITY_AMOUNT = 'facilityAmount',
  CURRENCY = 'currency',
  SHARE_TYPE = 'shareType',
  DECIMALISATION = 'decimalisation',
  CALENDAR = 'calendar',
  COUPON_RATE = 'couponRate',
  COUPON_RATE__VALUE = 'rateValue',
  COUPON_RATE__FREQUENCY = 'rateFrequency',
  COUPON_RATE__PAYMENT_DATE = 'paymentDate',
  COUPON_RATE__PAYMENT_HOUR = 'paymentHour',
  COUPON_PAYMENT_FREQUENCY = 'couponPaymentFrequency',
  RULES = 'rules',
  PAYMENT_OPTIONS = 'paymentOptions',
  PAYMENT_OPTIONS__OPTION = 'option',
  RULES__SUBSCRIPTION_TYPE = 'subscriptionType',
  RULES__MIN_SUBSCRIPTION_AMOUNT = 'minSubscriptionAmount',
  RULES__MAX_SUBSCRIPTION_AMOUNT = 'maxSubscriptionAmount',
  RULES__MIN_SUBSCRIPTION_QUANTITY = 'minSubscriptionQuantity',
  RULES__MAX_SUBSCRIPTION_QUANTITY = 'maxSubscriptionQuantity',
  RULES__MIN_GLOBAL_SUBS_AMOUNT = 'minGlobalSubscriptionAmount',
  RULES__MAX_GLOBAL_SUBS_AMOUNT = 'maxGlobalSubscriptionAmount',
  RULES__MIN_GLOBAL_SUBS_QUANTITY = 'minGlobalSubscriptionQuantity',
  RULES__MAX_GLOBAL_SUBS_QUANTITY = 'maxGlobalSubscriptionQuantity',
  RULES__MAX_CANCELLATION_PERIOD = 'maxCancellationPeriod',
  NAV = 'nav',
  NAV__VALUE = 'value',
  INITIAL_SUBSCRIPTION = 'initialSubscription',
  SUBSCRIPTION = 'subscription',
  INITIAL_REDEMPTION = 'initialRedemption',
  REDEMPTION = 'redemption',
  INTEREST = 'interest',
  FEES = 'fees',
}

export enum SubscriptionRedemptionKeys {
  START_DATE = 'startDate',
  START_HOUR = 'startHour',
  CUTOFF_DATE = 'cutoffDate',
  CUTOFF_HOUR = 'cutoffHour',
  VALUATION_DATE = 'valuationDate',
  VALUATION_HOUR = 'valuationHour',
  SETTLEMENT_DATE = 'settlementDate',
  SETTLEMENT_HOUR = 'settlementHour',
  UNPAID_FLAG_DATE = 'unpaidFlagDate',
  UNPAID_FLAG_HOUR = 'unpaidFlagHour',
}
export interface ClassCycle {
  [SubscriptionRedemptionKeys.START_DATE]: string;
  [SubscriptionRedemptionKeys.START_HOUR]: string;
  [SubscriptionRedemptionKeys.CUTOFF_DATE]: string;
  [SubscriptionRedemptionKeys.CUTOFF_HOUR]: string;
  [SubscriptionRedemptionKeys.VALUATION_DATE]?: string;
  [SubscriptionRedemptionKeys.VALUATION_HOUR]?: string;
  [SubscriptionRedemptionKeys.SETTLEMENT_DATE]: string;
  [SubscriptionRedemptionKeys.SETTLEMENT_HOUR]: string;
  [SubscriptionRedemptionKeys.UNPAID_FLAG_DATE]?: string;
  [SubscriptionRedemptionKeys.UNPAID_FLAG_HOUR]?: string;
}

export const combineDateAndTime = (date: string, time: string) => {
  if (!date) {
    return null;
  }
  const formattedDate = new Date(date);
  if (time) {
    const timeHourAndMinutes = time.split(':');
    formattedDate.setHours(parseInt(timeHourAndMinutes[0]));
    formattedDate.setMinutes(parseInt(timeHourAndMinutes[1]));
  }
  return formattedDate;
};

export const craftAssetCycleTemplate = (
  assetType: AssetType,
  classCycle: ClassCycle,
  paymentOption: PaymentOption,
): AssetCycleTemplate => {
  const startDate = combineDateAndTime(
    classCycle[SubscriptionRedemptionKeys.START_DATE],
    classCycle[SubscriptionRedemptionKeys.START_HOUR],
  );

  const cutoffDate = combineDateAndTime(
    classCycle[SubscriptionRedemptionKeys.CUTOFF_DATE],
    classCycle[SubscriptionRedemptionKeys.CUTOFF_HOUR],
  );

  const valuationDate = combineDateAndTime(
    classCycle[SubscriptionRedemptionKeys.VALUATION_DATE],
    classCycle[SubscriptionRedemptionKeys.VALUATION_HOUR],
  );

  const settlementDate = combineDateAndTime(
    classCycle[SubscriptionRedemptionKeys.SETTLEMENT_DATE],
    classCycle[SubscriptionRedemptionKeys.SETTLEMENT_HOUR],
  );

  const unpaidFlagDate = combineDateAndTime(
    classCycle[SubscriptionRedemptionKeys.UNPAID_FLAG_DATE],
    classCycle[SubscriptionRedemptionKeys.UNPAID_FLAG_HOUR],
  );

  return {
    [CycleKeys.TEMPLATE_FIRST_START_DATE]: startDate,
    [CycleKeys.TEMPLATE_FIRST_CUT_OFF_DATE]: cutoffDate,
    [CycleKeys.TEMPLATE_FIRST_VALUATION_DATE]: valuationDate,
    [CycleKeys.TEMPLATE_FIRST_SETTLEMENT_DATE]: settlementDate,
    [CycleKeys.TEMPLATE_FIRST_UNPAID_FLAG_DATE]: unpaidFlagDate,
    [CycleKeys.TEMPLATE_RECURRENCE]:
      assetType === AssetType.OPEN_END_FUND ? Recurrence.NEXT_DAY : undefined,
    [CycleKeys.TEMPLATE_PAYMENT_OPTION]:
      paymentOption || PaymentOption.AT_ORDER_CREATION,
  };
};

export interface SubscriptionRules {
  [ClassDataKeys.RULES__SUBSCRIPTION_TYPE]: OrderType;
  [ClassDataKeys.RULES__MIN_SUBSCRIPTION_AMOUNT]: number;
  [ClassDataKeys.RULES__MAX_SUBSCRIPTION_AMOUNT]: number;
  [ClassDataKeys.RULES__MIN_SUBSCRIPTION_QUANTITY]?: number;
  [ClassDataKeys.RULES__MAX_SUBSCRIPTION_QUANTITY]?: number;
  [ClassDataKeys.RULES__MIN_GLOBAL_SUBS_AMOUNT]?: number;
  [ClassDataKeys.RULES__MAX_GLOBAL_SUBS_AMOUNT]?: number;
  [ClassDataKeys.RULES__MAX_CANCELLATION_PERIOD]?: number;
}

/**
 * [Retrieve coupon if valid]
 */
export const retrieveCouponIfValid = (
  classData: ClassData,
  settlementDate: Date,
): Coupon => {
  let paymentDate: Date;
  if (
    classData[ClassDataKeys.COUPON_RATE][
      ClassDataKeys.COUPON_RATE__PAYMENT_DATE
    ]
  ) {
    paymentDate = new Date(
      classData[ClassDataKeys.COUPON_RATE][
        ClassDataKeys.COUPON_RATE__PAYMENT_DATE
      ],
    );
  }
  if (
    classData[ClassDataKeys.COUPON_RATE][
      ClassDataKeys.COUPON_RATE__PAYMENT_HOUR
    ]
  ) {
    paymentDate.setHours(
      parseInt(
        classData[ClassDataKeys.COUPON_RATE][
          ClassDataKeys.COUPON_RATE__PAYMENT_HOUR
        ],
      ),
    );
  }

  if (!paymentDate || paymentDate > settlementDate)
    return {
      [CouponKeys.COUPON_PAYMENT_DATE]: paymentDate,
      [CouponKeys.PAYMENT_FREQUENCY]:
        classData[ClassDataKeys.COUPON_RATE][
          ClassDataKeys.COUPON_RATE__FREQUENCY
        ],
      [CouponKeys.RATE_FREQUENCY]:
        classData[ClassDataKeys.COUPON_PAYMENT_FREQUENCY],
      [CouponKeys.RATE_VALUE]:
        classData[ClassDataKeys.COUPON_RATE][ClassDataKeys.COUPON_RATE__VALUE],
      [CouponKeys.COUPON_CALENDAR]: dayConvention.ActualActual,
    };
  else
    ErrorService.throwError(
      `first coupon payment date ${paymentDate} can not be before settlement date ${settlementDate}`,
    );
};

export interface ClassData {
  [ClassDataKeys.NAME]: string;
  [ClassDataKeys.KEY]: string;
  [ClassDataKeys.ISIN]?: string;
  [ClassDataKeys.TOKEN_UNIT]?: TokenUnit;
  [ClassDataKeys.FACILITY_AMOUNT]?: number;
  [ClassDataKeys.CURRENCY]: Currency;
  [ClassDataKeys.SHARE_TYPE]?: string;
  [ClassDataKeys.DECIMALISATION]?: string;
  [ClassDataKeys.CALENDAR]?: CalendarType;
  [ClassDataKeys.COUPON_RATE]?: {
    [ClassDataKeys.COUPON_RATE__VALUE]: string;
    [ClassDataKeys.COUPON_RATE__FREQUENCY]: Frequency;
    [ClassDataKeys.COUPON_RATE__PAYMENT_DATE]: string;
    [ClassDataKeys.COUPON_RATE__PAYMENT_HOUR]: string;
  };
  [ClassDataKeys.COUPON_PAYMENT_FREQUENCY]?: Frequency;
  [ClassDataKeys.RULES]: SubscriptionRules;
  [ClassDataKeys.PAYMENT_OPTIONS]?: {
    [ClassDataKeys.PAYMENT_OPTIONS__OPTION]: PaymentOption;
  };
  [ClassDataKeys.NAV]: {
    [ClassDataKeys.NAV__VALUE]: number;
  };
  [ClassDataKeys.INITIAL_SUBSCRIPTION]: ClassCycle;
  [ClassDataKeys.SUBSCRIPTION]?: ClassCycle;
  [ClassDataKeys.INITIAL_REDEMPTION]?: ClassCycle;
  [ClassDataKeys.REDEMPTION]?: ClassCycle;
  [ClassDataKeys.INTEREST]?: Interest;

  [ClassDataKeys.FEES]?: {
    [FeesKeys.ENTRY_ACQUIRED]: number;
    [FeesKeys.ENTRY_NON_ACQUIRED]: number;
    [FeesKeys.EXIT_ACQUIRED]: number;
    [FeesKeys.EXIT_NON_ACQUIRED]: number;
    [FeesKeys.SUBSCRIPTION_CUSTOM_FEES]: CustomFee[];
    [FeesKeys.REDEMPTION_CUSTOM_FEES]: CustomFee[];
  };
  [ClassDataKeys.DESCRIPTION]?: string;
  [ClassDataKeys.IMAGE]?: Document;
  [ClassDataKeys.ATTRIBUTES]?: any[];
}

export enum AssetDataKeys {
  TYPE = 'type',
  ASSET = 'asset',
  CLASS = 'class',
}

export interface AssetData {
  [AssetDataKeys.TYPE]: AssetType;
  [AssetDataKeys.ASSET]: GeneralData;
  [AssetDataKeys.CLASS]: ClassData[];
}

export enum AssetClassRule {
  KEYS_TO_CHECK = 'keyToCheck',
  HAS_RECURRENT_CYCLE = 'hasRecurrentCycle',
  HAS_CYCLES = 'hasCycles',
  SUBSCRIPTION_TYPES = 'subscriptionTypes',
  HAS_SIMPLIFIED_DATES = 'hasSimplifiedDates',
  FLOWS = 'flows',
}

/**
 * [Retrieve asset/token currency]
 */
export const retrieveTokenCurrency = (
  token: Token,
  classDataKey: string,
): Currency => {
  try {
    const classData = token?.[TokenKeys.ASSET_DATA]?.[AssetDataKeys.CLASS];
    const matchClassData = classData?.find(
      (assetClass) => assetClass[ClassDataKeys.KEY] === classDataKey,
    );
    const tokenCurrency: Currency = matchClassData?.[ClassDataKeys.CURRENCY];

    return tokenCurrency || Currency.USD;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'retrieving asset/token currency',
      'retrieveTokenCurrency',
      false,
      500,
    );
  }
};

export const assetClassRules: {
  [type in AssetType]: {
    [rule in AssetClassRule]: any;
  };
} = {
  [AssetType.OPEN_END_FUND]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.INITIAL_REDEMPTION,
      ClassDataKeys.SUBSCRIPTION,
      ClassDataKeys.REDEMPTION,
      ClassDataKeys.CURRENCY,
      ClassDataKeys.KEY,
      ClassDataKeys.ISIN,
      ClassDataKeys.RULES,
      ClassDataKeys.PAYMENT_OPTIONS,
    ],
    [AssetClassRule.HAS_RECURRENT_CYCLE]: true,
    [AssetClassRule.HAS_CYCLES]: true,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: false,
    [AssetClassRule.FLOWS]: [
      AssetCreationFlow.SINGLE_PARTY,
      AssetCreationFlow.BI_PARTY,
      AssetCreationFlow.TRI_PARTY,
    ],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY, OrderType.AMOUNT],
  },
  [AssetType.CLOSED_END_FUND]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.CURRENCY,
      ClassDataKeys.KEY,
      ClassDataKeys.RULES,
    ],
    [AssetClassRule.HAS_CYCLES]: true,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: false,
    [AssetClassRule.FLOWS]: [
      AssetCreationFlow.SINGLE_PARTY,
      AssetCreationFlow.BI_PARTY,
      AssetCreationFlow.TRI_PARTY,
    ],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY, OrderType.AMOUNT],
  },
  [AssetType.FIXED_RATE_BOND]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.CURRENCY,
      ClassDataKeys.KEY,
      ClassDataKeys.RULES,
    ],
    [AssetClassRule.HAS_CYCLES]: true,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: false,
    [AssetClassRule.FLOWS]: [
      AssetCreationFlow.SINGLE_PARTY,
      AssetCreationFlow.BI_PARTY,
      AssetCreationFlow.TRI_PARTY,
    ],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY],
  },
  [AssetType.CARBON_CREDITS]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.KEY,
    ],
    [AssetClassRule.HAS_CYCLES]: false,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: true,
    [AssetClassRule.FLOWS]: [AssetCreationFlow.BI_PARTY],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY, OrderType.AMOUNT],
  },
  [AssetType.PHYSICAL_ASSET]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.CURRENCY,
      ClassDataKeys.KEY,
      ClassDataKeys.FEES,
      ClassDataKeys.RULES,
    ],
    [AssetClassRule.HAS_CYCLES]: true,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: true,
    [AssetClassRule.FLOWS]: [
      AssetCreationFlow.SINGLE_PARTY,
      AssetCreationFlow.BI_PARTY,
      AssetCreationFlow.TRI_PARTY,
    ],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY, OrderType.AMOUNT],
  },
  [AssetType.CURRENCY]: {
    [AssetClassRule.KEYS_TO_CHECK]: [ClassDataKeys.CURRENCY, ClassDataKeys.KEY],
    [AssetClassRule.HAS_CYCLES]: false,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: true,
    [AssetClassRule.FLOWS]: [AssetCreationFlow.SINGLE_PARTY],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY],
  },
  [AssetType.COLLECTIBLE]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.KEY,
      ClassDataKeys.NAME,
      ClassDataKeys.DESCRIPTION,
      ClassDataKeys.IMAGE,
    ],
    [AssetClassRule.HAS_CYCLES]: false,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: true,
    [AssetClassRule.FLOWS]: [AssetCreationFlow.SINGLE_PARTY],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY],
  },
  [AssetType.SYNDICATED_LOAN]: {
    [AssetClassRule.KEYS_TO_CHECK]: [
      ClassDataKeys.INITIAL_SUBSCRIPTION,
      ClassDataKeys.CURRENCY,
      ClassDataKeys.KEY,
      ClassDataKeys.INTEREST,
      ClassDataKeys.FACILITY_AMOUNT,
    ],
    [AssetClassRule.HAS_CYCLES]: true,
    [AssetClassRule.HAS_RECURRENT_CYCLE]: false,
    [AssetClassRule.HAS_SIMPLIFIED_DATES]: true,
    [AssetClassRule.FLOWS]: [
      AssetCreationFlow.SINGLE_PARTY,
      AssetCreationFlow.BI_PARTY,
      AssetCreationFlow.TRI_PARTY,
    ],
    [AssetClassRule.SUBSCRIPTION_TYPES]: [OrderType.QUANTITY, OrderType.AMOUNT],
  },
};
