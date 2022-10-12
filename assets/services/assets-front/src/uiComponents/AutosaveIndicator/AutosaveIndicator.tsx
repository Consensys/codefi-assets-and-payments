import React from 'react';

import { autosaveIndicatorTexts } from 'texts/components/autosaveIndicator';
import Loader from '../Loader';
import { mdiAlertOctagon, mdiCheck } from '@mdi/js';
import Icon from '../Icon';
import { colors } from 'constants/styles';

import StyledAutosaveIndicator from './StyledAutosaveIndicator';
import { useIntl } from 'react-intl';

interface IProps {
  readonly hasSavingError?: boolean;
  readonly isSaved?: boolean;
  readonly isSaving?: boolean;
  readonly saveAgainAction?: () => void;
}

const AutosaveIndicator: React.FC<IProps> = ({
  hasSavingError,
  isSaved,
  isSaving,
  saveAgainAction,
}: IProps) => {
  const intl = useIntl();
  if (isSaving)
    return (
      <StyledAutosaveIndicator className="_uiComponent_autosaveIndicator saving">
        <Loader width={20} className="loader" />
        {intl.formatMessage(autosaveIndicatorTexts.savingLabel)}
      </StyledAutosaveIndicator>
    );

  if (isSaved)
    return (
      <StyledAutosaveIndicator className="_uiComponent_autosaveIndicator saved">
        <div>
          <Icon width={20} icon={mdiCheck} color={colors.successDark} />
          {intl.formatMessage(autosaveIndicatorTexts.savedLabel)}
        </div>
      </StyledAutosaveIndicator>
    );

  if (hasSavingError)
    return (
      <StyledAutosaveIndicator className="_uiComponent_autosaveIndicator error">
        <div>
          <Icon width={20} icon={mdiAlertOctagon} color={colors.errorDark} />
          {intl.formatMessage(autosaveIndicatorTexts.savingFailedLabel)}
          {saveAgainAction && (
            <button onClick={saveAgainAction}>
              {intl.formatMessage(autosaveIndicatorTexts.savingAgainLabel)}
            </button>
          )}
        </div>
      </StyledAutosaveIndicator>
    );

  return <React.Fragment />;
};

export default React.memo(AutosaveIndicator);
