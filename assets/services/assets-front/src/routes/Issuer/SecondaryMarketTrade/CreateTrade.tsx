import React, { useEffect } from 'react';
import './Trade.scss';
import { useSelector, useDispatch } from 'react-redux';
import { Wizard } from 'uiComponents/Wizard';
import { TradeForm } from './components/TradeForm';
import { TradeReview } from './components/TradeReview';
import { TradeSummary } from './components/TradeSummary';
import { activeWizardStepSelector, reset } from 'features/trades/create.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { useLocation } from 'react-router-dom';

export const CreateTrade: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const activeWizardStep = useSelector(activeWizardStepSelector);
  const intl = useIntl();

  useEffect(() => {
    dispatch(reset());
  }, [dispatch, location]);

  return (
    <Wizard
      className={'secondary-market-trade'}
      activeStep={activeWizardStep}
      summary={<TradeSummary />}
      steps={[
        {
          label: intl.formatMessage(tradesTexts.tradeInformation),
          component: <TradeForm />,
        },
        {
          label: intl.formatMessage(tradesTexts.confirmation),
          component: <TradeReview />,
        },
      ]}
    />
  );
};
