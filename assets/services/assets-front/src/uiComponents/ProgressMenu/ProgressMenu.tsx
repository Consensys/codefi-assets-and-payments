import React from 'react';
import { mdiCheck } from '@mdi/js';

import { commonActionsTexts } from 'texts/commun/actions';

import { IProgress } from 'types/Progress';

import Icon from 'uiComponents/Icon';
import Button from 'uiComponents/Button';
import AutosaveIndicator from 'uiComponents/AutosaveIndicator';
import { colors } from 'constants/styles';
import i18n from 'utils/i18n';

import StyledProgressMenu from './StyledProgressMenu';
import { useIntl } from 'react-intl';

interface IProps {
  step: string;
  saving: boolean;
  kycCompletion: Array<IProgress>;
  hasSavingError?: boolean;
  exitHref?: string;
}

const ProgressMenu: React.FC<IProps> = ({
  step,
  saving,
  kycCompletion,
  hasSavingError = false,
  exitHref,
}: IProps) => {
  const intl = useIntl();
  return (
    <StyledProgressMenu>
      <h2>{intl.formatMessage(commonActionsTexts.progress)}</h2>
      <ul>
        {kycCompletion.map(({ key, label, complete, progress }) => (
          <li key={key} className={key === step ? 'active' : ''}>
            <span className="label">{i18n(intl.locale, label)}</span>
            <span
              data-test-id={`status-${key}${
                complete ? '-complete' : '-in-progress'
              }`}
              className={`status${complete ? ' complete' : ''} `}
            >
              {complete ? (
                <>
                  <Icon icon={mdiCheck} width={16} color={colors.successDark} />{' '}
                  {intl.formatMessage(commonActionsTexts.complete)}
                </>
              ) : (
                <>
                  {intl.formatMessage(commonActionsTexts.inProgress)} (
                  {progress})
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <AutosaveIndicator
        isSaving={saving}
        isSaved={!saving}
        hasSavingError={hasSavingError}
      />
      {exitHref && (
        <Button
          label={intl.formatMessage(commonActionsTexts.exit)}
          secondary
          color="#444"
          size="small"
          href={exitHref}
        />
      )}
    </StyledProgressMenu>
  );
};

export default ProgressMenu;
