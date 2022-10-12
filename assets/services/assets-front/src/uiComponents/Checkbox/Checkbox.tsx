import React, { useRef } from 'react';
import CSS from 'csstype';
import { mdiCheckBold } from '@mdi/js';

import Icon from 'uiComponents/Icon';

import StyledCheckbox from './StyledCheckbox';

interface IProps {
  readonly checked?: boolean;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly label?: string | React.ReactNode;
  readonly name?: string;
  readonly required?: boolean;
  readonly style?: CSS.Properties;
  readonly color?: string;
  readonly onChange?: (event: React.FormEvent<HTMLInputElement>) => void;
  readonly onToggle?: (event: boolean) => void;
}

let checkboxIndex = 0;

const Checkbox: React.FC<IProps> = ({
  checked = false,
  className,
  disabled,
  id,
  label,
  name,
  onChange,
  required = false,
  style,
  color,
}) => {
  const checkbox = useRef<HTMLInputElement | null>(null);

  checkboxIndex++;
  const uniqId = `uiComponent_checkbox-${checkboxIndex}`;

  return (
    <StyledCheckbox
      id={id}
      className={`${className || ''}`}
      style={style}
      colorMain={color}
    >
      <input
        defaultChecked={checked}
        disabled={disabled}
        id={uniqId}
        name={name}
        onChange={onChange}
        ref={checkbox}
        type="checkbox"
        required={required}
      />

      {label && <label htmlFor={disabled ? undefined : uniqId}>{label}</label>}
      <Icon icon={mdiCheckBold} width={13} color="#fff" />
    </StyledCheckbox>
  );
};

export default Checkbox;
