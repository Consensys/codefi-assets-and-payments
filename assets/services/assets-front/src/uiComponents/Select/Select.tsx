import React, { useRef } from 'react';
import { mdiAlert } from '@mdi/js';
import CSS from 'csstype';
import clsx from 'clsx';

import { colors } from 'constants/styles';
import Label from 'uiComponents/Label';

import Icon from '../Icon';

import StyledSelect from './StyledSelect';

interface IProps {
  readonly className?: string;
  readonly ['data-test-id']?: string;
  readonly defaultValue?: string | number;
  readonly value?: string | number;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly label?: string;
  readonly name?: string;
  readonly onChange?: (newValue: string) => void;
  readonly options: Array<
    | string
    | {
        label: string;
        value: string;
        disabled?: boolean;
      }
  >;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly sublabel?: string | React.ReactNode;
  readonly readOnly?: boolean;
  readonly warning?: string | React.ReactNode;
  readonly style?: CSS.Properties;
  readonly labelDescription?: string | React.ReactNode;
}

let selectIndex = 0;

const Select: React.FC<IProps> = ({
  className,
  defaultValue = '',
  disabled,
  id,
  label,
  labelDescription,
  name,
  options,
  placeholder,
  required,
  style,
  sublabel,
  readOnly = false,
  warning,
  value,
  ...props
}) => {
  const select = useRef<HTMLSelectElement | null>(null);

  const onChange = (event: React.FormEvent<HTMLSelectElement>) => {
    if (props.onChange) {
      props.onChange(event.currentTarget.value);
    }
  };

  selectIndex++;
  const uniqId = `selectId-${selectIndex}`;
  const selectedOption = options.find((value) => {
    return typeof value === 'string'
      ? defaultValue === value
      : defaultValue === value.value;
  });
  let borderColor: string | undefined = undefined;
  if (warning) {
    borderColor = colors.warning;
  }

  return (
    <StyledSelect
      style={style}
      className={clsx({
        [className as string]: !!className,
        readOnly,
      })}
    >
      {label && <Label label={label} required={required} disabled={readOnly} />}

      {labelDescription && <span className="subLabel">{labelDescription}</span>}

      {!readOnly && (
        <div>
          <select
            name={name}
            data-test-id={props['data-test-id']}
            ref={select}
            id={id}
            required={required}
            onChange={onChange}
            defaultValue={defaultValue}
            value={value}
            style={{
              ...(borderColor && { border: `1px solid ${borderColor}` }),
            }}
            disabled={disabled}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((value) => {
              if (typeof value === 'string') {
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              } else {
                return (
                  <option
                    key={value.value}
                    value={value.value}
                    disabled={value.disabled}
                  >
                    {value.label}
                  </option>
                );
              }
            })}
          </select>
        </div>
      )}

      {readOnly && (
        <span id={uniqId} className="readOnly">
          {typeof selectedOption === 'string'
            ? selectedOption
            : selectedOption?.label}
        </span>
      )}

      {sublabel && (
        <label className="subLabel" htmlFor={uniqId}>
          {sublabel}
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
    </StyledSelect>
  );
};

export default Select;
