import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';
import { mdiClose } from '@mdi/js';
import chunk from 'lodash/chunk';

import i18n from 'utils/i18n';
import Input from 'uiComponents/Input';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import { spacing } from 'constants/styles';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { IIssuanceElement } from '../../insuanceDataType';
import { ElementStatus } from '../../elementsTypes';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

const feesElements = 2;

export const PercentageField: FC<IProps> = ({
  element,
  reviewMode,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  if (!element.multiline) {
    return (
      <div
        className={clsx('_route_issuer_assetIssuance_formField', {
          [`size_${element.size}`]: element.size,
          fillLine: element.fillLine,
        })}
        style={style}
      >
        <Input
          type="number"
          step="0.01"
          name={element.key}
          placeholder="1.5"
          readOnly={reviewMode}
          required={
            element.status === ElementStatus.mandatory ||
            element.status === ElementStatus.conditionalMandatory
          }
          label={i18n(intl.locale, element.label)}
          onChange={(_event, value) =>
            onUpdateData(element.key, value ? [value] : [])
          }
          rightTag="%"
          defaultValue={element.data[0]}
        />
      </div>
    );
  }

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
        {element.data.length > feesElements ? (
          <>
            {chunk(element.data, feesElements).map((data, feeIndex) => {
              const changeIndex = feesElements * feeIndex;
              return (
                <div key={`fee-${changeIndex}`}>
                  <Input
                    type="text"
                    readOnly={reviewMode}
                    required
                    label={intl.formatMessage(assetIssuanceMessages.feeName)}
                    onChange={(_event, value) => {
                      const newValues = [...element.data];
                      newValues[changeIndex] = value || '';
                      onUpdateData(element.key, newValues);
                    }}
                    defaultValue={data[0]}
                  />

                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.5"
                    readOnly={reviewMode}
                    required={
                      element.status === ElementStatus.mandatory ||
                      element.status === ElementStatus.conditionalMandatory
                    }
                    label={i18n(intl.locale, element.label)}
                    onChange={(_event, value) => {
                      const newValues = [...element.data];
                      newValues[changeIndex + 1] = value || '';
                      onUpdateData(element.key, newValues);
                    }}
                    rightTag="%"
                    defaultValue={data[1]}
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      onUpdateData(element.key, [
                        ...element.data.slice(0, changeIndex),
                        ...element.data.slice(changeIndex + feesElements),
                      ]);
                    }}
                  >
                    {!reviewMode && <Icon width={20} icon={mdiClose} />}
                  </button>
                </div>
              );
            })}
          </>
        ) : (
          <div>
            <Input
              type="text"
              readOnly={reviewMode}
              required
              label={intl.formatMessage(assetIssuanceMessages.feeName)}
              onChange={(_event, value) => {
                const newValues =
                  element.data.length === 0 ? ['', ''] : [...element.data];
                newValues[0] = value || '';
                onUpdateData(element.key, newValues);
              }}
              defaultValue={element.data[0]}
            />

            <Input
              type="number"
              step="0.01"
              placeholder="1.5"
              readOnly={reviewMode}
              required={
                element.status === ElementStatus.mandatory ||
                element.status === ElementStatus.conditionalMandatory
              }
              label={i18n(intl.locale, element.label)}
              onChange={(_event, value) => {
                const newValues =
                  element.data.length === 0 ? ['', ''] : [...element.data];
                newValues[1] = value || '';
                onUpdateData(element.key, newValues);
              }}
              rightTag="%"
              defaultValue={element.data[1]}
            />
          </div>
        )}
        {!reviewMode && (
          <Button
            style={{ marginTop: spacing.small }}
            label={intl.formatMessage(assetIssuanceMessages.addAnotherFee)}
            color="#666"
            secondary
            onClick={() =>
              onUpdateData(element.key, [
                ...element.data,
                ...Array(feesElements).fill(''),
              ])
            }
          />
        )}
      </div>
    </div>
  );
};
