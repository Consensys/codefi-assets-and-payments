import ErrorService from 'src/utils/errorService';

import BigNumber from 'bignumber.js';

export const MAX_SUPPORTED_INTEGER = 1000000000000000;
export const MIN_SUPPORTED_INTEGER = 0;

/**
 * Function if integer is not too big in order to avoid 'overflow' in database
 */
export const checkIntegerFormat = (
  quantity: number,
  amount: number,
): boolean => {
  try {
    if (quantity >= MAX_SUPPORTED_INTEGER) {
      ErrorService.throwError(
        `quantity too big (${quantity}: larger or equal to ${MAX_SUPPORTED_INTEGER})`,
      );
    } else if (amount >= MAX_SUPPORTED_INTEGER) {
      ErrorService.throwError(
        `amount too big (${amount}: larger or equal to ${MAX_SUPPORTED_INTEGER})`,
      );
    }

    return true;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'checking integer format',
      'checkIntegerFormat',
      false,
      500,
    );
  }
};

/**
 * [Remove decimals from balances]
 *
 * The purpose of this function is to remove decimals from balances.
 * More specifically, the token balances in the smart contract have 18 decimals.
 * We don't want to display those 18 decimals on the UI which is why we remove them here.
 *
 * This function is used everytime we read from the blockchain.
 *
 */
export const removeDecimalsFromBalances = (bigNumber, decimals): number => {
  try {
    const balanceBn = new BigNumber(bigNumber);
    const decimalsBn = new BigNumber(10 ** decimals);
    const formattedBalanceBn = balanceBn.dividedBy(decimalsBn);
    return parseFloat(formattedBalanceBn.toString());
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'removing decimals from balances',
      'removeDecimalsFromBalances',
      false,
      500,
    );
  }
};

/**
 * [Add decimals and convert to hex]
 *
 * The purpose of this function is to add decimals to token amounts before
 * before asking for a token operation (issuance, transfer, etc.).
 * More specifically, the token balances in the smart contract have 18 decimals.
 * When a user asks for a transfer of 100 tokens, we need to ask for a transfer
 * of 100000000000000000000 tokens in reality because the tokens have 18 decimals.
 *
 * Furthermore, numbers higher 10^20 are not handled by javascript which is why
 * we need to convert those into hexadecimal strings.
 *
 * This function is used everytime we write on the blockchain.
 *
 */
export const addDecimalsAndConvertToHex = (number, decimals): string => {
  try {
    const balanceBn = new BigNumber(number);
    const decimalsBn = new BigNumber(10 ** decimals);
    const formattedBalanceBn = balanceBn.multipliedBy(decimalsBn);
    const formattedBalanceHex = '0x'.concat(formattedBalanceBn.toString(16));
    return formattedBalanceHex;
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
      error,
      'adding decimals and converting to hex',
      'addDecimalsAndConvertToHex',
      false,
      500,
    );
    throw new Error(`addDecimalsAndConvertToHex --> ${error.message}`);
  }
};

/**
 * [Add Numbers By Converting Into BigNumber]
 *
 * The purpose of this function is to add numbers after converting
 * them to BigNumber and then return the Number
 *
 * This function is used everytime we add two numbers.
 *
 */
export const addNumbersByConvertingIntoBigNumber = (number1, number2): number => {
  try {
    const number1Bn = new BigNumber(number1);
    const number2Bn = new BigNumber(number2);
    const sumBn = number1Bn.plus(number2Bn);
    return parseFloat(sumBn.toString());
  } catch (error) {
    ErrorService.logAndThrowFunctionError(
        error,
        'adding Numbers by converting to BigNumber first',
        'addNumbersByConvertingIntoBigNumber',
        false,
        500,
    );
    throw new Error(`addNumbersByConvertingIntoBigNumber --> ${error.message}`);
  }
};