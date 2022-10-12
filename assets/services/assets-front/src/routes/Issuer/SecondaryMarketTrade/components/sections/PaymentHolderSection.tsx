import React from 'react';
import {
  errorsSelector,
  FormFields,
  paymentHolderSectionDataSelector,
  setPaymentHolderAsset,
  setPaymentHolderIsEditing,
  setPaymentHolderQuantity,
  setPaymentHolderRecipient,
  setPaymentHolderSender,
  validatePaymentHolderAndSave,
  validatePaymentHolderAsset,
  validatePaymentHolderQuantity,
  validatePaymentHolderRecipient,
  validatePaymentHolderSender,
} from 'features/trades/create.store';
import { TradeFormSectionSummary } from '../TradeFormSectionSummary';
import { TradeFormField } from '../TradeFormField';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { useDispatch, useSelector } from 'react-redux';
import { numberWithCommas, shortifyAddress } from 'utils/commonUtils';
import { Input } from 'antd';
import { Quantity } from '../fields/Quantity';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';

export const PaymentHolderSection: React.FC = () => {
  const dispatch = useDispatch();
  const errors = useSelector(errorsSelector);
  const intl = useIntl();
  const paymentHolderSectionData = useSelector(
    paymentHolderSectionDataSelector,
  );

  const sectionSummaryAttributes = [
    {
      label: intl.formatMessage(tradesTexts.asset),
      value: (
        <>
          <div
            className={
              'create-trade-form__section-summary__attribute__value__tertiary'
            }
          >
            {shortifyAddress(paymentHolderSectionData.asset || '', 4, 4)}
            {paymentHolderSectionData.assetHasClasses &&
              ` / ${paymentHolderSectionData.assetClass}`}
          </div>
        </>
      ),
    },
    {
      label: intl.formatMessage(tradesTexts.sender),
      value: shortifyAddress(paymentHolderSectionData.sender, 4, 4),
    },
    {
      label: intl.formatMessage(tradesTexts.recipient),
      value: shortifyAddress(paymentHolderSectionData.recipient, 4, 4),
    },
    {
      label: intl.formatMessage(tradesTexts.quantity),
      value: numberWithCommas(paymentHolderSectionData.quantity || 0),
    },
  ];

  return (
    <CollapsableCard
      className={'secondary-market-trade__create-trade-form__section'}
      header={intl.formatMessage(tradesTexts.payment)}
      saveButtonLabel={intl.formatMessage(tradesTexts.save)}
      saveButtonTestId={'save-payment'}
      onSave={() => dispatch(validatePaymentHolderAndSave())}
      onEdit={() => dispatch(setPaymentHolderIsEditing(true))}
      isCollapsed={!paymentHolderSectionData.isEditing}
      collapsedContent={
        <TradeFormSectionSummary attributes={sectionSummaryAttributes} />
      }
    >
      <TradeFormField label={intl.formatMessage(tradesTexts.asset)}>
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(tradesTexts.enterAnAddress)}
          value={paymentHolderSectionData.asset}
          onBlur={() => dispatch(validatePaymentHolderAsset())}
          onChange={(e) => dispatch(setPaymentHolderAsset(e.target.value))}
          data-test-id={'field-paymentAsset'}
        />
        {errors[FormFields.PAYMENT_ASSET] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.sender)}>
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(tradesTexts.enterAnAddress)}
          value={paymentHolderSectionData.sender}
          onBlur={() => dispatch(validatePaymentHolderSender())}
          onChange={(e) => dispatch(setPaymentHolderSender(e.target.value))}
          data-test-id={'field-paymentSender'}
        />
        {errors[FormFields.PAYMENT_SENDER] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.recipient)}>
        <Input
          style={{ width: '100%' }}
          size={'large'}
          placeholder={intl.formatMessage(tradesTexts.enterAnAddress)}
          value={paymentHolderSectionData.recipient}
          data-test-id={'field-paymentRecipient'}
          onChange={(e) => dispatch(setPaymentHolderRecipient(e.target.value))}
          onBlur={() => dispatch(validatePaymentHolderRecipient())}
        />
        {errors[FormFields.PAYMENT_RECIPIENT] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAddressError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.quantity)}>
        <Quantity
          value={paymentHolderSectionData.quantity}
          onChange={(quantity) => dispatch(setPaymentHolderQuantity(quantity))}
          onBlur={() => dispatch(validatePaymentHolderQuantity())}
          dataTestId={'field-paymentQuantity'}
        />
        {errors[FormFields.PAYMENT_QUANTITY] && (
          <p className={'form-error'}>Please insert a valid amount</p>
        )}
      </TradeFormField>
    </CollapsableCard>
  );
};
