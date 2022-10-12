import React from 'react';
import { Menu, Dropdown as AntDropdown } from 'antd';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';

import { Link } from 'react-router-dom';
import { colors } from 'constants/styles';
import styled from 'styled-components';

export interface IProps {
  readonly label?: string;
  readonly iconLeft?: string;
  readonly data?: any;
  readonly options: Array<{
    label: string | ((data: any) => string);
    readonly iconLeft?: string;
    href?: string;
    onClick?: (data: any) => void;
    color?: string;
  }>;
  readonly size?: 'small' | 'big';
  readonly placement?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight';
  readonly colored?: boolean;
}

const StyledDropdown = styled(AntDropdown)<{ colored: boolean }>`
  background: ${(props) => (props.colored ? colors.main : 'none')} !important;
`;

const Dropdown: React.FC<IProps> = ({
  label,
  iconLeft,
  data,
  options,
  size,
  placement = 'bottomRight',
  colored = false,
}: IProps) => {
  const menu = (
    <Menu className="_uiComponent_dropdownMenu">
      {options.map(
        ({ href, iconLeft: optionIconLeft, label, onClick, color }) => {
          const labelValue = typeof label === 'function' ? label(data) : label;
          return (
            <Menu.Item key={labelValue}>
              <Link
                to={href || '#'}
                onClick={() => onClick && onClick(data)}
                style={{ display: 'flex', alignItems: 'center', color }}
              >
                {optionIconLeft && <Icon color={color} icon={optionIconLeft} />}
                {labelValue}
              </Link>
            </Menu.Item>
          );
        },
      )}
    </Menu>
  );
  return (
    <StyledDropdown
      colored={colored}
      overlay={menu}
      trigger={['click']}
      placement={placement}
      className="_uiComponent_dropdown"
    >
      <Button
        type="button"
        label={label}
        iconLeft={iconLeft}
        color="#666"
        tertiary
        size={size}
        noUnderline
      />
    </StyledDropdown>
  );
};

export default React.memo(Dropdown);
