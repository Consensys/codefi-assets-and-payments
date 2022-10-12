import React from 'react';

import './OrderContainer.scss';
import Icon from 'uiComponents/Icon';
import { mdiClose, mdiCurrencyUsd, mdiDownload } from '@mdi/js';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import Button from 'uiComponents/Button';

import data from './orderMockupData.json';
import { PaymentStatusesPills, PaymentStatus } from 'constants/paymentStatuses';
import i18n from 'utils/i18n';
import { colors } from 'constants/styles';
import { opentCancelOrderModal } from './opentCancelOrderModal';
import { formatDate } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { PortfolioTexts } from 'texts/routes/investor/PortfolioTexts';
import { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface IProps {
  selfClose: () => void;
}

interface IState {
  isLoading: boolean;
  hasError: boolean;
}

export const OrderContainer: React.FC<IProps> = ({ selfClose }) => {
  useEffect(() => {
    setTimeout(() => {
      setState((s) => ({ ...s, isLoading: false }));
    }, 500);
  }, []);

  const [state, setState] = useState<IState>({
    isLoading: true,
    hasError: false,
  });

  const intl = useIntl();

  if (state.hasError) {
    return <PageError />;
  }

  return (
    <div className="_route_investor_portfolio_orderContainer">
      <header>
        <span>{intl.formatMessage(CommonTexts.order)}</span>
        <button onClick={selfClose}>
          <Icon icon={mdiClose} />
        </button>
      </header>

      {state.isLoading && <PageLoader />}

      {!state.isLoading && (
        <main>
          <div className="actions">
            <Button
              label={intl.formatMessage(CommonTexts.completePayment)}
              iconLeft={mdiCurrencyUsd}
              size="small"
            />
            {data.canCancel && (
              <Button
                label={intl.formatMessage(CommonTexts.cancelOrder)}
                color={colors.errorDark}
                size="small"
                onClick={() => opentCancelOrderModal(intl)}
                style={{ marginTop: '12px' }}
              />
            )}
          </div>

          <header>
            <div>
              <span>{intl.formatMessage(CommonTexts.asset)}</span>
              <div>
                <b>{`${data.assetName} ${data.shareClass}`}</b>
              </div>
              <div>{data.ISINCode}</div>
            </div>
            <div>
              <span>{intl.formatMessage(CommonTexts.status)}</span>
              <div>
                <PaymentStatusesPills status={data.status as PaymentStatus} />
              </div>
            </div>
            <div>
              <span>{intl.formatMessage(CommonTexts.cancelationDate)}</span>
              <div>{formatDate(new Date(data.cancelationDate))}</div>
            </div>
            <div>
              <span>{intl.formatMessage(CommonTexts.cancelationReason)}</span>
              <div>{data.cancelationReason}</div>
            </div>
          </header>

          {data.baseData && data.baseData.length > 0 && (
            <ul>
              {data.baseData.map((element, index) => (
                <li key={index} className={element.isBold ? 'bold' : ''}>
                  <span>{i18n(intl.locale, element.label)}</span>
                  <span>{element.value}</span>
                </li>
              ))}
            </ul>
          )}

          {data.documents && data.documents.length > 0 && (
            <ul>
              <h3>{intl.formatMessage(CommonTexts.documents)}</h3>
              {data.documents.map((element, index) => (
                <li key={index}>
                  <span>{i18n(intl.locale, element.label)}</span>
                  <span>
                    <Link
                      to={{
                        pathname: element.url,
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon icon={mdiDownload} color={colors.main} />
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {data.keyDates && data.keyDates.length > 0 && (
            <ul>
              <h3>{intl.formatMessage(PortfolioTexts.keyDates)}</h3>
              {data.keyDates.map((element, index) => (
                <li key={index}>
                  <span>{i18n(intl.locale, element.label)}</span>
                  <span>{element.value}</span>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </div>
  );
};
