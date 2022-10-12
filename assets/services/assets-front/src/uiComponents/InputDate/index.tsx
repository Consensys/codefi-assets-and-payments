import React from 'react';
import { mdiAlert, mdiAlertOctagon } from '@mdi/js';
import CSS from 'csstype';

import { colors } from 'constants/styles';
import { formatDate } from 'utils/commonUtils';

import Icon from 'uiComponents/Icon';
import Label from 'uiComponents/Label';

import StyledInputDate from './StyledInputDate';

export interface IProps {
  readonly className?: string;
  readonly defaultValue?: string | Date;
  readonly disabled?: boolean;
  readonly error?: string | React.ReactNode;
  readonly id?: string;
  readonly ['data-test-id']?: string;
  readonly label?: string | React.ReactNode;
  readonly leftTag?: string;
  readonly leftIcon?: string;
  readonly name?: string;
  readonly required?: boolean;
  readonly rightIcon?: string;
  readonly rightTag?: string;
  readonly sublabel?: string | React.ReactNode;
  readonly labelDescription?: string | React.ReactNode;
  readonly warning?: string | React.ReactNode;
  readonly readOnly?: boolean;
  readonly style?: CSS.Properties;
  readonly max?: string;
  readonly min?: string;
  readonly onBlur?: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string,
  ) => void | Promise<void>;
  readonly onChange?: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string,
  ) => void | Promise<void>;
  readonly onFocus?: (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string,
  ) => void | Promise<void>;
  readonly onKeyDown?: (
    event: React.KeyboardEvent<HTMLInputElement>,
    value?: string,
  ) => void | Promise<void>;
}

let inputIndex = 0;

const InputDate: React.FC<IProps> = ({
  className = '',
  disabled,
  error,
  id,
  label,
  labelDescription,
  leftTag,
  leftIcon,
  name,
  required,
  rightIcon,
  rightTag,
  sublabel,
  warning,
  readOnly,
  style,
  min,
  max,
  defaultValue,
  ...props
}) => {
  const onFocus = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (onFocus && typeof onFocus === 'function' && props.onFocus) {
      props.onFocus(event, event.currentTarget.value);
    }
  };

  const onBlur = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (onBlur && typeof onBlur === 'function' && props.onBlur) {
      props.onBlur(event, event.currentTarget.value);
    }
  };

  const onChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (onChange && typeof onChange === 'function' && props.onChange) {
      props.onChange(event, event.currentTarget.value);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown && typeof onKeyDown === 'function' && props.onKeyDown) {
      props.onKeyDown(event, event.currentTarget.value);
    }
  };

  let borderColor: string | undefined = undefined;
  if (error) {
    borderColor = colors.error;
  } else if (warning) {
    borderColor = colors.warning;
  }

  inputIndex++;
  const uniqId = `inputDateId-${inputIndex}`;
  defaultValue = defaultValue ? String(defaultValue) : '';

  return (
    <StyledInputDate
      id={id}
      className={`${className} ${disabled ? 'disabled' : ''}`}
      style={style}
    >
      {label && (
        <Label
          label={label}
          htmlFor={uniqId}
          disabled={readOnly}
          required={required}
        />
      )}

      {labelDescription && <span className="subLabel">{labelDescription}</span>}

      {!readOnly && (
        <div>
          {leftIcon && (
            <div className="left">
              <Icon icon={leftIcon} />
            </div>
          )}

          {leftTag && <div className="left tag">{leftTag}</div>}

          <input
            type="date"
            id={uniqId}
            data-test-id={props['data-test-id']}
            defaultValue={defaultValue}
            name={name}
            onBlur={onBlur}
            min={min}
            max={max}
            onChange={onChange}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            required={required}
            disabled={disabled}
            ref={(input) => (input = input as HTMLInputElement)}
            style={{
              ...(borderColor && { border: `1px solid ${borderColor}` }),
            }}
          />

          {rightIcon && (
            <div className="right">
              <Icon icon={rightIcon} />
            </div>
          )}

          {rightTag && <div className="right tag">{rightTag}</div>}
        </div>
      )}

      {readOnly && (
        <span id={uniqId} className="readOnly">
          {formatDate(new Date(`${defaultValue}T00:00:00`))}
        </span>
      )}

      {sublabel && (
        <label className="subLabel" htmlFor={uniqId}>
          {sublabel}
        </label>
      )}

      {error && (
        <label
          className="subLabel"
          htmlFor={uniqId}
          style={{ color: colors.error }}
        >
          <Icon icon={mdiAlertOctagon} width={16} color={colors.error} />
          {error}
        </label>
      )}

      {warning && (
        <label
          className="subLabel"
          htmlFor={uniqId}
          style={{ color: colors.warning }}
        >
          <Icon icon={mdiAlert} width={20} color={colors.warning} />
          {warning}
        </label>
      )}
    </StyledInputDate>
  );
};

export default InputDate;
