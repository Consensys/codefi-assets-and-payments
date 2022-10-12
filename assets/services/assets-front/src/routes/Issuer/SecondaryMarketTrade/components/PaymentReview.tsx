import React from 'react';
import Icon from 'uiComponents/Icon';
import { mdiCheckCircle, mdiContentCopy } from '@mdi/js';
import { TradeFormSectionSummary } from './TradeFormSectionSummary';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { useDispatch, useSelector } from 'react-redux';
import { numberWithCommas, shortifyAddress } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import Button from 'uiComponents/Button';
import { CLIENT_ROUTE_TRADES_DETAILS } from 'routesList';
import {
  copyOrderToClipboard,
  orderAcceptanceReceiptSelector,
  paymentSectionDataSelector,
} from 'features/trades/accept.store';

export const PaymentReview: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const paymentSectionData = useSelector(paymentSectionDataSelector);
  const orderAcceptanceReceipt = useSelector(orderAcceptanceReceiptSelector);

  return (
    <>
      <div className={'secondary-market-trade__create-trade-confirm'}>
        <div className={'secondary-market-trade__create-trade-confirm__title'}>
          <Icon icon={mdiCheckCircle} color={'#4CA687'} width={36} />
          <h2>{intl.formatMessage(tradesTexts.tradeAccepted)}</h2>
        </div>
        <h3>{intl.formatMessage(tradesTexts.whatHappens)}</h3>
        <p>{intl.formatMessage(tradesTexts.hintPaymentP1)}</p>
        <p>{intl.formatMessage(tradesTexts.hintP2)}</p>
        <CollapsableCard
          className={'secondary-market-trade__create-trade-form__section'}
          header={intl.formatMessage(tradesTexts.paymentHold)}
          saveButtonLabel={'Copy'}
          saveButtonTestId={'copy-trade-info'}
          onSave={() => dispatch(copyOrderToClipboard())}
          onEdit={() => dispatch(copyOrderToClipboard())}
          editButtonLabel={mdiContentCopy}
          isCollapsed={true}
          collapsedContent={
            <>
              <h4>{intl.formatMessage(tradesTexts.overview)}</h4>
              <TradeFormSectionSummary
                attributes={[
                  {
                    label: intl.formatMessage(tradesTexts.paymentHoldId),
                    value: shortifyAddress(
                      orderAcceptanceReceipt?.data?.dvp?.payment?.holdId || '',
                      6,
                      6,
                    ),
                  },
                ]}
              />

              <h4>{intl.formatMessage(tradesTexts.payment)}</h4>
              <TradeFormSectionSummary
                attributes={[
                  {
                    label: intl.formatMessage(tradesTexts.asset),
                    value: (
                      <>
                        <div>
                          {paymentSectionData.asset?.name}
                          {paymentSectionData.assetHasClasses
                            ? ` / ${paymentSectionData.assetClass}`
                            : ''}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            paymentSectionData.asset?.defaultDeployment || '',
                            4,
                            4,
                          )}
                          {paymentSectionData.assetHasClasses &&
                            ` / ${paymentSectionData.assetClass}`}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.sender),
                    value: (
                      <>
                        <div>
                          {paymentSectionData.sender?.firstName}{' '}
                          {paymentSectionData.sender?.lastName}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            paymentSectionData.sender?.defaultWallet || '',
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.quantity),
                    value: numberWithCommas(paymentSectionData.quantity || 0),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.recipient),
                    value: (
                      <>
                        <div>
                          {paymentSectionData.recipient?.firstName}{' '}
                          {paymentSectionData.recipient?.lastName}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            paymentSectionData.recipient?.defaultWallet || '',
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                ]}
              />
            </>
          }
        />

        <div className={'secondary-market-trade__payment-confirm_footer'}>
          <Button
            href={CLIENT_ROUTE_TRADES_DETAILS.pathBuilder({
              tradeId: String(orderAcceptanceReceipt?.id),
            })}
          >
            {intl.formatMessage(tradesTexts.viewTrade)}
          </Button>
        </div>
      </div>
    </>
  );
};
