import React from 'react';
import {
  errorsSelector,
  FormFields,
  overviewSectionDataSelector,
  setExpiresIn,
  setOverviewIsEditing,
  updateNetwork,
  validateOverviewAndSave,
  validateOverviewExpiresIn,
  validateOverviewNetwork,
} from 'features/trades/create.store';
import { TradeFormSectionSummary } from '../TradeFormSectionSummary';
import { parseValueExtended } from 'uiComponents/DurationTimeField/utils';
import { TradeFormField } from '../TradeFormField';
import { DurationTimeField } from 'uiComponents/DurationTimeField';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { useDispatch, useSelector } from 'react-redux';
import { Select } from 'antd';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { Network } from 'types/Network';
import { SelectNetwork } from '../fields/SelectNetwork';

export const OverviewSection: React.FC = () => {
  const dispatch = useDispatch();
  const overviewSectionData = useSelector(overviewSectionDataSelector);
  const errors = useSelector(errorsSelector);
  const intl = useIntl();

  const sectionSummaryAttributes = [
    {
      label: intl.formatMessage(tradesTexts.tradeType),
      value: intl.formatMessage(tradesTexts.hold),
    },
    {
      label: intl.formatMessage(tradesTexts.expirationTime),
      value: parseValueExtended(overviewSectionData.expiresIn, 'dd:hh:mm'),
    },
    {
      label: intl.formatMessage(tradesTexts.network),
      value: overviewSectionData.network?.name,
    },
  ];

  return (
    <CollapsableCard
      className={'secondary-market-trade__create-trade-form__section'}
      header={intl.formatMessage(tradesTexts.overview)}
      saveButtonLabel={intl.formatMessage(tradesTexts.save)}
      saveButtonTestId={'save-overview'}
      onSave={() => dispatch(validateOverviewAndSave())}
      onEdit={() => dispatch(setOverviewIsEditing(true))}
      isCollapsed={!overviewSectionData.isEditing}
      collapsedContent={
        <TradeFormSectionSummary attributes={sectionSummaryAttributes} />
      }
    >
      <TradeFormField label={intl.formatMessage(tradesTexts.tradeType)}>
        <Select
          style={{ width: '100%' }}
          size={'large'}
          value={overviewSectionData.tradeType}
          // we only have 'hold' for now.
          options={[
            { label: intl.formatMessage(tradesTexts.hold), value: 'hold' },
          ]}
          disabled
        />
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.expirationTime)}>
        <DurationTimeField
          dataTestId={'field-expiresIn'}
          value={overviewSectionData.expiresIn}
          onChange={(value: number) => dispatch(setExpiresIn(value))}
          onBlur={() => dispatch(validateOverviewExpiresIn())}
          format={'dd:hh:mm'}
        />
        {errors[FormFields.EXPIRES_IN] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.expirationTimeError)}
          </p>
        )}
      </TradeFormField>

      <TradeFormField label={intl.formatMessage(tradesTexts.network)}>
        <SelectNetwork
          placeholder={intl.formatMessage(tradesTexts.selectANetwork)}
          value={overviewSectionData.network?.key}
          dataTestId={'field-network'}
          dataOptionTestId={'option-network'}
          onBlur={() => dispatch(validateOverviewNetwork())}
          onChange={(network: Network) => dispatch(updateNetwork(network))}
        />
        {errors[FormFields.NETWORK] && (
          <p data-test-id={'field_error-network'} className={'form-error'}>
            {intl.formatMessage(tradesTexts.selectANetworkError)}
          </p>
        )}
      </TradeFormField>
    </CollapsableCard>
  );
};
