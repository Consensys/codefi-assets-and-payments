import React from 'react';
import { Tooltip as ATooltip } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';

export interface IProps {
  children?: React.ReactNode;
  title: string;
  placement?: TooltipPlacement;
  width?: number;
}

const Tooltip: React.FC<IProps> = ({
  children,
  title,
  placement = 'top',
}: IProps) => {
  return (
    <ATooltip color="#000A28" placement={placement} title={title}>
      {children}
    </ATooltip>
  );
};

export default React.memo(Tooltip);
