import clsx from 'clsx';
import CSS from 'csstype';
import { chunk, debounce } from 'lodash';
import React from 'react';
import { mdiClose } from '@mdi/js';
import { useIntl } from 'react-intl';

import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import Button from 'uiComponents/Button';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import Icon from 'uiComponents/Icon';
import i18n from 'utils/i18n';
import { spacing } from 'constants/styles';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import { DEBOUNCE_WAIT_TIME } from '../FormField';
interface IProps {
  element: IIssuanceElement;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
  readonly style?: CSS.Properties;
  reviewMode?: boolean;
}

export const FeeWithType: React.FC<IProps> = ({
  element,
  style,
  onUpdateData,
  reviewMode,
}: IProps) => {
  const intl = useIntl();
  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <div
        className="percentage"
        style={{
          paddingLeft: reviewMode ? 0 : '10px',
        }}
      >
        {chunk(element.data, 3).map((data, dataIndex) => (
          <div key={`fee-${dataIndex}`}>
            <Input
              type="text"
              readOnly={reviewMode}
              required
              label={intl.formatMessage(assetIssuanceMessages.feeName)}
              onChange={debounce((_event, value) => {
                const newValues = [...element.data];
                newValues[dataIndex * 3] = value || '';
                onUpdateData(element.key, newValues);
              }, DEBOUNCE_WAIT_TIME)}
              defaultValue={data[0]}
              style={{ width: '50%' }}
            />

            <Select
              label={intl.formatMessage(assetIssuanceMessages.feeType)}
              defaultValue={data[1]}
              required={
                element.status === ElementStatus.mandatory ||
                element.status === ElementStatus.conditionalMandatory
              }
              options={(element.options || []).map((el) => {
                if (typeof el === 'string') {
                  return el;
                }
                return {
                  value: el.value,
                  label: i18n(intl.locale, el.label),
                };
              })}
              placeholder=" "
              readOnly={reviewMode}
              onChange={(value) => {
                const newValues = [...element.data];
                newValues[dataIndex * 3 + 1] = value || '';
                onUpdateData(element.key, newValues);
              }}
              style={{ width: '35%', marginLeft: '16px' }}
            />

            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="1.50"
              readOnly={reviewMode}
              required={
                element.status === ElementStatus.mandatory ||
                element.status === ElementStatus.conditionalMandatory
              }
              label={i18n(intl.locale, element.label)}
              onChange={debounce((_event, value) => {
                const newValues = [...element.data];
                newValues[dataIndex * 3 + 2] = value || '';
                onUpdateData(element.key, newValues);
              }, DEBOUNCE_WAIT_TIME)}
              style={{ width: '35%', marginLeft: '16px' }}
              rightTag="%"
              defaultValue={data[2]}
            />
            {element.data.length > 2 && (
              <button
                type="button"
                style={{ marginRight: '-20px' }}
                onClick={async () => {
                  onUpdateData(element.key, [
                    ...element.data.slice(0, dataIndex),
                    ...element.data.slice(dataIndex + 3),
                  ]);
                }}
              >
                {!reviewMode && <Icon width={20} icon={mdiClose} />}
              </button>
            )}
          </div>
        ))}
        {!reviewMode && (
          <Button
            style={{ marginTop: spacing.small }}
            label={intl.formatMessage(assetIssuanceMessages.addAnotherFee)}
            color="#666"
            secondary
            onClick={() => onUpdateData(element.key, [...element.data, '', ''])}
          />
        )}
      </div>
    </div>
  );
};
