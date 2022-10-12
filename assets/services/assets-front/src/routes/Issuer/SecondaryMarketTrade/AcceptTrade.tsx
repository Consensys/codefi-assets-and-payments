import React, { useEffect } from 'react';
import './Trade.scss';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Wizard } from 'uiComponents/Wizard';
import { activeWizardStepSelector, reset } from 'features/trades/accept.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { VerifyTrade } from './components/VerifyTrade';
import { PaymentForm } from './components/PaymentForm';
import { PaymentSummary } from './components/PaymentSummary';
import { PaymentReview } from './components/PaymentReview';

export const AcceptTrade: React.FC = () => {
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
      summary={<PaymentSummary />}
      steps={[
        {
          label: intl.formatMessage(tradesTexts.verifyTrade),
          component: <VerifyTrade />,
        },
        {
          label: intl.formatMessage(tradesTexts.payment),
          component: <PaymentForm />,
        },
        {
          label: intl.formatMessage(tradesTexts.confirmation),
          component: <PaymentReview />,
        },
      ]}
    />
  );
};
