import React from 'react';
import { useSelector } from 'react-redux';
import {
  deliveryHoldSelector,
  holdVerificationDetailsSelector,
  paymentSectionDataSelector,
} from '../../../../features/trades/accept.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from '../../../../texts/routes/issuer/trades';
import { SwapSummary } from 'uiComponents/SwapSummary';

export const PaymentSummary: React.FC = () => {
  const intl = useIntl();
  const deliveryHoldData = useSelector(deliveryHoldSelector);
  const paymentHolderSectionData = useSelector(paymentSectionDataSelector);
  const holdVerificationData = useSelector(holdVerificationDetailsSelector);

  return (
    <>
      <h3>{intl.formatMessage(tradesTexts.summary)}</h3>
      <SwapSummary
        expiration={
          Number(deliveryHoldData?.expiration) - new Date().getTime() / 1000
        }
        deliveryAsset={holdVerificationData.asset}
        deliveryAssetHasClasses={false}
        paymentAsset={paymentHolderSectionData.asset}
        paymentAssetHasClasses={paymentHolderSectionData.assetHasClasses}
        paymentAssetClass={paymentHolderSectionData.assetClass}
        deliveryQuantity={deliveryHoldData?.valueReadable}
        paymentQuantity={paymentHolderSectionData.quantity}
      />
    </>
  );
};
