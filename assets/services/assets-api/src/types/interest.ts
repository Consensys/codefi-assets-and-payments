export enum BaseInterestRateType {
  FIXED = 'FIXED',
  FLOATING = 'FLOATING',
}

export enum BaseInterestRate {
  BBSW = 'BBSW',
  CASH_RATE = 'CASH_RATE',
}

export enum keys {
  BASE_RATE_TYPE = 'baseRateType',
  BASE_RATE = 'baseRate',
  MARGIN = 'margin',
  DEFAULT_RATE = 'defaultRate',
}

export interface Interest {
  [keys.BASE_RATE_TYPE]: BaseInterestRateType;
  [keys.BASE_RATE]: BaseInterestRate;
  [keys.MARGIN]: number;
  [keys.DEFAULT_RATE]: number;
}

export const InterestExample: Interest = {
  [keys.BASE_RATE_TYPE]: BaseInterestRateType.FIXED,
  [keys.BASE_RATE]: BaseInterestRate.CASH_RATE,
  [keys.MARGIN]: 0.0154,
  [keys.DEFAULT_RATE]: 0.01,
};
