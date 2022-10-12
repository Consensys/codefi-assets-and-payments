import { IUser } from 'User';
import { AssetType, OrderType } from './templatesTypes';

export enum CycleStatus {
  NOT_STARTED = 'NOT_STARTED',
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',
  SUBSCRIPTION_ENDED = 'SUBSCRIPTION_ENDED',
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
export interface AssetCycleOffset {
  days: number;
  type: OffsetType;
  origin: CycleDate;
  hour: number;
}

export const AssetCycleOffsetExample: AssetCycleOffset = {
  days: 2,
  type: OffsetType.AFTER,
  origin: CycleDate.START,
  hour: 14,
};

export interface AssetCycleTemplate {
  firstStartDate?: Date;
  firstCutOffDate?: Date;
  firstValuationDate?: Date;
  firstSettlementDate?: Date;
  firstUnpaidFlagDate?: Date;
  offsetCutOff?: AssetCycleOffset;
  offsetValuation?: AssetCycleOffset;
  offsetSettlement?: AssetCycleOffset;
  offsetUnpaidFlag?: AssetCycleOffset;
  cycleRecurrence?: Recurrence;
  paymentOption: PaymentOption;
}

export enum PaymentOption {
  AT_ORDER_CREATION = 'AT_ORDER_CREATION',
  BETWEEN_CUTOFF_AND_SETTLEMENT = 'BETWEEN_CUTOFF_AND_SETTLEMENT',
}

export interface Participants {
  borrowerId: string;
  underwriterId: string;
  borrower?: IUser;
  underwriter?: IUser;
}

export enum LoanSecurityType {
  CASH = 'CASH',
  PROPERTY = 'PROPERTY',
  ASSETS = 'ASSETS',
}

export interface LoanSecurity {
  identifier: string;
  type: LoanSecurityType;
  description: string;
  trustee: string;
  documents: Document[];
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

export interface ShareClass {
  loanContributionIncrements: string;
}


export enum Term {
  fullRepayment = 'Full repayment at maturity',
  viaInstallment = 'Repayment via instalments during loan period',
}

export interface LoanRepayment {
  schedule: string;
  terms: string;
  instalmentsSchedule: string;
}

export enum TokenUnit {
  token = 'token',
  tonne = 'tonne',
}

export interface CustomFee {
  name: string;
  value: string;
}

export interface LoanFees extends Fees {
  establishmentFees: number;
  facilityFees: number;
  trusteeFees: number;
}

export interface Fees {
  acquiredEntryFees: number;
  nonAcquiredEntryFees: number;
  acquiredExitFees: number;
  nonAcquiredExitFees: number;
  subscriptionCustomFeesValue?: CustomFee[];
  redemptionCustomFeesValue?: CustomFee[];
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

export enum CalendarType {
  FIVE_DAYS = 'FIVE_DAYS',
  SEVEN_DAYS = 'SEVEN_DAYS',
}

export enum AssetCreationFlow {
  SINGLE_PARTY = 'SINGLE_PARTY',
  BI_PARTY = 'BI_PARTY',
  TRI_PARTY = 'TRI_PARTY',
}

export enum AssetStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
  AUD = 'AUD',
  SGD = 'SGD',
  JPY = 'JPY',
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

export interface Team {
  name: string;
  role: string;
  url: string;
  bio: string;
  image: {
    name: string;
    key: string;
  };
}

export interface Document {
  name: string;
  key: string;
}

export type Docusign = Document & {
  url: string;
};

export interface BankInformation {
  country: string;
  currency: string;
  currencyCode: string;
  iban: string;
  recipientName: string;
  accountNumber: string;
  routingNumber: string;
  institutionNumber: string;
  transitNumber: string;
  bsbCode: string;
  sortCode: string;
}

export interface BankInformations {
  holderName: string;
  accountNumber: string;
  bankName: string;
  iban: string;
  swift: string;
  bankAddress: string;
  bankAddress2: string;
  bankCity: string;
  bankCounty: string;
  bankZip: string;
  bankCountry: string;
  accountType?: string;
  bankState?: string;
  bankZIP?: string;
  recipientBankAddress1?: string;
  recipientBankAddress2?: string;
  recipientBankCity?: string;
  recipientBankZIP?: string;
  recipientCountry?: string;
  recipientEmail?: string;
  recipientFullName?: string;
  recipientState?: string;
  bsb?: string;
  achRoutingNumber?: string;
  wireRoutingNumber?: string;
}

export interface BorrowerDetails {
  name: string;
  description: string;
  website: string;
  logo: string;
  generaldescription: string;
}

export interface ImpactIntermediaryDetails {
  businessExperience: string;
  historyWithBorrower: string;
  impactIntermediaryCountry: string;
  impactIntermediaryName: string;
  proposedOnBehalfOfaBorrower: string;
  website: string;
}

export interface LoanGeneralDetails {
  borrowerbrief: string;
  emailforlenders: string;
  featuredloan: string;
}

export interface LoanImpacts {
  borrowerImpact: string;
  borrowerImpactLinks: string;
  description: string;
  documents: Document[];
}

export interface LoanSummaryInformation {
  amount: string;
  borrowerCityState: string;
  borrowerCountry: string;
  loanInterestRate: string;
  loanPeriod: string;
  loanshort: string;
  pitchUrl: string;
}

export interface LoanViabilityCommercialImpact {
  benefits: string;
  otherFunding: string;
  reasonsByBorrower: string;
  securities: string;
  viability: string;
  documents: Document[];
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

export interface GeneralData {
  name: string;
  symbol: string;
  status: AssetStatus;
  description: string;
  typeSyndication: string;
  security: string;
  terms: string;
  facilityLimit: number;
  loanSecurity: LoanSecurity;
  participants: Participants;
  fees: LoanFees | Fees;
  bankInformations: BankInformations;
  bankInformation: BankInformation;
  documents: {
    docusign: Docusign;
    prospectus: Document;
    kiid: Document;
    other: Document[];
  };
  impact: Impact;
  borrowerDetails: BorrowerDetails;
  impactIntermediaryDetails: ImpactIntermediaryDetails;
  loanGeneralDetails: LoanGeneralDetails;
  loanImpacts: LoanImpacts;
  loanSummaryInformation: LoanSummaryInformation;
  loanViabilityAndCommercialImpact: LoanViabilityCommercialImpact;
  managementTeam: {
    team: Team[];
  };
  images: {
    banner: Document;
    cover: Document;
  };
}

export interface ClassCycle {
  startDate: string;
  startHour: string;
  cutoffDate: string;
  cutoffHour: string;
  valuationDate: string;
  valuationHour: string;
  settlementDate: string;
  settlementHour: string;
  unpaidFlagDate: string;
  unpaidFlagHour: string;
  settlementPeriodInDays?: string;
}

export const combineDateAndTime = (
  date?: string,
  time?: string,
): Date | undefined => {
  if (!date) {
    return undefined;
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
    classCycle.startDate,
    classCycle.startHour,
  );

  const cutoffDate = combineDateAndTime(
    classCycle.cutoffDate,
    classCycle.cutoffHour,
  );

  const valuationDate = combineDateAndTime(
    classCycle.valuationDate,
    classCycle.valuationHour,
  );

  const settlementDate = combineDateAndTime(
    classCycle.settlementDate,
    classCycle.settlementHour,
  );

  const unpaidFlagDate = combineDateAndTime(
    classCycle.unpaidFlagDate,
    classCycle.unpaidFlagHour,
  );

  return {
    firstStartDate: startDate,
    firstCutOffDate: cutoffDate,
    firstValuationDate: valuationDate,
    firstSettlementDate: settlementDate,
    firstUnpaidFlagDate: unpaidFlagDate,
    cycleRecurrence:
      assetType === AssetType.OPEN_END_FUND ? Recurrence.NEXT_DAY : undefined,
    paymentOption: paymentOption || PaymentOption.AT_ORDER_CREATION,
  };
};

export interface SubscriptionRules {
  subscriptionType: OrderType;
  minSubscriptionAmount: number;
  maxSubscriptionAmount: number;
  minSubscriptionQuantity: number;
  maxSubscriptionQuantity: number;
  minRedemptionQuantity: number;
  maxRedemptionQuantity: number;
  minGlobalSubscriptionAmount: number;
  maxGlobalSubscriptionAmount: number;
  maxCancellationPeriod: number;
}

export interface ClassData {
  name: string;
  key: string;
  isin: string;
  tokenUnit: TokenUnit;
  status: AssetStatus;
  facilityAmount: number;
  currency: Currency;
  shareType: string;
  decimalisation: string;
  calendar: string;
  couponRate: {
    rateValue: string;
    paymentDate: string;
    paymentHour: string;
    rateFrequency: any;
  };
  couponPaymentFrequency: any;
  rules: SubscriptionRules;
  paymentOptions: {
    option: PaymentOption;
  };
  nav: {
    value: number;
  };
  initialSubscription: ClassCycle;
  subscription: ClassCycle;
  initialRedemption: ClassCycle;
  redemption: ClassCycle;
  interest: Interest;
  fees: {
    acquiredEntryFees: number;
    nonAcquiredEntryFees: number;
    acquiredExitFees: number;
    nonAcquiredExitFees: number;
    managementFees: number;
    subscriptionCustomFeesValue: CustomFee[];
    redemptionCustomFeesValue: CustomFee[];
  };
  shareClass: ShareClass;
  loanRepayment: LoanRepayment;
}

export interface AssetData {
  type: AssetType;
  asset: GeneralData;
  class: ClassData[];
}
