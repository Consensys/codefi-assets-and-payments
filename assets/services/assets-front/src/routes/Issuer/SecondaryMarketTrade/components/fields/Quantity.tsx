import React from 'react';
import { Input } from 'antd';
import { numberWithCommas } from '../../../../../utils/commonUtils';
import { useIntl } from 'react-intl';
import { tradesTexts } from '../../../../../texts/routes/issuer/trades';

interface IProps {
  value: number | undefined;
  onChange: (value: number) => void;
  max?: number;
  useMax?: (max: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  dataTestId?: string;
}

export const Quantity: React.FC<IProps> = (props: IProps) => {
  const intl = useIntl();

  return (
    <>
      <Input
        style={{ width: '100%' }}
        size={'large'}
        type={'number'}
        placeholder={intl.formatMessage(tradesTexts.enterAQuantity)}
        value={String(props.value)}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        onBlur={props.onBlur}
        disabled={props.disabled}
        data-test-id={props.dataTestId}
      />
      {!props.disabled && props.max !== undefined && props.useMax && (
        <p
          className={
            'create-trade-form__field__control__tertiary use-max-balance'
          }
        >
          Balance: {numberWithCommas(props.max)}{' '}
          <span
            onClick={() => (props.useMax ? props.useMax(props.max || 0) : null)}
          >
            MAX
          </span>
        </p>
      )}
    </>
  );
};
