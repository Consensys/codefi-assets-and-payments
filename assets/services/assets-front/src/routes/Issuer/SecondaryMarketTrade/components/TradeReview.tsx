import React from 'react';
import Icon from '../../../../uiComponents/Icon';
import { mdiCheckCircle, mdiContentCopy } from '@mdi/js';
import {
  copyOrderToClipboard,
  deliveryHolderSectionDataSelector,
  overviewSectionDataSelector,
  paymentHolderSectionDataSelector,
  tradeOrderReceiptSelector,
} from '../../../../features/trades/create.store';
import { TradeFormSectionSummary } from './TradeFormSectionSummary';
import { CollapsableCard } from '../../../../uiComponents/CollapsableCard';
import { useSelector, useDispatch } from 'react-redux';
import {
  numberWithCommas,
  shortifyAddress,
} from '../../../../utils/commonUtils';
import { useIntl } from 'react-intl';
import { tradesTexts } from '../../../../texts/routes/issuer/trades';
import { CLIENT_ROUTE_TRADES_DETAILS } from 'routesList';
import Button from 'uiComponents/Button';

export const TradeReview: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const overviewSectionData = useSelector(overviewSectionDataSelector);
  const deliveryHolderSectionData = useSelector(
    deliveryHolderSectionDataSelector,
  );
  const paymentHolderSectionData = useSelector(
    paymentHolderSectionDataSelector,
  );
  const orderCreationReceipt = useSelector(tradeOrderReceiptSelector);

  return (
    <>
      <div className={'secondary-market-trade__create-trade-confirm'}>
        <div className={'secondary-market-trade__create-trade-confirm__title'}>
          <Icon icon={mdiCheckCircle} color={'#4CA687'} width={36} />
          <h2>{intl.formatMessage(tradesTexts.tradeCreated)}</h2>
        </div>
        <h3>{intl.formatMessage(tradesTexts.whatHappens)}</h3>
        <p>{intl.formatMessage(tradesTexts.hintP1)}</p>
        <p>{intl.formatMessage(tradesTexts.hintP2)}</p>
        <CollapsableCard
          className={'secondary-market-trade__create-trade-form__section'}
          header={intl.formatMessage(tradesTexts.deliveryHold)}
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
                    label: intl.formatMessage(tradesTexts.deliveryHoldId),
                    value: shortifyAddress(
                      orderCreationReceipt?.data?.dvp?.delivery?.holdId || '',
                      6,
                      6,
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.network),
                    value: overviewSectionData.network?.name,
                  },
                ]}
              />

              <h4>{intl.formatMessage(tradesTexts.delivery)}</h4>
              <TradeFormSectionSummary
                attributes={[
                  {
                    label: intl.formatMessage(tradesTexts.asset),
                    value: (
                      <>
                        <div>
                          {deliveryHolderSectionData.asset?.name}
                          {deliveryHolderSectionData.assetHasClasses
                            ? ` / ${deliveryHolderSectionData.assetClass}`
                            : ''}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            deliveryHolderSectionData.asset
                              ?.defaultDeployment || '',
                            4,
                            4,
                          )}
                          {deliveryHolderSectionData.assetHasClasses &&
                            ` / ${deliveryHolderSectionData.assetClass}`}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.sender),
                    value: (
                      <>
                        <div>
                          {deliveryHolderSectionData.sender?.firstName}{' '}
                          {deliveryHolderSectionData.sender?.lastName}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            deliveryHolderSectionData.sender?.defaultWallet ||
                              '',
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.recipient),
                    value: (
                      <>
                        <div>
                          {deliveryHolderSectionData.recipient?.firstName}{' '}
                          {deliveryHolderSectionData.sender?.lastName}
                        </div>
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            deliveryHolderSectionData.recipient
                              ?.defaultWallet || '',
                            4,
                            4,
                          )}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.quantity),
                    value: numberWithCommas(
                      deliveryHolderSectionData.quantity || 0,
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
                        <div
                          className={
                            'create-trade-form__section-summary__attribute__value__tertiary'
                          }
                        >
                          {shortifyAddress(
                            paymentHolderSectionData.asset || '',
                            4,
                            4,
                          )}
                          {paymentHolderSectionData.assetHasClasses &&
                            ` / ${paymentHolderSectionData.assetClass}`}
                        </div>
                      </>
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.sender),
                    value: shortifyAddress(
                      paymentHolderSectionData.sender,
                      4,
                      4,
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.quantity),
                    value: numberWithCommas(
                      paymentHolderSectionData.quantity || 0,
                    ),
                  },
                  {
                    label: intl.formatMessage(tradesTexts.recipient),
                    value: shortifyAddress(
                      paymentHolderSectionData.recipient,
                      4,
                      4,
                    ),
                  },
                ]}
              />
            </>
          }
        />

        <div className={'secondary-market-trade__create-trade-confirm_footer'}>
          <Button
            href={CLIENT_ROUTE_TRADES_DETAILS.pathBuilder({
              tradeId: String(orderCreationReceipt?.id),
            })}
          >
            {intl.formatMessage(tradesTexts.viewTrade)}
          </Button>
        </div>
      </div>
    </>
  );
};
