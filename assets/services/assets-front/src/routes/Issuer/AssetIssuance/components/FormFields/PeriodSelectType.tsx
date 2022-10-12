import clsx from 'clsx';
import CSS from 'csstype';
import React from 'react';
import { IIssuanceElement } from '../../insuanceDataType';
import Select from 'uiComponents/Select';
import { useIntl } from 'react-intl';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { ElementStatus } from '../../elementsTypes';
import i18n from 'utils/i18n';

interface IProps {
  element: IIssuanceElement;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
  readonly style?: CSS.Properties;
  reviewMode?: boolean;
}

export const PeriodSelectType: React.FC<IProps> = ({
  element,
  style,
  onUpdateData,
  reviewMode,
}: IProps) => {
  const intl = useIntl();

  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_3`]: 3,
        fillLine: true,
      })}
      style={style}
    >
      <div className="rate">
        <div className="periodSelectLabel">
          {i18n(intl.locale, element.label)}
        </div>
        <div>
          <div style={{ marginRight: '10px', fontWeight: 'bold' }}>
            {intl.formatMessage(assetIssuanceMessages.tPlus)}
          </div>
          <Select
            defaultValue={element.data[0]}
            required={
              element.status === ElementStatus.mandatory ||
              element.status === ElementStatus.conditionalMandatory
            }
            options={Array.from(Array(10).keys()).map((v) => ({
              label: `${v + 1}`,
              value: `${v + 1}`,
            }))}
            placeholder=" "
            readOnly={reviewMode}
            onChange={(value) => {
              const newValues = [...element.data];
              newValues[0] = value || '';
              onUpdateData(element.key, newValues);
            }}
            style={{ margin: '0 8px' }}
          />

          <Select
            defaultValue={element.data[1]}
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
              newValues[1] = value || '';
              onUpdateData(element.key, newValues);
            }}
          />
        </div>
      </div>
    </div>
  );
};
