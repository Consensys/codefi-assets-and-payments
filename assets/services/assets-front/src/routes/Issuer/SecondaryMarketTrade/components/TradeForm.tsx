import React from 'react';
import { OverviewSection } from './sections/OverviewSection';
import { DeliveryHolderSection } from './sections/DeliveryHolderSection';
import { PaymentHolderSection } from './sections/PaymentHolderSection';
import Button from 'uiComponents/Button';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTrade,
  deliveryHolderSectionDataSelector,
  isCreatingTradeSelector,
  overviewSectionDataSelector,
  paymentHolderSectionDataSelector,
} from 'features/trades/create.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';

export const TradeForm: React.FC = () => {
  const dispatch = useDispatch();
  const overviewData = useSelector(overviewSectionDataSelector);
  const deliveryHolderData = useSelector(deliveryHolderSectionDataSelector);
  const paymentHolderData = useSelector(paymentHolderSectionDataSelector);
  const isCreatingTrade = useSelector(isCreatingTradeSelector);
  const intl = useIntl();

  return (
    <div
      className={'secondary-market-trade__create-trade-form'}
      data-test-id={'create-trade-form'}
    >
      <h2>{intl.formatMessage(tradesTexts.tradeInformation)}</h2>

      <OverviewSection />
      <DeliveryHolderSection />
      <PaymentHolderSection />

      <div className={'secondary-market-trade__create-trade-form_footer'}>
        <Button
          type={'submit'}
          onClick={() => dispatch(createTrade())}
          isLoading={isCreatingTrade}
          data-test-id={'create-trade'}
          disabled={
            overviewData.isEditing ||
            deliveryHolderData.isEditing ||
            paymentHolderData.isEditing
          }
        >
          {intl.formatMessage(tradesTexts.create)}
        </Button>
      </div>
    </div>
  );
};
