import React from 'react';
import { Link } from 'react-router-dom';
import CSS from 'csstype';

import Loader from 'uiComponents/Loader';
import './ButtonStyles.scss';
import Icon from 'uiComponents/Icon';
import { colors } from 'constants/styles';

export interface IProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly color?: string;
  readonly textColor?: string;
  readonly disabled?: boolean;
  readonly formAction?: string;
  readonly href?: string;
  readonly iconLeft?: string;
  readonly iconRight?: string;
  readonly id?: string;
  readonly isLoading?: boolean;
  readonly title?: string;
  readonly label?: string;
  readonly name?: string;
  readonly onClick?: (event: React.MouseEvent) => void;
  readonly onMouseDown?: (event: React.MouseEvent) => void;
  readonly onMouseOver?: (event: React.MouseEvent) => void;
  readonly onMouseUp?: (event: React.MouseEvent) => void;
  readonly secondary?: boolean;
  readonly size?: 'small' | 'big';
  readonly style?: CSS.Properties;
  readonly tertiary?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly value?: string | number;
  readonly width?: number | string;
  readonly noUnderline?: boolean;
  readonly 'data-test-id'?: string;
}

const Button: React.FC<IProps> = ({
  children,
  className,
  color = colors.main,
  textColor = colors.main,
  disabled,
  formAction,
  href,
  title,
  iconLeft,
  iconRight,
  id,
  isLoading,
  label,
  name,
  onClick,
  onMouseDown,
  onMouseOver,
  onMouseUp,
  secondary,
  size,
  style,
  tertiary,
  type,
  value,
  width,
  noUnderline = false,
  'data-test-id': dataTestId,
}: IProps) => {
  const stylesToInline: CSS.Properties = {
    ...style,
  };

  if (width && typeof width === 'number') {
    stylesToInline.width = `${width}px`;
  } else if (width && typeof width === 'string') {
    stylesToInline.width = width;
  }

  if (secondary) {
    stylesToInline.color = textColor || color;
    stylesToInline.background = '#fff';
    stylesToInline.border = `1px solid ${color}`;
  } else if (tertiary) {
    stylesToInline.color = color;
    stylesToInline.background = 'none';
  } else {
    stylesToInline.color = '#fff';
    stylesToInline.background = color;
  }

  const button = (
    <button
      className={`_uiComponent_button ${className || ''} ${size || 'normal'} ${
        disabled ? 'disabled' : ''
      } ${isLoading ? 'isLoading' : ''} ${secondary ? 'secondary' : ''} ${
        tertiary ? 'tertiary' : ''
      }`}
      data-test-id={dataTestId}
      disabled={isLoading || disabled || undefined}
      id={id || undefined}
      title={title || undefined}
      formAction={formAction || undefined}
      name={name || undefined}
      onClick={!disabled && !isLoading ? onClick : undefined}
      onMouseDown={!disabled && !isLoading ? onMouseDown : undefined}
      onMouseOver={!disabled && !isLoading ? onMouseOver : undefined}
      onMouseUp={!disabled && !isLoading ? onMouseUp : undefined}
      style={stylesToInline || undefined}
      type={type || 'button'}
      value={value || undefined}
    >
      {isLoading ? (
        <Loader
          color={secondary || tertiary ? color : '#fff'}
          width={size === 'small' ? 18 : 24}
        />
      ) : (
        <span>
          {iconLeft && (
            <Icon
              icon={iconLeft}
              color={secondary || tertiary ? color : '#fff'}
              width={size === 'small' ? 16 : 24}
              style={{ marginRight: '8px' }}
            />
          )}
          {label && label}
          {iconRight && (
            <Icon
              icon={iconRight}
              color={secondary || tertiary ? color : '#fff'}
              width={size === 'small' ? 16 : 24}
              style={{ marginLeft: '8px' }}
            />
          )}
          {children}
          {tertiary && !disabled && !noUnderline && (
            <span className="underline" style={{ backgroundColor: color }} />
          )}
        </span>
      )}
    </button>
  );

  if (href && !disabled) {
    return (
      <Link style={{ textDecoration: 'none', color: colors.main }} to={href}>
        {button}
      </Link>
    );
  }

  return button;
};

export default React.memo(Button);
