import React, { ReactElement } from 'react';

interface IProps {
  attributes: {
    label: string | ReactElement;
    value?: string | ReactElement;
  }[];
}

export const TradeFormSectionSummary: React.FC<IProps> = (props: IProps) => {
  return (
    <div className={'create-trade-form__section-summary'}>
      {props.attributes.map((attribute, index) => (
        <div
          key={index}
          className={'create-trade-form__section-summary__attribute'}
        >
          <div
            className={'create-trade-form__section-summary__attribute__label'}
          >
            {attribute.label}
          </div>
          <div
            className={'create-trade-form__section-summary__attribute__value'}
          >
            {attribute.value || null}
          </div>
        </div>
      ))}
    </div>
  );
};
