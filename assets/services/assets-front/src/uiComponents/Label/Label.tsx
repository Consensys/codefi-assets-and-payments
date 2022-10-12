import React from 'react';
import { useIntl } from 'react-intl';
import { commonActionsTexts } from 'texts/commun/actions';

import StyledLabel from './StyledLabel';

interface IProps {
  readonly label: string | React.ReactNode;
  readonly className?: string;
  readonly htmlFor?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
}

const Label: React.FC<IProps> = ({
  className,
  htmlFor,
  label,
  disabled = false,
  required = false,
}: IProps) => {
  const intl = useIntl();
  return (
    <StyledLabel className={className} htmlFor={htmlFor}>
      {label}
      {!disabled && (
        <>
          {required ? (
            <span className="required-asterisk">*</span>
          ) : (
            <span className="optional">
              ({intl.formatMessage(commonActionsTexts.optional)})
            </span>
          )}
        </>
      )}
    </StyledLabel>
  );
};

export default Label;
