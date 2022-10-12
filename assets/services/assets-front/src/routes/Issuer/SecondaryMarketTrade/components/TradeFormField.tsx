import React, { PropsWithChildren } from 'react';

interface IProps {
  label: string;
}

export const TradeFormField: React.FC<PropsWithChildren<IProps>> = (
  props: PropsWithChildren<IProps>,
) => {
  return (
    <div className={'secondary-market-trade__create-trade-form__field'}>
      <div className={'create-trade-form__field__label'}>{props.label}</div>
      <div className={'create-trade-form__field__control'}>
        {props.children}
      </div>
    </div>
  );
};
