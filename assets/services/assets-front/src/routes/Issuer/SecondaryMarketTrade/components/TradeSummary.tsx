import React from 'react';
import { useSelector } from 'react-redux';
import {
  deliveryHolderSectionDataSelector,
  overviewSectionDataSelector,
  paymentHolderSectionDataSelector,
} from 'features/trades/create.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { SwapSummary } from 'uiComponents/SwapSummary';

export const TradeSummary: React.FC = () => {
  const intl = useIntl();
  const overviewSectionData = useSelector(overviewSectionDataSelector);
  const deliveryHolderSectionData = useSelector(
    deliveryHolderSectionDataSelector,
  );
  const paymentHolderSectionData = useSelector(
    paymentHolderSectionDataSelector,
  );

  return (
    <>
      <h3>{intl.formatMessage(tradesTexts.summary)}</h3>
      <SwapSummary
        expiration={overviewSectionData.expiresIn}
        deliveryAsset={deliveryHolderSectionData.asset}
        deliveryAssetHasClasses={deliveryHolderSectionData.assetHasClasses}
        deliveryAssetClass={deliveryHolderSectionData.assetClass}
        paymentAsset={paymentHolderSectionData.asset}
        paymentAssetHasClasses={paymentHolderSectionData.assetHasClasses}
        paymentAssetClass={paymentHolderSectionData.assetClass}
        deliveryQuantity={deliveryHolderSectionData.quantity}
        paymentQuantity={paymentHolderSectionData.quantity}
      />
    </>
  );
};
