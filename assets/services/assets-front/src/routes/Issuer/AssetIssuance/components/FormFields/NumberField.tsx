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

export const NumberField: FC<IProps> = ({
  element,
  reviewMode,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  let rightTag;
  if (element.rightTag) {
    rightTag = i18n(intl.locale, element.rightTag);
    if (rightTag === 'currency') {
      rightTag = undefined;
    }
  }

  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <Input
        label={i18n(intl.locale, element.label)}
        name={element.key}
        type="number"
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
        step="any"
        min="0.001"
        defaultValue={element.data[0]}
        labelDescription={
          element.sublabel ? i18n(intl.locale, element.sublabel) : undefined
        }
        readOnly={reviewMode}
        leftTag={
          element.leftTag ? i18n(intl.locale, element.leftTag) : undefined
        }
        rightTag={rightTag}
        placeholder={
          element.placeholder
            ? i18n(intl.locale, element.placeholder)
            : undefined
        }
        onChange={(_event, value) =>
          onUpdateData(element.key, value ? [value] : [])
        }
      />
    </div>
  );
};
