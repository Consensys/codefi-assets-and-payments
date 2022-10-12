import React from 'react';
import {
  errorsSelector,
  FormFields,
  overviewSectionDataSelector,
  setExpiresIn,
  setOverviewIsEditing,
  validateOverviewAndSave,
  validateOverviewExpiresIn,
} from 'features/trades/accept.store';
import { TradeFormSectionSummary } from '../TradeFormSectionSummary';
import { parseValueExtended } from 'uiComponents/DurationTimeField/utils';
import { TradeFormField } from '../TradeFormField';
import { DurationTimeField } from 'uiComponents/DurationTimeField';
import { CollapsableCard } from 'uiComponents/CollapsableCard';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { tradesTexts } from 'texts/routes/issuer/trades';

export const PaymentOverviewSection: React.FC = () => {
  const dispatch = useDispatch();
  const overviewSectionData = useSelector(overviewSectionDataSelector);
  const errors = useSelector(errorsSelector);
  const intl = useIntl();

  const sectionSummaryAttributes = [
    {
      label: intl.formatMessage(tradesTexts.expirationTime),
      value: parseValueExtended(overviewSectionData.expiresIn, 'dd:hh:mm'),
    },
  ];

  return (
    <CollapsableCard
      className={'secondary-market-trade__accept-trade-form__section'}
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
      <TradeFormField
        label={intl.formatMessage(tradesTexts.paymentExpirationTime)}
      >
        <DurationTimeField
          dataTestId={'field-expiresIn'}
          value={overviewSectionData.expiresIn}
          onChange={(value: number) => dispatch(setExpiresIn(value))}
          onBlur={() => dispatch(validateOverviewExpiresIn())}
          format={'dd:hh:mm'}
        />
        {errors[FormFields.EXPIRES_IN] && (
          <p className={'form-error'}>
            {intl.formatMessage(tradesTexts.paymentExpirationTimeError)}
          </p>
        )}
      </TradeFormField>
    </CollapsableCard>
  );
};
