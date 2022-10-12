import React from 'react';
import CSS from 'csstype';

import './Card.scss';

interface IProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly containerRef?: () => void;
  readonly id?: string;
  readonly htmlTag?: string;
  readonly style?: CSS.Properties;
}

export const Card: React.FC<IProps> = ({
  children,
  className,
  containerRef,
  id,
  style,
  htmlTag = 'div',
}: IProps) => {
  return React.createElement(
    htmlTag,
    {
      className: `_uiComponent_card ${className}`,
      id: id || undefined,
      ref: containerRef || undefined,
      style: style || undefined,
    },
    children,
  );
};
