import React from 'react';
import { TradeFormSectionSummary } from '../TradeFormSectionSummary';
import { TradeFormField } from '../TradeFormField';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { SearchAsset } from '../fields/SearchAsset';
import { useDispatch, useSelector } from 'react-redux';
import { SearchUser } from '../fields/SearchUser';
import { numberWithCommas, shortifyAddress } from 'utils/commonUtils';
import { Quantity } from '../fields/Quantity';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import {
  errorsSelector,
  FormFields,
  paymentSectionDataSelector,
  updatePaymentHoldAsset,
  setPaymentHoldAssetClass,
  setPaymentHoldAssetHasClasses,
  setPaymentHoldAssetQuery,
  setPaymentHoldSenderQuery,
  setPaymentHoldIsEditing,
  setPaymentHoldQuantity,
  validatePaymentHoldAndSave,
  validatePaymentHoldAsset,
  validatePaymentHoldQuantity,
  validatePaymentHoldSender,
  setPaymentHoldRecipientQuery,
  updatePaymentHoldRecipient,
  updatePaymentHoldSender,
  validatePaymentHoldRecipient,
} from 'features/trades/accept.store';

export const PaymentDetailsSection: React.FC = () => {
  const dispatch = useDispatch();
  const errors = useSelector(errorsSelector);
  const paymentSectionData = useSelector(paymentSectionDataSelector);
  const intl = useIntl();
  const spendableAmount =
    paymentSectionData.sender?.tokenRelatedData?.balances?.classes.find(
      (assetClass) => assetClass.name === paymentSectionData.assetClass,
    )?.balances?.spendableTotal || 0;

  const sectionSummaryAttributes = [
    {
      label: intl.formatMessage(tradesTexts.network),
      value: paymentSectionData.network?.name,
    },
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
            {paymentSectionData.sender?.data?.clientName
              ? ` (${paymentSectionData.sender?.data?.clientName})`
              : null}
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
      label: intl.formatMessage(tradesTexts.recipient),
      value: (
        <>
          <div>
            {paymentSectionData.recipient?.firstName}{' '}
            {paymentSectionData.recipient?.lastName}
            {paymentSectionData.recipient?.data?.clientName
              ? ` (${paymentSectionData.recipient?.data?.clientName})`
              : null}
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
    {
      label: intl.formatMessage(tradesTexts.quantity),
      value: numberWithCommas(paymentSectionData.quantity || 0),
    },
  ];

  return (
    <CollapsableCard
      className={'secondary-market-trade__create-trade-form__section'}
      header={intl.formatMessage(tradesTexts.paymentHolder)}
      saveButtonLabel={intl.formatMessage(tradesTexts.save)}
      saveButtonTestId={'save-payment-details'}
      onSave={() => dispatch(validatePaymentHoldAndSave())}
      onEdit={() => dispatch(setPaymentHoldIsEditing(true))}
      isCollapsed={!paymentSectionData.isEditing}
      collapsedContent={
        <TradeFormSectionSummary attributes={sectionSummaryAttributes} />
      }
    >
      <TradeFormField label={intl.formatMessage(tradesTexts.asset)}>
        <SearchAsset
          value={paymentSectionData.asset}
          queryValue={paymentSectionData.assetQuery}
          assetHasClasses={paymentSectionData.assetHasClasses}
          assetClassValue={paymentSectionData.assetClass}
          onChangeQueryValue={(query: string) =>
            dispatch(setPaymentHoldAssetQuery(query))
          }
          onChangeAssetClass={(assetClass: string) =>
            dispatch(setPaymentHoldAssetClass(assetClass))
          }
          onChangeAssetHasClasses={(hasClasses) =>
            dispatch(setPaymentHoldAssetHasClasses(hasClasses))
          }
          onSearch={(data) => dispatch(setPaymentHoldAssetQuery(data))}
          onSelect={(asset) => dispatch(updatePaymentHoldAsset(asset))}
          onBlur={() => dispatch(validatePaymentHoldAsset())}
          disabled={!paymentSectionData.network}
          dataTestId={'field-paymentAsset'}
          dataOptionTestId={'option-paymentAssetSearchResult'}
        />
        {errors[FormFields.PAYMENT_ASSET] && (
          <p className={'form-error'}>Please select an asset to trade</p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.sender)}>
        <SearchUser
          assetId={paymentSectionData.asset?.id}
          value={paymentSectionData.sender}
          queryValue={paymentSectionData.senderQuery}
          onSearch={(query) => dispatch(setPaymentHoldSenderQuery(query))}
          onSelect={(user) => dispatch(updatePaymentHoldSender(user))}
          onBlur={() => dispatch(validatePaymentHoldSender())}
          disabled={!paymentSectionData.asset}
          dataTestId={'field-paymentAccount'}
          dataOptionTestId={'option-paymentAccountSearchResult'}
        />
        {errors[FormFields.PAYMENT_SENDER] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAccountError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.recipient)}>
        <SearchUser
          assetId={paymentSectionData.asset?.id}
          value={paymentSectionData.recipient}
          queryValue={paymentSectionData.recipientQuery}
          onSearch={(query) => dispatch(setPaymentHoldRecipientQuery(query))}
          onSelect={(user) => dispatch(updatePaymentHoldRecipient(user))}
          onBlur={() => dispatch(validatePaymentHoldRecipient())}
          disabled={!paymentSectionData.asset}
          dataTestId={'field-deliveryAccount'}
          dataOptionTestId={'option-deliveryAccountSearchResult'}
        />
        {errors[FormFields.PAYMENT_RECIPIENT] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAccountError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.quantity)}>
        <Quantity
          value={paymentSectionData.quantity}
          onChange={(quantity) => dispatch(setPaymentHoldQuantity(quantity))}
          max={spendableAmount}
          useMax={(max) => dispatch(setPaymentHoldQuantity(max))}
          onBlur={() => dispatch(validatePaymentHoldQuantity())}
          disabled={!paymentSectionData.sender}
          dataTestId={'field-paymentQuantity'}
        />
        {errors[FormFields.PAYMENT_QUANTITY] && (
          <p className={'form-error'}>
            Please insert an amount between 0 and {spendableAmount}
          </p>
        )}
      </TradeFormField>
    </CollapsableCard>
  );
};
