import React from 'react';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { useDispatch, useSelector } from 'react-redux';
import { TradeFormSectionSummary } from './TradeFormSectionSummary';
import { numberWithCommas, shortifyAddress } from 'utils/commonUtils';
import {
  isSettlingTradeSelector,
  orderSelector,
  paymentHoldNetworkSelector,
  paymentHoldSelector,
  settleTrade,
} from 'features/trades/settle.store';
import Button from 'uiComponents/Button';

export const SettlementForm: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const isSettlingTrade = useSelector(isSettlingTradeSelector);
  const order = useSelector(orderSelector);
  const paymentHold = useSelector(paymentHoldSelector);
  const holdNetwork = useSelector(paymentHoldNetworkSelector);

  return (
    <>
      <div
        className={'secondary-market-trade__settlement-trade-form'}
        data-test-id={'settlement-trade-form'}
      >
        <h2>{intl.formatMessage(tradesTexts.verifyPayment)}</h2>

        <CollapsableCard
          className={'secondary-market-trade__settlement-trade-form__section'}
          header={intl.formatMessage(tradesTexts.paymentHold)}
          saveButtonLabel={'Copy'}
          saveButtonTestId={'copy-trade-info'}
          onSave={() => null}
          onEdit={() => null}
          isCollapsed={true}
          hideButton={true}
          collapsedContent={
            <>
              <h4>{intl.formatMessage(tradesTexts.overview)}</h4>
              <TradeFormSectionSummary
                attributes={[
                  {
                    label: intl.formatMessage(tradesTexts.paymentHoldId),
                    value: shortifyAddress(String(paymentHold?.id), 6, 6),
                  },
                ]}
              />

              <h4>{intl.formatMessage(tradesTexts.payment)}</h4>
              <TradeFormSectionSummary
                attributes={[
                  {
                    label: intl.formatMessage(tradesTexts.network),
                    value: holdNetwork?.name,
                  },
                  {
                    label: intl.formatMessage(tradesTexts.asset),
                    value: (
                      <>
                        <div>
                          {shortifyAddress(
                            String(order?.data?.dvp?.payment?.tokenAddress),
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.sender),
                    value: (
                      <>
                        <div>
                          {shortifyAddress(String(paymentHold?.sender), 4, 4)}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.recipient),
                    value: (
                      <>
                        <div>
                          {shortifyAddress(
                            String(paymentHold?.recipient),
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.quantity),
                    value: numberWithCommas(Number(paymentHold?.valueReadable)),
                  },
                ]}
              />
            </>
          }
        />

        <div className={'secondary-market-trade__settlement-trade-form_footer'}>
          <Button href="/assets" tertiary>
            {intl.formatMessage(tradesTexts.backToAssets)}
          </Button>
          <Button
            type={'submit'}
            onClick={() => dispatch(settleTrade())}
            isLoading={isSettlingTrade}
            data-test-id={'settle-trade'}
            disabled={isSettlingTrade}
          >
            {intl.formatMessage(tradesTexts.settle)}
          </Button>
        </div>
      </div>
    </>
  );
};
