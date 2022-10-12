import React from 'react';
import { formatValue, parseValue } from './utils';
import { Input } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

enum Size {
  small = 'small',
  large = 'large',
}

interface IProps {
  value: number; // in seconds
  onChange: (value: number) => void;
  onBlur?: () => void;
  size?: Size;
  dataTestId?: string;
  format: string;
}

/**
 * DurationTimeField
 * @param value
 * @param onChange
 * @param format
 * @param size
 * @param dataTestId
 * @param onBlur
 * @constructor
 */
export const DurationTimeField: React.FC<IProps> = ({
  value,
  onChange,
  format,
  size,
  dataTestId,
  onBlur,
}: IProps) => {
  return (
    <>
      <Input
        prefix={<ClockCircleOutlined />}
        data-test-id={dataTestId}
        onBlur={onBlur}
        value={value > 0 ? parseValue(value, format) : '0:0:0'}
        size={size || 'large'}
        placeholder={format}
        onChange={(e) => onChange(formatValue(e.target.value, format))}
      />
    </>
  );
};
