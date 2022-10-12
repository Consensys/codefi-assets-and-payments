import useOrder from 'hooks/useOrder';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { CLIENT_ROUTE_ASSETS, CLIENT_ROUTE_TRADES_SETTLE } from 'routesList';
import { WorkflowStates } from 'texts/routes/common/workflow';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { tradesTexts } from 'texts/routes/issuer/trades';
import PageTitle from 'uiComponents/PageTitle';
import PageWrapper from 'uiComponents/PageWrapper/PageWrapper';
import { SwapSummary } from 'uiComponents/SwapSummary';
import {
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import { IToken } from '../AssetIssuance/templatesTypes';
import DetailsCard from './components/DetailsCard';

export const TradeDetails = () => {
  const intl = useIntl();
  const { tradeId } = useParams<{ tradeId: string }>();
  const { order, orderError, orderLoading } = useOrder({
    id: tradeId,
    withBalances: false,
  });

  const status = useMemo(() => {
    if (order) {
      const status = getWorkflowInstanceStatus(intl, order, true);
      return (
        <span
          style={{
            padding: '2px 8px',
            fontSize: 12,
            borderRadius: 4,
            ...getWorkflowInstanceStatusStyle(order, true),
          }}
        >
          {status}
        </span>
      );
    }
    return null;
  }, [order, intl]);

  const isSettled = useMemo(
    () =>
      order &&
      getWorkflowInstanceStatus(intl, order, true) ===
        intl.formatMessage(WorkflowStates.settled),
    [order, intl],
  );

  const tabActions = useMemo(() => {
    const actions = [];
    if (!isSettled)
      actions.push({
        label: intl.formatMessage(tradesTexts.settleTrade),
        secondary: true,
        href: CLIENT_ROUTE_TRADES_SETTLE.pathBuilder({
          orderId: String(order?.id),
        }),
      });
    return actions;
  }, [isSettled, intl, order]);

  return (
    <PageWrapper isError={orderError || !order} isLoading={orderLoading}>
      <PageTitle
        title={intl.formatMessage(tradesTexts.details)}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabActions={tabActions}
      />
      <div style={{ width: 600, margin: '0 auto', padding: '32px 0' }}>
        <SwapSummary
          expiration={
            isSettled
              ? new Date(order?.updatedAt as unknown as string).getTime()
              : new Date(order?.data.dvp?.tradeExpiresOn as string).getTime() /
                  1000 -
                new Date().getTime() / 1000
          }
          deliveryAsset={{ name: order?.metadata?.token?.name } as IToken}
          deliveryAssetHasClasses={true}
          deliveryAssetClass={order?.assetClassKey}
          paymentAsset={order?.data.dvp?.payment?.tokenAddress}
          paymentAssetHasClasses={false}
          deliveryQuantity={order?.quantity}
          paymentQuantity={order?.price}
          status={status}
          isSettled={isSettled}
        />
        {order && <DetailsCard order={order} />}
      </div>
    </PageWrapper>
  );
};
