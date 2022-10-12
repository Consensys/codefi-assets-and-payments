/* eslint-disable react/jsx-key */
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
export const StringField: FC<IProps> = ({
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
      style={{ ...style, whiteSpace: 'pre-wrap' }}
    >
      {' '}
      {/* Added this whiteSpace to capture line */}
      <Input
        label={i18n(intl.locale, element.label)}
        max="255"
        maxLength={element.maxLength}
        name={element.key}
        type={
          element.multiline
            ? 'textarea'
            : element.map.toLowerCase().indexOf('email') > -1
            ? 'email'
            : element.map.toLowerCase().indexOf('website') > -1 ||
              element.map.toLowerCase().indexOf('url') > -1
            ? 'url'
            : 'text'
        }
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
        defaultValue={element.data[0]}
        labelDescription={
          element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
        }
        readOnly={reviewMode}
        leftTag={
          element.leftTag ? i18n(intl.locale, element.leftTag) : undefined
        }
        rightTag={
          element.rightTag ? i18n(intl.locale, element.rightTag) : undefined
        }
        placeholder={
          element.placeholder
            ? i18n(intl.locale, element.placeholder)
            : undefined
        }
        onChange={(_event, value) => {
          onUpdateData(element.key, value ? [value] : []);
        }}
      />
    </div>
  );
};
