import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';

import InputDate from 'uiComponents/InputDate';
import i18n from 'utils/i18n';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';
import { DEBOUNCE_WAIT_TIME } from '../FormField';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const DateField: FC<IProps> = ({
  element,
  reviewMode,
  style,
  onUpdateData,
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
      <InputDate
        label={i18n(intl.locale, element.label)}
        readOnly={reviewMode}
        name={element.key}
        defaultValue={element.data[0]}
        min={new Date().toISOString().split('T')[0]}
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
        labelDescription={
          element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
        }
        onChange={debounce((_event, value) => {
          onUpdateData(element.key, value ? [value] : []);
        }, DEBOUNCE_WAIT_TIME)}
      />
    </div>
  );
};
