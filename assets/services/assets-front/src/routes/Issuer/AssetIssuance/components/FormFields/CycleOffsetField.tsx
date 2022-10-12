import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';
import i18n from 'utils/i18n';
import Input from 'uiComponents/Input';
import Label from 'uiComponents/Label';
import Select from 'uiComponents/Select';
import { capitalizeFirstLetter } from 'utils/commonUtils';
import { commonActionsTexts } from 'texts/commun/actions';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { OffsetType } from '../../templatesTypes';
import { IIssuanceElement, ITranslation } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  isNavDefined: boolean;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const CycleOffsetField: FC<IProps> = ({
  element,
  reviewMode,
  isNavDefined,
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
      <div className="timeAfterSubscription">
        <Label
          label={i18n(intl.locale, element.label)}
          disabled={reviewMode}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
        />
        <Select
          name={element.key}
          defaultValue={
            reviewMode
              ? `${element.data[0]} ${
                  element.data[0] === '1'
                    ? intl.formatMessage(commonActionsTexts.day)
                    : intl.formatMessage(commonActionsTexts.days)
                }`
              : element.data[0]
          }
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          options={Array.from(Array(10).keys()).map((v) => ({
            label: `${v + 1} day${v > 0 ? 's' : ''}`,
            value: `${v + 1}`,
          }))}
          placeholder=" "
          readOnly={reviewMode}
          onChange={(value) => {
            const newValue = [
              value,
              element.data[1],
              element.data[2],
              element.data[3],
            ];
            return onUpdateData(element.key, newValue);
          }}
        />
        <span />
        <Select
          defaultValue={element.data[1]}
          name={`${element.key}-condition`}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          options={Object.values(OffsetType).map((o) => ({
            label: capitalizeFirstLetter(o),
            value: o,
          }))}
          placeholder=" "
          readOnly={reviewMode}
          onChange={(value) => {
            const newValue = [
              element.data[0],
              value,
              element.data[2],
              element.data[3],
            ];
            return onUpdateData(element.key, newValue);
          }}
        />
        <span />
        <Select
          defaultValue={element.data[2]}
          name={`${element.key}-when`}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          options={(
            element.options as Array<{
              label: ITranslation;
              value: string;
            }>
          )
            .filter((o) =>
              isNavDefined && element.key.indexOf('initialSubscription') > -1
                ? o.value !== 'VALUATION'
                : true,
            )
            .map((o) => ({
              label: i18n(intl.locale, o.label),
              value: o.value,
            }))}
          placeholder=" "
          readOnly={reviewMode}
          onChange={(value) => {
            const newValue = [
              element.data[0],
              element.data[1],
              value,
              element.data[3],
            ];
            return onUpdateData(element.key, newValue);
          }}
        />
        <span>{intl.formatMessage(assetIssuanceMessages.at)}</span>
        <Input
          type="time"
          name={`${element.key}-at`}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          readOnly={reviewMode}
          defaultValue={element.data[3]}
          onChange={(_, value) => {
            const newValue = [
              element.data[0],
              element.data[1],
              element.data[2],
              String(value),
            ];
            return onUpdateData(element.key, newValue);
          }}
        />
      </div>
    </div>
  );
};
