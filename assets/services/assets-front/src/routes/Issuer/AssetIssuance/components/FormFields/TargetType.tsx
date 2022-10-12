import React from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { chunk } from 'lodash';
import { mdiPlus, mdiTrashCan } from '@mdi/js';
import { useIntl } from 'react-intl';
import { CascaderValueType } from 'antd/lib/cascader';

import { IIssuanceElement } from '../../insuanceDataType';
import Input from 'uiComponents/Input';
import Select from 'uiComponents/Select';
import Button from 'uiComponents/Button';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { ElementStatus } from '../../elementsTypes';
import i18n from 'utils/i18n';
import { colors, spacing } from 'constants/styles';
import Label from 'uiComponents/Label';
import { Cascader, Progress } from 'antd';
import { SdgIcon } from 'uiComponents/SdgIcons/SdgIcon';
import { impactTargetOptions } from 'constants/impactTargetUnits';

interface IProps {
  element: IIssuanceElement;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
  readonly style?: CSS.Properties;
  reviewMode?: boolean;
}

export const TargetType: React.FC<IProps> = ({
  element,
  style,
  onUpdateData,
  reviewMode,
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
      <Label
        label={i18n(intl.locale, element.label)}
        required={
          element.status === ElementStatus.mandatory ||
          element.status === ElementStatus.conditionalMandatory
        }
        disabled={reviewMode}
      />
      <div
        className="impactTargets"
        style={{
          paddingLeft: reviewMode ? 0 : '10px',
        }}
      >
        {chunk(element.data, 4).map((data, dataIndex) => (
          <div key={`fee-${dataIndex}`}>
            <div>
              <Input
                type="text"
                defaultValue={element.data[dataIndex * 4]}
                readOnly={reviewMode}
                required
                label={intl.formatMessage(assetIssuanceMessages.metric)}
                onChange={(_event, value) => {
                  const newValues = [...element.data];
                  newValues[dataIndex * 4] = value || '';
                  onUpdateData(element.key, newValues);
                }}
              />
              <div>
                <Label
                  label={intl.formatMessage(assetIssuanceMessages.unit)}
                  required={
                    element.status === ElementStatus.mandatory ||
                    element.status === ElementStatus.conditionalMandatory
                  }
                  disabled={reviewMode}
                />
                {!reviewMode ? (
                  <Cascader
                    options={impactTargetOptions}
                    expandTrigger="hover"
                    placeholder=""
                    defaultValue={
                      [
                        '',
                        element.data[dataIndex * 4 + 1],
                      ] as unknown as CascaderValueType
                    }
                    value={
                      [
                        '',
                        element.data[dataIndex * 4 + 1],
                      ] as unknown as CascaderValueType
                    }
                    displayRender={(label: Array<string>) =>
                      label[label.length - 1]
                    }
                    onChange={(value, selectedOptions) => {
                      const newValues = [...element.data];
                      newValues[dataIndex * 4 + 1] =
                        (selectedOptions?.[1].label as unknown as string) || '';
                      onUpdateData(element.key, newValues);
                    }}
                  />
                ) : (
                  <span className="readOnly">
                    {element.data[dataIndex * 4 + 1]}
                  </span>
                )}
              </div>
              <Input
                type="text"
                placeholder={intl.formatMessage(
                  assetIssuanceMessages.targetPlaceholder,
                )}
                defaultValue={element.data[dataIndex * 4 + 2]}
                readOnly={reviewMode}
                required
                className="target"
                label={intl.formatMessage(assetIssuanceMessages.target)}
                onChange={(_event, value) => {
                  const newValues = [...element.data];
                  newValues[dataIndex * 4 + 2] = value || '';
                  onUpdateData(element.key, newValues);
                }}
              />
            </div>
            <div>
              <Select
                label={intl.formatMessage(assetIssuanceMessages.impactGoals)}
                labelDescription={intl.formatMessage(
                  assetIssuanceMessages.impactGoalsDescription,
                )}
                defaultValue={element.data[dataIndex * 4 + 3]}
                value={element.data[dataIndex * 4 + 3]}
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
                  newValues[dataIndex * 4 + 3] = value || '';
                  onUpdateData(element.key, newValues);
                }}
              />
            </div>
            <div className="targetPreview">
              <h2>
                {intl.formatMessage(assetIssuanceMessages.targetPreviewText)}
              </h2>
              <p>
                {intl.formatMessage(assetIssuanceMessages.targetDescription)}
              </p>
              <div className="targetBox">
                <Progress
                  type="circle"
                  percent={0}
                  strokeColor="#e8a126"
                  strokeWidth={10}
                  width={70}
                  format={() => (
                    <SdgIcon element={element.data[dataIndex * 4 + 3]} />
                  )}
                />
                {`${element.data[dataIndex * 4]} ${
                  element.data[dataIndex * 4 + 1]
                } ${element.data[dataIndex * 4 + 2]}`}
              </div>
            </div>
            {!reviewMode && element.data.length > 4 && (
              <Button
                label={intl.formatMessage(assetIssuanceMessages.removeTarget)}
                type="button"
                iconLeft={mdiTrashCan}
                secondary
                size="small"
                style={{
                  marginTop: spacing.tightLooser,
                  marginBottom: spacing.tight,
                }}
                color={colors.errorDark}
                onClick={async () => {
                  onUpdateData(element.key, [
                    ...element.data.slice(0, dataIndex * 4),
                    ...element.data.slice(dataIndex * 4 + 4),
                  ]);
                }}
              />
            )}
          </div>
        ))}
        {!reviewMode && (
          <Button
            style={{ marginTop: spacing.small }}
            label={intl.formatMessage(assetIssuanceMessages.addTarget)}
            iconLeft={mdiPlus}
            color="#666"
            secondary
            onClick={() =>
              onUpdateData(element.key, [...element.data, '', '', '', ''])
            }
          />
        )}
      </div>
    </div>
  );
};
