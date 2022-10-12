import React from 'react';
import Button from 'uiComponents/Button/Button';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { useIntl } from 'react-intl';
import { SelectNetwork } from './fields/SelectNetwork';
import { Network } from 'types/Network';
import { TradeFormField } from './TradeFormField';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from 'antd';
import {
  errorsSelector,
  FormFields,
  holdVerificationDetailsSelector,
  isFetchingHoldSelector,
  isHoldVerificationDetailsValidSelector,
  updateHoldVerificationAsset,
  updateHoldVerificationId,
  updateHoldVerificationNetwork,
  validateHoldVerificationAsset,
  validateHoldVerificationId,
  validateHoldVerificationNetwork,
  verifyTrade,
} from 'features/trades/accept.store';

export const VerifyTrade: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const errors = useSelector(errorsSelector);
  const isFetchingHold = useSelector(isFetchingHoldSelector);
  const isHoldVerificationDetailsValid = useSelector(
    isHoldVerificationDetailsValidSelector,
  );
  const holdVerificationDetails = useSelector(holdVerificationDetailsSelector);

  return (
    <div
      className={'secondary-market-trade__verify-trade-form'}
      data-test-id={'verify-trade-form'}
    >
      <h2>{intl.formatMessage(tradesTexts.verifyTrade)}</h2>
      <TradeFormField label={intl.formatMessage(tradesTexts.network)}>
        <SelectNetwork
          placeholder={intl.formatMessage(tradesTexts.selectANetwork)}
          value={holdVerificationDetails.network?.key}
          dataTestId={'field-deliveryHoldNetwork'}
          dataOptionTestId={'option-deliveryHoldNetwork'}
          onBlur={() => dispatch(validateHoldVerificationNetwork())}
          onChange={(network: Network) =>
            dispatch(updateHoldVerificationNetwork(network))
          }
          disabled={isFetchingHold}
        />
        {errors[FormFields.VERIFY_NETWORK] && (
          <p
            data-test-id={'field_error-deliveryHoldNetwork'}
            className={'form-error'}
          >
            {intl.formatMessage(tradesTexts.selectANetworkError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.deliveryHoldId)}>
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(tradesTexts.enterDeliveryHoldId)}
          value={holdVerificationDetails.holdId}
          data-test-id={'field-deliveryHoldId'}
          onChange={(e) => dispatch(updateHoldVerificationId(e.target.value))}
          onBlur={() => dispatch(validateHoldVerificationId())}
          disabled={isFetchingHold}
        />
        {errors[FormFields.VERIFY_HOLD_ID] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField
        label={intl.formatMessage(tradesTexts.deliveryAssetAddress)}
      >
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(
            tradesTexts.enterDeliveryAssetAddress,
          )}
          value={holdVerificationDetails.asset}
          data-test-id={'field-deliveryHoldAddress'}
          onChange={(e) =>
            dispatch(updateHoldVerificationAsset(e.target.value))
          }
          onBlur={() => dispatch(validateHoldVerificationAsset())}
          disabled={isFetchingHold}
        />
        {errors[FormFields.VERIFY_ASSET] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <div className={'secondary-market-trade__verify-trade-form_footer'}>
        <Button
          type={'submit'}
          onClick={() => dispatch(verifyTrade())}
          isLoading={isFetchingHold}
          data-test-id={'verify-trade'}
          disabled={!isHoldVerificationDetailsValid}
        >
          {intl.formatMessage(tradesTexts.verifyTrade)}
        </Button>
      </div>
    </div>
  );
};
