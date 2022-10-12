import React from 'react';

import StyledRadio from './StyledRadio';

interface IProps {
  readonly checked?: boolean;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly label?: string;
  readonly name?: string;
  readonly onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
  readonly required?: boolean;
  readonly value?: string;
  readonly color?: string;
}

let radioIndex = 0;

const Radio: React.FC<IProps> = ({
  checked,
  className,
  disabled,
  id,
  label,
  name,
  onChange,
  required = false,
  value,
  color,
}) => {
  radioIndex++;
  const uniqId = `uiComponent_radio-${radioIndex}`;

  return (
    <StyledRadio id={id} className={`${className || ''}`} colorMain={color}>
      <input
        defaultChecked={checked}
        disabled={disabled}
        id={uniqId}
        name={name}
        onChange={onChange}
        required={required}
        type="radio"
        value={value}
      />

      {label && <label htmlFor={disabled ? undefined : uniqId}>{label}</label>}
    </StyledRadio>
  );
};

export default Radio;
