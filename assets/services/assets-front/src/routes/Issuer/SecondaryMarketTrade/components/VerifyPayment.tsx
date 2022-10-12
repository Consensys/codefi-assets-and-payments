import React from 'react';
import Button from 'uiComponents/Button/Button';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { useIntl } from 'react-intl';
import { TradeFormField } from './TradeFormField';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from 'antd';
import {
  errorsSelector,
  FormFields,
  isFetchingHoldSelector,
  isHoldVerificationDetailsValidSelector,
  paymentHoldIdSelector,
  paymentHoldNetworkSelector,
  setPaymentHoldId,
  setPaymentHoldNetwork,
  validatePaymentHoldId,
  validatePaymentHoldNetwork,
  verifyPayment,
} from 'features/trades/settle.store';
import { SelectNetwork } from './fields/SelectNetwork';
import { Network } from 'types/Network';

export const VerifyPayment: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const errors = useSelector(errorsSelector);
  const isFetchingHold = useSelector(isFetchingHoldSelector);
  const paymentHoldId = useSelector(paymentHoldIdSelector);
  const paymentHoldNetwork = useSelector(paymentHoldNetworkSelector);

  return (
    <div
      className={'secondary-market-trade__verify-payment-form'}
      data-test-id={'verify-trade-form'}
    >
      <h2>{intl.formatMessage(tradesTexts.verifyPayment)}</h2>

      <TradeFormField label={intl.formatMessage(tradesTexts.network)}>
        <SelectNetwork
          placeholder={intl.formatMessage(tradesTexts.selectANetwork)}
          value={paymentHoldNetwork?.key}
          dataTestId={'field-paymentHoldNetwork'}
          dataOptionTestId={'option-paymentHoldNetwork'}
          onBlur={() => dispatch(validatePaymentHoldNetwork())}
          onChange={(network: Network) =>
            dispatch(setPaymentHoldNetwork(network))
          }
          disabled={isFetchingHold}
        />
        {errors[FormFields.VERIFY_NETWORK] && (
          <p
            data-test-id={'field_error-paymentHoldNetwork'}
            className={'form-error'}
          >
            {intl.formatMessage(tradesTexts.selectANetworkError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.paymentHoldId)}>
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(tradesTexts.enterPaymentHoldId)}
          value={paymentHoldId}
          data-test-id={'field-paymentHoldId'}
          onChange={(e) => dispatch(setPaymentHoldId(e.target.value))}
          onBlur={() => dispatch(validatePaymentHoldId())}
          disabled={isFetchingHold}
        />
        {errors[FormFields.VERIFY_HOLD_ID] && (
          <p
            className={'form-error'}
            data-test-id={'field_error-paymentHoldId'}
          >
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <div className={'secondary-market-trade__verify-payment-form_footer'}>
        <Button
          type={'submit'}
          onClick={() => dispatch(verifyPayment())}
          isLoading={isFetchingHold}
          data-test-id={'verify-payment'}
          disabled={!isHoldVerificationDetailsValidSelector}
        >
          {intl.formatMessage(tradesTexts.verifyPayment)}
        </Button>
      </div>
    </div>
  );
};
