import { Frequency } from '@consensys/day-counter/dist/types/Frequency';

/**
 * [Craft expected date label ]
 */
export const craftExpectedDateLabel = (
  currentDate: Date,
  expectedDate: Date,
  expectedDateLabel: string,
): string => {
  if (currentDate.getTime() >= expectedDate.getTime()) {
    const deltaInS = (currentDate.getTime() - expectedDate.getTime()) / 1000;
    return `${expectedDateLabel} ${expectedDate} is past by ${deltaInS} seconds`;
  } else {
    const deltaInS = (expectedDate.getTime() - currentDate.getTime()) / 1000;
    return `${expectedDateLabel} ${expectedDate} is not past yet, there are still ${deltaInS} seconds to wait`;
  }
};
export enum dateAmountType {
  DAYS,
  WEEKS,
  MONTHS,
  YEARS,
}

export function addDate(
  date: Date,
  amount: number,
  dateType: dateAmountType,
): Date {
  const dt = new Date(date.getTime());
  switch (dateType) {
    case dateAmountType.DAYS:
      return dt.setDate(dt.getDate() + amount) && dt;
    case dateAmountType.WEEKS:
      return dt.setDate(dt.getDate() + 7 * amount) && dt;
    case dateAmountType.MONTHS:
      return dt.setMonth(dt.getMonth() + amount) && dt;
    case dateAmountType.YEARS:
      return dt.setFullYear(dt.getFullYear() + amount) && dt;
  }
}

export function resetTime(date: Date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

// Example input: Fri Jul 23 2021 10:34:01 GMT+0200 (Central European Summer Time)
// Example output: "2021-07-23"
export function formatDateAsShortString(date: Date) {
  return date.toISOString().split('T')[0];
}

export function getFractionFromFrequency(frequency: string) {
  switch (frequency) {
    case Frequency.YEARLY:
      return 1;
    case Frequency.QUARTERLY:
      return 4;
    case Frequency.MONTHLY:
      return 12;
    case Frequency.WEEKLY:
      return 52;

    default:
      return 1;
  }
}
