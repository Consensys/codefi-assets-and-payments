import { dayConvention } from '@codefi-assets-and-payments/day-counter/dist/types/DayCounterConventions';
import { Frequency } from '@codefi-assets-and-payments/day-counter/dist/types/Frequency';

export enum keys {
  COUPON_PAYMENT_DATE = 'couponPaymentDate',
  PAYMENT_FREQUENCY = 'paymentFrequency',
  RATE_FREQUENCY = 'rateFrequency',
  RATE_VALUE = 'rateValue',
  COUPON_CALENDAR = 'couponCalendar',
}
export interface Coupon {
  [keys.COUPON_PAYMENT_DATE]: Date;
  [keys.PAYMENT_FREQUENCY]: Frequency;
  [keys.RATE_FREQUENCY]: Frequency;
  [keys.RATE_VALUE]: string;
  [keys.COUPON_CALENDAR]: dayConvention;
}

export const CouponExample: Coupon = {
  [keys.COUPON_PAYMENT_DATE]: new Date('2021-10-07T03:00:00.000Z'),
  [keys.PAYMENT_FREQUENCY]: Frequency.QUARTERLY,
  [keys.RATE_FREQUENCY]: Frequency.QUARTERLY,
  [keys.RATE_VALUE]: '1',
  [keys.COUPON_CALENDAR]: dayConvention.ActualActual,
};
