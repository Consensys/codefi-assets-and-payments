import React, { useEffect } from 'react';
import './Trade.scss';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { Wizard } from 'uiComponents/Wizard';
import {
  activeWizardStepSelector,
  fetchOrder,
  orderSelector,
  paymentHoldSelector,
  reset,
} from 'features/trades/settle.store';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { VerifyPayment } from './components/VerifyPayment';
import { SettlementSummary } from './components/SettlementSummary';
import { SettlementForm } from './components/SettlementForm';
import Loader from 'uiComponents/Loader';
import { SettlementReview } from './components/SettlementReview';

export const SettleTrade: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = useParams<{ orderId: string }>();
  const activeWizardStep = useSelector(activeWizardStepSelector);
  const order = useSelector(orderSelector);
  const paymentHold = useSelector(paymentHoldSelector);
  const intl = useIntl();

  useEffect(() => {
    dispatch(reset());
  }, [dispatch, location]);

  useEffect(() => {
    dispatch(fetchOrder(params.orderId));
  }, [dispatch, params]);

  if (!order) {
    return <Loader />;
  }

  return (
    <Wizard
      className={'secondary-market-trade'}
      activeStep={activeWizardStep}
      summary={<SettlementSummary />}
      steps={[
        {
          label: intl.formatMessage(tradesTexts.verifyPayment),
          component: paymentHold ? <SettlementForm /> : <VerifyPayment />,
        },
        {
          label: intl.formatMessage(tradesTexts.confirmation),
          component: <SettlementReview />,
        },
      ]}
    />
  );
};
