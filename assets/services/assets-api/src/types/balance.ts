import { TokenState } from './states';

export enum keys {
  IDENTIFIERS = 'identifiers',
  CLASSES = 'classes',
  CLASSES__NAME = 'name',
  CLASSES__BALANCES = 'balances',
  CLASSES__BALANCES__STATES = 'states',
  CLASSES__BALANCES__STATES__NAME = 'name',
  CLASSES__BALANCES__STATES__BALANCE = 'balance',
  CLASSES__BALANCES__STATES__BALANCE_SPENDABLE = 'spendableBalance',
  CLASSES__BALANCES__TOTAL = 'total',
  CLASSES__BALANCES__TOTAL_SPENDABLE = 'spendableTotal',
  TOTAL = 'total',
  TOTAL_SPENDABLE = 'spendableTotal',
}

export interface ERC1400StateBalance {
  [keys.CLASSES__BALANCES__STATES__NAME]: TokenState;
  [keys.CLASSES__BALANCES__STATES__BALANCE]: number;
  [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: number;
}

export interface ERC1400ClassBalances {
  [keys.CLASSES__BALANCES__STATES]: Array<ERC1400StateBalance>;
  [keys.CLASSES__BALANCES__TOTAL]: number;
  [keys.CLASSES__BALANCES__TOTAL_SPENDABLE]: number;
}

export interface ERC20Balances {
  [keys.TOTAL]: number;
}

export interface ERC721Balances {
  [keys.IDENTIFIERS]: Array<string>;
  [keys.TOTAL]: number;
}

export interface ERC1400Balances {
  [keys.CLASSES]: Array<{
    [keys.CLASSES__NAME]: string;
    [keys.CLASSES__BALANCES]: ERC1400ClassBalances;
  }>;
  [keys.TOTAL]: number;
  [keys.TOTAL_SPENDABLE]: number;
}

export const ERC20BalancesExample: ERC20Balances = {
  [keys.TOTAL]: 10000,
};

export const ERC721BalancesExample: ERC721Balances = {
  [keys.IDENTIFIERS]: ['1633467', '151890', '1633580'],
  [keys.TOTAL]: 3,
};

export const ERC1400BalancesExample: ERC1400Balances = {
  [keys.CLASSES]: [
    {
      [keys.CLASSES__NAME]: 'classA',
      [keys.CLASSES__BALANCES]: {
        [keys.CLASSES__BALANCES__STATES]: [
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.LOCKED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.RESERVED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.ISSUED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 10000,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 10000,
          },
        ],
        [keys.CLASSES__BALANCES__TOTAL]: 10000,
        [keys.CLASSES__BALANCES__TOTAL_SPENDABLE]: 10000,
      },
    },
    {
      [keys.CLASSES__NAME]: 'classB',
      [keys.CLASSES__BALANCES]: {
        [keys.CLASSES__BALANCES__STATES]: [
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.LOCKED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.RESERVED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.ISSUED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
        ],
        [keys.CLASSES__BALANCES__TOTAL]: 0,
        [keys.CLASSES__BALANCES__TOTAL_SPENDABLE]: 0,
      },
    },
    {
      [keys.CLASSES__NAME]: 'classI',
      [keys.CLASSES__BALANCES]: {
        [keys.CLASSES__BALANCES__STATES]: [
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.LOCKED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.RESERVED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 0,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 0,
          },
          {
            [keys.CLASSES__BALANCES__STATES__NAME]: TokenState.ISSUED,
            [keys.CLASSES__BALANCES__STATES__BALANCE]: 6000,
            [keys.CLASSES__BALANCES__STATES__BALANCE_SPENDABLE]: 5500,
          },
        ],
        [keys.CLASSES__BALANCES__TOTAL]: 6000,
        [keys.CLASSES__BALANCES__TOTAL_SPENDABLE]: 5500,
      },
    },
  ],
  [keys.TOTAL]: 16000,
  [keys.TOTAL_SPENDABLE]: 15500,
};
