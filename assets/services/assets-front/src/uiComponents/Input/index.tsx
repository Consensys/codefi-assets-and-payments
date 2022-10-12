import React from 'react';
import { mdiAlert, mdiAlertOctagon } from '@mdi/js';
import CSS from 'csstype';

import { colors } from 'constants/styles';
import { formatNumber } from 'utils/commonUtils';

import Icon from 'uiComponents/Icon';
import Label from 'uiComponents/Label';

import StyledInput from './StyledInput';
import { Link } from 'react-router-dom';

export type InputType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'color'
  | 'number'
  | 'password'
  | 'range'
  | 'search'
  | 'tel'
  | 'url'
  | 'time';

export interface IProps {
  readonly className?: string;
  readonly defaultValue?: string | Date | number;
  readonly disabled?: boolean;
  readonly error?: string | React.ReactNode;
  readonly id?: string;
  readonly ['data-test-id']?: string;
  readonly label?: string | React.ReactNode;
  readonly leftTag?: string;
  readonly leftIcon?: string;
  readonly max?: string | number;
  readonly maxLength?: number;
  readonly min?: string | number;
  readonly minLength?: number;
  readonly name?: string;
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
  readonly pattern?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly rightIcon?: string;
  readonly rightTag?: string;
  readonly step?: string;
  readonly sublabel?: string | React.ReactNode;
  readonly labelDescription?: string | React.ReactNode;
  readonly type?: InputType;
  readonly warning?: string | React.ReactNode;
  readonly readOnly?: boolean;
  readonly style?: CSS.Properties;
  readonly controlled?: boolean;
}

let inputIndex = 0;

export default class Input extends React.Component<
  IProps,
  Record<string, unknown>
> {
  private input!: HTMLInputElement | HTMLTextAreaElement;

  private onFocus = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (this.props.onFocus && typeof this.props.onFocus === 'function') {
      this.props.onFocus(event, event.currentTarget.value);
    }
  };

  private onBlur = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (this.props.onBlur && typeof this.props.onBlur === 'function') {
      this.props.onBlur(event, event.currentTarget.value);
    }
  };

  private onChange = (
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    if (this.props.onChange && typeof this.props.onChange === 'function') {
      this.props.onChange(event, event.currentTarget.value);
    }
  };

  private onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const isNumberType = this.props.type === 'number';
    const isSafari =
      navigator.userAgent.search('Safari') >= 0 &&
      navigator.userAgent.search('Chrome') < 0;
    const isDecimalNumber =
      event.key !== 'Backspace' && !/[0-9]|\./.test(event.key);
    const hasMultipleDots = event.key === '.' && this.getValue().match(/\./);
    if (isNumberType && isSafari && (isDecimalNumber || hasMultipleDots))
      event.preventDefault();

    if (this.props.onKeyDown && typeof this.props.onKeyDown === 'function') {
      this.props.onKeyDown(event, event.currentTarget.value);
    }
  };

  public focusInput = (): void => this.input.focus();

  public getValue = (): string => this.input.value;

  public setValue = (value: string): string => (this.input.value = value);

  public render(): JSX.Element {
    const {
      className = '',
      disabled,
      error,
      id,
      label,
      labelDescription,
      leftTag,
      leftIcon,
      max,
      maxLength,
      min,
      minLength,
      name,
      pattern,
      placeholder,
      required,
      rightIcon,
      rightTag,
      step,
      sublabel,
      type = 'text',
      warning,
      readOnly,
      style,
      controlled,
    } = this.props;
    let { defaultValue } = this.props;

    let borderColor: string | undefined = undefined;
    if (error) {
      borderColor = colors.error;
    } else if (warning) {
      borderColor = colors.warning;
    }

    inputIndex++;
    const uniqId = `inputId-${inputIndex}`;

    defaultValue = defaultValue ? String(defaultValue) : '';

    const handleControlled = controlled
      ? { value: defaultValue }
      : { defaultValue };

    return (
      <StyledInput
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

        {labelDescription && (
          <span className="subLabel">{labelDescription}</span>
        )}

        {!readOnly && (
          <div>
            {leftIcon && (
              <div className="left">
                <Icon icon={leftIcon} />
              </div>
            )}

            {leftTag && <div className="left tag">{leftTag}</div>}

            {type === 'textarea' ? (
              <textarea
                id={uniqId}
                data-test-id={this.props['data-test-id']}
                placeholder={placeholder}
                defaultValue={defaultValue}
                name={name}
                maxLength={maxLength}
                onBlur={this.onBlur}
                onFocus={this.onFocus}
                onChange={this.onChange}
                required={required || false}
                disabled={disabled || undefined}
                rows={4}
                ref={(input) => (this.input = input as HTMLTextAreaElement)}
                style={{
                  ...(borderColor && { border: `1px solid ${borderColor}` }),
                }}
              />
            ) : (
              <input
                type={type}
                id={uniqId}
                data-test-id={this.props['data-test-id']}
                pattern={pattern}
                placeholder={placeholder}
                {...handleControlled}
                name={name}
                min={min}
                minLength={minLength}
                max={max}
                maxLength={maxLength}
                onBlur={this.onBlur}
                onChange={this.onChange}
                onFocus={this.onFocus}
                onKeyDown={this.onKeyDown}
                required={required}
                step={step}
                disabled={disabled}
                ref={(input) => (this.input = input as HTMLInputElement)}
                style={{
                  ...(borderColor && { border: `1px solid ${borderColor}` }),
                }}
              />
            )}
            {rightIcon && (
              <div className="right">
                <Icon icon={rightIcon} />
              </div>
            )}

            {rightTag && <div className="right tag">{rightTag}</div>}
          </div>
        )}

        {readOnly && (
          <>
            {(() => {
              switch (type) {
                case 'url':
                  return (
                    <Link
                      id={uniqId}
                      className="readOnly"
                      to={{
                        pathname: `//${defaultValue}`,
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: colors.main }}
                    >
                      {defaultValue}
                    </Link>
                  );
                case 'number':
                  return (
                    <span id={uniqId} className="readOnly">
                      {formatNumber(parseFloat(defaultValue))}{' '}
                      {rightTag ? rightTag : ''}
                    </span>
                  );

                default:
                  return (
                    <span id={uniqId} className="readOnly">
                      {defaultValue} {rightTag ? rightTag : ''}
                    </span>
                  );
              }
            })()}
          </>
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
      </StyledInput>
    );
  }
}
