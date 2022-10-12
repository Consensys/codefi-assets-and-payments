import React from 'react';
import Button from 'uiComponents/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { PaymentOverviewSection } from './sections/PaymentOverviewSection';
import {
  acceptTrade,
  isAcceptingTradeSelector,
  overviewSectionDataSelector,
  paymentSectionDataSelector,
} from 'features/trades/accept.store';
import { PaymentDetailsSection } from './sections/PaymentDetailsSection';

export const PaymentForm: React.FC = () => {
  const dispatch = useDispatch();
  const isAcceptingTrade = useSelector(isAcceptingTradeSelector);
  const overviewData = useSelector(overviewSectionDataSelector);
  const paymentHoldData = useSelector(paymentSectionDataSelector);
  const intl = useIntl();

  return (
    <div
      className={'secondary-market-trade__accept-trade-form'}
      data-test-id={'accept-trade-form'}
    >
      <h2>{intl.formatMessage(tradesTexts.payment)}</h2>

      <PaymentOverviewSection />
      <PaymentDetailsSection />

      <div className={'secondary-market-trade__create-trade-form_footer'}>
        <Button
          type={'submit'}
          onClick={() => dispatch(acceptTrade())}
          isLoading={isAcceptingTrade}
          data-test-id={'accept-trade'}
          disabled={overviewData.isEditing || paymentHoldData.isEditing}
        >
          {intl.formatMessage(tradesTexts.accept)}
        </Button>
      </div>
    </div>
  );
};
