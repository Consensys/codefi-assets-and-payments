// export default {
//   ISSUING_SHARES: {
//     en: 'Issuing shares',
//     fr: 'Issuing shares',
//   },
//   PAID: {
//     en: 'Paid',
//     fr: 'Paid',
//   },
//   PAYMENT_PENDING: {
//     en: 'Payment pending',
//     fr: 'Payment pending',
//   },
//   PAYMENT_SENT: {
//     en: 'Payment sent',
//     fr: 'Payment sent',
//   },
//   SHARES_ISSUED: {
//     en: 'Shares issued',
//     fr: 'Shares issued',
//   },
// };

import { defineMessages } from 'react-intl';

export const paymentStatusesTexts = defineMessages({
  ISSUING_SHARES: {
    id: 'assets.paymentStatuses.ISSUING_SHARES',
    description: 'Payment status - issuing shares',
    defaultMessage: 'Issuing shares',
  },
  PAID: {
    id: 'assets.paymentStatuses.PAID',
    description: 'Payment status - Paid',
    defaultMessage: 'Paid',
  },
  PAYMENT_PENDING: {
    id: 'assets.paymentStatuses.PAYMENT_PENDING',
    description: 'Payment status - Payment pending',
    defaultMessage: 'Payment pending',
  },
  PAYMENT_SENT: {
    id: 'assets.paymentStatuses.PAYMENT_SENT',
    description: 'Payment status - Payment sent',
    defaultMessage: 'Payment sent',
  },
  SHARES_ISSUED: {
    id: 'assets.paymentStatuses.SHARES_ISSUED',
    description: 'Payment status - Shares issued',
    defaultMessage: 'Shares issued',
  },
});
