import React from 'react';

import { paymentStatusesTexts } from 'texts/commun/paymentStatuses';
import Pill from 'uiComponents/Pill';
import { useIntl } from 'react-intl';

export enum PaymentStatus {
  ISSUING_SHARES = 'ISSUING_SHARES',
  PAID = 'PAID',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_SENT = 'PAYMENT_SENT',
  SHARES_ISSUED = 'SHARES_ISSUED',
}

export enum PaymentStatusColors {
  ISSUING_SHARES = 'warning',
  PAID = 'success',
  PAYMENT_PENDING = 'warning',
  PAYMENT_SENT = 'success',
  SHARES_ISSUED = 'success',
}

interface IProps {
  status: PaymentStatus;
}

export const PaymentStatusesPills: React.FC<IProps> = ({ status }: IProps) => {
  const intl = useIntl();
  return (
    <Pill
      label={intl.formatMessage(paymentStatusesTexts[status])}
      color={PaymentStatusColors[status]}
    />
  );
};
