import React, { FC } from 'react';
import CSS from 'csstype';
import { useIntl } from 'react-intl';

import { ElementType } from '../elementsTypes';

import { IUser } from 'User';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { FeeWithType } from './FormFields/FeeWithType';
import { TargetType } from './FormFields/TargetType';
import { PeriodSelectType } from './FormFields/PeriodSelectType';
import { PercentagePerType } from './FormFields/PercentagePerType';
import { TitleField } from './FormFields/TitleField';
import { TeamField } from './FormFields/TeamField';
import { NumberField } from './FormFields/NumberField';
import { CycleOffsetField } from './FormFields/CycleOffsetField';
import { PercentageField } from './FormFields/PercentageField';
import { RadioField } from './FormFields/RadioField';
import { CheckboxField } from './FormFields/CheckboxField';
import { DocumentField } from './FormFields/DocumentField';
import { DocusignField } from './FormFields/DocusignField';
import { MultistringField } from './FormFields/MultistringField';
import { StringField } from './FormFields/StringField';
import { TimeField } from './FormFields/TimeField';
import { DateField } from './FormFields/DateField';

import { IIssuanceElement } from '../insuanceDataType';

import './FormFieldStyles.scss';
import BankInformationField from './FormFields/BankInformationField';

export const DEBOUNCE_WAIT_TIME = 1000;

interface IProps {
  element: IIssuanceElement;
  elements: Array<IIssuanceElement>;
  reviewMode?: boolean;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
  style?: CSS.Properties;
  users: Array<IUser>;
}

const FormField: FC<IProps> = ({
  element,
  elements,
  reviewMode = false,
  onUpdateData,
  style,
  users,
}: IProps) => {
  const intl = useIntl();

  const navElement = elements.find(
    (e) => e && e.key && e.key.indexOf('initialShareValue_check') > -1,
  );

  const isNavDefined = navElement?.data[0] === 'YES';

  // when nav value is set no need for valuation date
  if (
    isNavDefined &&
    element.key.indexOf('initialSubscription_valuation') > -1
  ) {
    return <></>;
  }

  const typeData = {
    element,
    reviewMode,
    style,
    onUpdateData,
  };
  if (element.defaultValue !== null && element.data[0] === undefined)
    onUpdateData(element.key, [element.defaultValue || '']);
  if (element.hidden) return null;

  switch (element.type) {
    case ElementType.title:
      return <TitleField element={element} style={style} />;

    case ElementType.team:
      return <TeamField {...typeData} />;
    case ElementType.number:
      return <NumberField {...typeData} />;
    case ElementType.string:
      return <StringField {...typeData} />;
    case ElementType.docusign:
      return <DocusignField {...typeData} />;
    case ElementType.document:
      return <DocumentField {...typeData} />;
    case ElementType.date:
      return <DateField {...typeData} />;
    case ElementType.time:
      return <TimeField {...typeData} />;
    case ElementType.multistring:
      return <MultistringField {...typeData} users={users} />;
    case ElementType.check:
      return <CheckboxField {...typeData} users={users} elements={elements} />;
    case ElementType.radio:
      return <RadioField {...typeData} users={users} elements={elements} />;
    case ElementType.target:
      return <TargetType {...typeData} />;
    case ElementType.periodSelect:
      return <PeriodSelectType {...typeData} />;
    case ElementType.perPercentage:
      return <PercentagePerType {...typeData} />;
    case ElementType.feeWithType:
      return <FeeWithType {...typeData} />;
    case ElementType.percentage:
      return <PercentageField {...typeData} />;
    case ElementType.timeAfterSubscription:
      return <CycleOffsetField {...typeData} isNavDefined={isNavDefined} />;
    case ElementType.bank:
      return <BankInformationField {...typeData} />;
    default:
      return (
        <>
          {intl.formatMessage(assetIssuanceMessages.invalidElement, {
            key: element.key,
          })}
        </>
      );
  }
};

export default FormField;
