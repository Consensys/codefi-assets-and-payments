import clsx from 'clsx';
import CSS from 'csstype';
import { debounce } from 'lodash';
import React from 'react';
import { IIssuanceElement } from '../../insuanceDataType';
import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import { useIntl } from 'react-intl';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { ElementStatus } from '../../elementsTypes';
import i18n from 'utils/i18n';
import { DEBOUNCE_WAIT_TIME } from '../FormField';

interface IProps {
  element: IIssuanceElement;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
  readonly style?: CSS.Properties;
  reviewMode?: boolean;
}

export const PercentagePerType: React.FC<IProps> = ({
  element,
  style,
  onUpdateData,
  reviewMode,
}: IProps) => {
  const intl = useIntl();

  const getOption = (el: any) => {
    if (typeof el === 'string') {
      return el;
    }
    return {
      value: el.value,
      label: i18n(intl.locale, el.label),
    };
  };
  const getOptionLabel = (el: any) => {
    if (typeof el === 'string') {
      return el;
    }
    return i18n(intl.locale, el.label);
  };
  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      {reviewMode ? (
        <span>
          {element.data[0]}% {intl.formatMessage(assetIssuanceMessages.per)}{' '}
          {getOptionLabel(
            (element.options || []).find(
              (el: any) =>
                el.value === element.data[1] || el === element.data[1],
            ) || '',
          )}
        </span>
      ) : (
        <div className="rate">
          <div>
            <Input
              data-test-id="rateValue"
              type="number"
              min="0.01"
              step="any"
              readOnly={reviewMode}
              required
              label={i18n(intl.locale, element.label)}
              style={{ width: '130px' }}
              onChange={debounce((_event, value) => {
                const newValues = [...element.data];
                newValues[0] = value || '';
                onUpdateData(element.key, newValues);
              }, DEBOUNCE_WAIT_TIME)}
              defaultValue={element.data[0]}
              rightTag="%"
            />
            <div style={{ margin: '30px 10px 0 10px' }}>
              {intl.formatMessage(assetIssuanceMessages.per)}
            </div>
            <Select
              defaultValue={element.data[1]}
              required={
                element.status === ElementStatus.mandatory ||
                element.status === ElementStatus.conditionalMandatory
              }
              data-test-id="rateFrequency"
              options={(element.options || []).map(getOption)}
              style={{ marginTop: '38px' }}
              placeholder=" "
              readOnly={reviewMode}
              onChange={(value) => {
                const newValues = [...element.data];
                newValues[1] = value || '';
                onUpdateData(element.key, newValues);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
