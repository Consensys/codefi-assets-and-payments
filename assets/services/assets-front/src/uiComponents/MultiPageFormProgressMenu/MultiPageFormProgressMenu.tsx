import React from 'react';

import AutosaveIndicator from 'uiComponents/AutosaveIndicator';
import { multiPageFormProgressMenuTexts } from 'texts/components/multiPageFormProgressMenu';
import Button from 'uiComponents/Button';

import Icon from '../Icon';
import { mdiCheck } from '@mdi/js';
import { colors } from 'constants/styles';

import MultiPageFormProgressMenuStyles from './StyledMultiPageFormProgressMenu';
import { useIntl } from 'react-intl';

interface IProps {
  steps: Array<{
    name: string;
    totalFields: number;
    filledFields: number;
  }>;
  isSaving?: boolean;
  isSaved?: boolean;
  hasSavingError?: boolean;
  onExit?: () => void;
  currentStep: number;
}

const MultiPageFormProgressMenu: React.FC<IProps> = ({
  steps,
  isSaving,
  onExit,
  currentStep,
  hasSavingError,
  isSaved,
}: IProps) => {
  const intl = useIntl();
  return (
    <MultiPageFormProgressMenuStyles>
      <h2>{intl.formatMessage(multiPageFormProgressMenuTexts.title)}</h2>
      <ul>
        {steps.map((step, index) => (
          <li
            key={step.name}
            className={currentStep === index ? 'active' : undefined}
          >
            <span className="stepName">{step.name}</span>

            {step.totalFields > 0 && step.totalFields !== step.filledFields && (
              <span className="stepCount">{`${intl.formatMessage(
                multiPageFormProgressMenuTexts.inProgress,
              )} (${step.filledFields}/${step.totalFields})`}</span>
            )}

            {step.totalFields > 0 && step.totalFields === step.filledFields && (
              <span className="complete">
                <Icon icon={mdiCheck} width={18} color={colors.successDark} />
                {intl.formatMessage(multiPageFormProgressMenuTexts.complete)}
              </span>
            )}
          </li>
        ))}
      </ul>

      <AutosaveIndicator
        isSaving={isSaving}
        isSaved={isSaved}
        hasSavingError={hasSavingError}
      />

      {onExit && (
        <Button
          label={intl.formatMessage(multiPageFormProgressMenuTexts.exitLabel)}
          onClick={onExit}
          secondary
          color="#666"
        />
      )}
    </MultiPageFormProgressMenuStyles>
  );
};

export default MultiPageFormProgressMenu;
