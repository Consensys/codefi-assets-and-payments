import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';

import { IUser } from 'User';
import i18n from 'utils/i18n';

import Select from 'uiComponents/Select';
import {
  getClientName,
  isInvestor,
  isWhitelistedUnderwriter,
} from 'utils/commonUtils';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  users: Array<IUser>;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const MultistringField: FC<IProps> = ({
  element,
  users,
  reviewMode,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  let options: Array<{ value: string; label: string } | string>;
  if (element.map === 'asset_participants_reviewerId') {
    options = users.filter(isInvestor).map((user) => ({
      label: getClientName(user),
      value: user.id,
    }));
  } else if (element.map === 'asset_participants_underwriterId') {
    options = users.filter(isWhitelistedUnderwriter).map((user) => ({
      label: getClientName(user),
      value: user.id,
    }));
  } else {
    options = element.options.map((option) => {
      if (typeof option === 'string') {
        return option;
      }
      return {
        value: option.value,
        label: i18n(intl.locale, option.label),
      };
    });
  }

  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      <Select
        onChange={(value) => onUpdateData(element.key, [value])}
        name={element.key}
        defaultValue={element.data[0]}
        label={i18n(intl.locale, element.label)}
        style={{ paddingBottom: '24px' }}
        readOnly={reviewMode}
        options={options}
        placeholder={
          element.placeholder ? i18n(intl.locale, element.placeholder) : ' '
        }
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
      />
    </div>
  );
};
