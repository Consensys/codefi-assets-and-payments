import React from 'react';

import { progressBarTexts } from 'texts/components/progressBar';

import './ProgressBarStyles.scss';
import { useIntl } from 'react-intl';

interface IProps {
  readonly completion: number;
  readonly withLabel?: boolean;
}

const ProgressBar: React.FC<IProps> = ({ completion, withLabel }: IProps) => {
  const intl = useIntl();
  return (
    <div className="_uiComponents_progressBar">
      {withLabel && (
        <span>{`${completion}% ${intl.formatMessage(
          progressBarTexts.complete,
        )}`}</span>
      )}

      <div>
        <div style={{ width: `${completion}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
