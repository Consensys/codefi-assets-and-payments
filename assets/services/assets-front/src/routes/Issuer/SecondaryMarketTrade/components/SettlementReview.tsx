import React from 'react';
import Icon from 'uiComponents/Icon';
import { useSelector } from 'react-redux';
import { mdiCheckCircle } from '@mdi/js';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { CLIENT_ROUTE_ASSETS, CLIENT_ROUTE_TRADES_DETAILS } from 'routesList';
import { orderSelector } from 'features/trades/settle.store';
import Button from 'uiComponents/Button';

export const SettlementReview: React.FC = () => {
  const intl = useIntl();
  const order = useSelector(orderSelector);

  return (
    <>
      <div className={'secondary-market-trade__settle-trade-confirm'}>
        <div className={'secondary-market-trade__settle-trade-confirm__title'}>
          <Icon icon={mdiCheckCircle} color={'#4CA687'} width={36} />
          <h2>{intl.formatMessage(tradesTexts.tradeSettled)}</h2>
        </div>
        <h3>{intl.formatMessage(tradesTexts.whatHappens)}</h3>
        <p>{intl.formatMessage(tradesTexts.hintSettlement)}</p>

        <div
          className={'secondary-market-trade__settlement-trade-confirm_footer'}
        >
          <Button href={CLIENT_ROUTE_ASSETS} tertiary>
            {intl.formatMessage(tradesTexts.backToAssets)}
          </Button>
          <Button
            href={CLIENT_ROUTE_TRADES_DETAILS.pathBuilder({
              tradeId: String(order?.id),
            })}
          >
            {intl.formatMessage(tradesTexts.viewTrade)}
          </Button>
        </div>
      </div>
    </>
  );
};
