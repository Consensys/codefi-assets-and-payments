import { getConfig } from './configUtils';

export const getCurrencyCode = (currency: string): string => {
  switch (currency) {
    case 'YUAN':
      return 'CNY';
    case 'YEN':
      return 'JPY';
    default:
      return currency;
  }
};

export const currencyFormat = (
  amount: number,
  currency = 'USD',
  locale?: string,
  decimalPoints?: number,
): string => {
  try {
    return Number(amount || 0)
      .toLocaleString(locale || getConfig().locale, {
        style: 'currency',
        currency: getCurrencyCode(currency),
        minimumFractionDigits: decimalPoints || 0,
      })
      .replace('A$', '$'); // display AUD as '$';
  } catch {
    return `${amount || 0} ${currency}`;
  }
};

export const decimalisationValue = (
  decimalisation: string,
): string | undefined => {
  if (!decimalisation) {
    return undefined;
  }

  const decimalisationValues = decimalisation.toString().split('/');

  return (
    parseInt(decimalisationValues[0]) / parseInt(decimalisationValues[1])
  ).toString();
};
