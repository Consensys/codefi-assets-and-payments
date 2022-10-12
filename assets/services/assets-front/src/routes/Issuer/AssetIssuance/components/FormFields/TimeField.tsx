import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';

import i18n from 'utils/i18n';
import Input from 'uiComponents/Input';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const TimeField: FC<IProps> = ({
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
      <Input
        type="time"
        onChange={(_, value) => onUpdateData(element.key, [String(value)])}
        name={element.key}
        defaultValue={element.data[0]}
        label={i18n(intl.locale, element.label)}
        readOnly={reviewMode}
        placeholder={
          element.placeholder ? i18n(intl.locale, element.placeholder) : ' '
        }
        labelDescription={
          element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
        }
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
      />
    </div>
  );
};
