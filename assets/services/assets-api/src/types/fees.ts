export enum FeesScope {
  TOKEN = 'token',
  ASSETCLASS = 'assetClass',
  TOKEN_INVESTOR = 'tokenInvestor',
  ASSETCLASS_INVESTOR = 'assetClassInvestor',
}

export enum keys {
  ENTRY_ACQUIRED = 'acquiredEntryFees',
  ENTRY_NON_ACQUIRED = 'nonAcquiredEntryFees',
  EXIT_ACQUIRED = 'acquiredExitFees',
  EXIT_NON_ACQUIRED = 'nonAcquiredExitFees',
  ESTABLISHMENT = 'establishmentFees',
  FACILITY = 'facilityFees',
  TRUSTEE = 'trusteeFees',
  SUBSCRIPTION_CUSTOM_FEES = 'subscriptionCustomFeesValue',
  REDEMPTION_CUSTOM_FEES = 'redemptionCustomFeesValue',
}

export interface CustomFee {
  name: string;
  value: string;
}

export interface LoanFees extends Fees {
  [keys.ESTABLISHMENT]: number;
  [keys.FACILITY]: number;
  [keys.TRUSTEE]: number;
}

export interface Fees {
  [keys.ENTRY_ACQUIRED]: number;
  [keys.ENTRY_NON_ACQUIRED]: number;
  [keys.EXIT_ACQUIRED]: number;
  [keys.EXIT_NON_ACQUIRED]: number;
  [keys.SUBSCRIPTION_CUSTOM_FEES]?: CustomFee[];
  [keys.REDEMPTION_CUSTOM_FEES]?: CustomFee[];
}

export const FeesExample: Fees = {
  [keys.ENTRY_ACQUIRED]: 0.0154,
  [keys.ENTRY_NON_ACQUIRED]: 0.01,
  [keys.EXIT_ACQUIRED]: 0.0154,
  [keys.EXIT_NON_ACQUIRED]: 0.01,
};

export const LoanFeesExample: LoanFees = {
  ...FeesExample,
  [keys.ESTABLISHMENT]: 0.01,
  [keys.FACILITY]: 0.0154,
  [keys.TRUSTEE]: 0.01,
};
