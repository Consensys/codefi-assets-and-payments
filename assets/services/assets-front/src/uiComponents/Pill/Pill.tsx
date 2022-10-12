import React from 'react';
import CSS from 'csstype';

import './PillStyles.scss';
import Icon from 'uiComponents/Icon';
import { mdiCloseCircle } from '@mdi/js';

export interface IPillInfo {
  readonly color?:
    | 'accent1'
    | 'accent2'
    | 'accent3'
    | 'accent4'
    | 'accent5'
    | 'error'
    | 'warning'
    | 'success';
  readonly label?: string;
  readonly tooltip?: string;
}

export interface IProps extends IPillInfo {
  readonly action?: () => void;
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSS.Properties;
  readonly children?: React.ReactNode;
}

const Pill: React.FC<IProps> = ({
  action,
  children,
  className = '',
  color,
  id,
  label,
  style,
}: IProps) => (
  <div
    className={`_uiComponent_pill ${className} ${color || ''} ${
      action ? 'withAction' : ''
    }`}
    id={id}
    style={style}
  >
    {label && label}

    {children && children}

    {action && (
      <button onClick={action}>
        <Icon icon={mdiCloseCircle} width={16} />
      </button>
    )}
  </div>
);

export default React.memo(Pill);
