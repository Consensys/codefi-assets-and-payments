import React from 'react';
import {
  deliveryHolderSectionDataSelector,
  errorsSelector,
  FormFields,
  selectDeliveryHolderAsset,
  setDeliveryHolderAssetClass,
  setDeliveryHolderAssetHasClasses,
  setDeliveryHolderAssetQuery,
  setDeliveryHolderIsEditing,
  setDeliveryHolderQuantity,
  validateDeliveryHolderAndSave,
  validateDeliveryHolderAsset,
  validateDeliveryHolderSender,
  validateDeliveryHolderQuantity,
  setDeliveryHolderRecipientQuery,
  validateDeliveryHolderRecipient,
  setDeliveryHolderSenderQuery,
  selectDeliveryHolderSender,
  selectDeliveryHolderRecipient,
  overviewSectionDataSelector,
} from 'features/trades/create.store';
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

export const DeliveryHolderSection: React.FC = () => {
  const dispatch = useDispatch();
  const errors = useSelector(errorsSelector);
  const overviewSectionData = useSelector(overviewSectionDataSelector);
  const deliveryHolderSectionData = useSelector(
    deliveryHolderSectionDataSelector,
  );
  const intl = useIntl();
  const spendableAmount =
    deliveryHolderSectionData.sender?.tokenRelatedData?.balances?.classes.find(
      (assetClass) => assetClass.name === deliveryHolderSectionData.assetClass,
    )?.balances?.spendableTotal || 0;

  const sectionSummaryAttributes = [
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
              deliveryHolderSectionData.asset?.defaultDeployment || '',
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
            {deliveryHolderSectionData.sender?.data?.clientName
              ? ` (${deliveryHolderSectionData.sender?.data?.clientName})`
              : null}
          </div>
          <div
            className={
              'create-trade-form__section-summary__attribute__value__tertiary'
            }
          >
            {shortifyAddress(
              deliveryHolderSectionData.sender?.defaultWallet || '',
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
            {deliveryHolderSectionData.recipient?.lastName}
            {deliveryHolderSectionData.recipient?.data?.clientName
              ? ` (${deliveryHolderSectionData.recipient?.data?.clientName})`
              : null}
          </div>
          <div
            className={
              'create-trade-form__section-summary__attribute__value__tertiary'
            }
          >
            {shortifyAddress(
              deliveryHolderSectionData.recipient?.defaultWallet || '',
              4,
              4,
            )}
          </div>
        </>
      ),
    },
    {
      label: intl.formatMessage(tradesTexts.quantity),
      value: numberWithCommas(deliveryHolderSectionData.quantity || 0),
    },
  ];

  return (
    <CollapsableCard
      className={'secondary-market-trade__create-trade-form__section'}
      header={intl.formatMessage(tradesTexts.delivery)}
      saveButtonLabel={intl.formatMessage(tradesTexts.save)}
      saveButtonTestId={'save-delivery'}
      onSave={() => dispatch(validateDeliveryHolderAndSave())}
      onEdit={() => dispatch(setDeliveryHolderIsEditing(true))}
      isCollapsed={!deliveryHolderSectionData.isEditing}
      collapsedContent={
        <TradeFormSectionSummary attributes={sectionSummaryAttributes} />
      }
    >
      <TradeFormField label={intl.formatMessage(tradesTexts.asset)}>
        <SearchAsset
          value={deliveryHolderSectionData.asset}
          queryValue={deliveryHolderSectionData.assetQuery}
          assetHasClasses={deliveryHolderSectionData.assetHasClasses}
          assetClassValue={deliveryHolderSectionData.assetClass}
          onChangeQueryValue={(query: string) =>
            dispatch(setDeliveryHolderAssetQuery(query))
          }
          onChangeAssetClass={(assetClass: string) =>
            dispatch(setDeliveryHolderAssetClass(assetClass))
          }
          onChangeAssetHasClasses={(hasClasses) =>
            dispatch(setDeliveryHolderAssetHasClasses(hasClasses))
          }
          onSearch={(data) => dispatch(setDeliveryHolderAssetQuery(data))}
          onSelect={(asset) => dispatch(selectDeliveryHolderAsset(asset))}
          onBlur={() => dispatch(validateDeliveryHolderAsset())}
          disabled={!overviewSectionData.network}
          dataTestId={'field-deliveryAsset'}
          dataOptionTestId={'option-deliveryAssetSearchResult'}
        />
        {errors[FormFields.DELIVERY_ASSET] && (
          <p className={'form-error'}>Please select an asset to trade</p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.sender)}>
        <SearchUser
          assetId={deliveryHolderSectionData.asset?.id}
          value={deliveryHolderSectionData.sender}
          queryValue={deliveryHolderSectionData.senderQuery}
          onSearch={(query) => dispatch(setDeliveryHolderSenderQuery(query))}
          onSelect={(user) => dispatch(selectDeliveryHolderSender(user))}
          onBlur={() => dispatch(validateDeliveryHolderSender())}
          disabled={!deliveryHolderSectionData.asset}
          dataTestId={'field-deliveryAccount'}
          dataOptionTestId={'option-deliveryAccountSearchResult'}
        />
        {errors[FormFields.DELIVERY_SENDER] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAccountError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.recipient)}>
        <SearchUser
          assetId={deliveryHolderSectionData.asset?.id}
          value={deliveryHolderSectionData.recipient}
          queryValue={deliveryHolderSectionData.recipientQuery}
          onSearch={(query) => dispatch(setDeliveryHolderRecipientQuery(query))}
          onSelect={(user) => dispatch(selectDeliveryHolderRecipient(user))}
          onBlur={() => dispatch(validateDeliveryHolderRecipient())}
          dataTestId={'field-paymentDeliveryAccount'}
          disabled={!deliveryHolderSectionData.asset}
        />
        {errors[FormFields.DELIVERY_RECIPIENT] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.validAccountError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.quantity)}>
        <Quantity
          value={deliveryHolderSectionData.quantity}
          onChange={(quantity) => dispatch(setDeliveryHolderQuantity(quantity))}
          max={spendableAmount}
          useMax={(max) => dispatch(setDeliveryHolderQuantity(max))}
          onBlur={() => dispatch(validateDeliveryHolderQuantity())}
          disabled={!deliveryHolderSectionData.sender}
          dataTestId={'field-deliveryQuantity'}
        />
        {errors[FormFields.DELIVERY_QUANTITY] && (
          <p className={'form-error'}>
            Please insert an amount between 0 and {spendableAmount}
          </p>
        )}
      </TradeFormField>
    </CollapsableCard>
  );
};
