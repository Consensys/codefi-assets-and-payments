import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';
import i18n from 'utils/i18n';
import { IIssuanceElement } from '../../insuanceDataType';

interface IProps {
  element: IIssuanceElement;
  style?: CSS.Properties;
}

export const TitleField: FC<IProps> = ({ element, style }: IProps) => {
  const intl = useIntl();
  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <h4>{i18n(intl.locale, element.label)}</h4>
    </div>
  );
};
