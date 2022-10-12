import React from 'react';
import CSS from 'csstype';

import Label from 'uiComponents/Label';

import './InputGroupStyles.scss';

interface IColumnProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSS.Properties;
}

export const Column: React.FC<IColumnProps> = ({
  children,
  className,
  id,
  style,
}) => {
  return (
    <div className={`${className || ''} column`} id={id} style={style}>
      {children}
    </div>
  );
};

interface IGroupProps {
  readonly id?: string;
  readonly title?: string | React.ReactNode;
  readonly subTitle?: string;
  readonly className?: string;
  readonly required?: boolean;
  readonly children: React.ReactNode | Array<React.ReactNode>;
  readonly style?: CSS.Properties;
}

const InputGroup: React.FC<IGroupProps> = ({
  className,
  children,
  id,
  style,
  title,
  required,
  subTitle,
}) => {
  return (
    <div
      id={id}
      className={`${className || ''} uiComponent_inputGroup`}
      style={style}
    >
      {title && (
        <Label label={title} required={required} disabled={!required} />
      )}
      {subTitle && <span className="subTitle">{subTitle}</span>}
      <div
        className={`columns columns-${
          (children as Array<React.ReactNode>).length
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default InputGroup;
