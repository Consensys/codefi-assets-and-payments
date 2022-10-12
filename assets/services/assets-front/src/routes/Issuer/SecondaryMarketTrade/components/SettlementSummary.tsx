import React from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { tradesTexts } from '../../../../texts/routes/issuer/trades';
import { SwapSummary } from 'uiComponents/SwapSummary';
import { orderSelector } from 'features/trades/settle.store';

export const SettlementSummary: React.FC = () => {
  const intl = useIntl();
  const order = useSelector(orderSelector);

  return (
    <>
      <h3>{intl.formatMessage(tradesTexts.summary)}</h3>
      <SwapSummary
        expiration={
          (new Date(String(order?.data?.dvp?.tradeExpiresOn)).getTime() -
            new Date().getTime()) /
          1000
        }
        deliveryAsset={{ name: String(order?.metadata?.token?.name) }}
        deliveryAssetHasClasses={!!order?.assetClassKey}
        deliveryAssetClass={order?.assetClassKey}
        paymentAsset={order?.data?.dvp?.payment?.tokenAddress}
        paymentAssetHasClasses={false}
        deliveryQuantity={order?.quantity}
        paymentQuantity={order?.price}
      />
    </>
  );
};
