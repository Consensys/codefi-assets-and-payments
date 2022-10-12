import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import { useIntl } from 'react-intl';
import { mdiPlus, mdiTrashCan } from '@mdi/js';
import chunk from 'lodash/chunk';
import Input from 'uiComponents/Input';
import InputFile from 'uiComponents/InputFile';
import Button from 'uiComponents/Button';
import Label from 'uiComponents/Label';
import { spacing, colors } from 'constants/styles';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { IIssuanceElement } from '../../insuanceDataType';
import i18n from 'utils/i18n';

const getFileAccept = (accept: string | undefined) => {
  switch (accept) {
    case 'pdf':
      return '.pdf';
    case 'image':
      return '.png,.jpg,jpeg,.JPG,.JPEG';
    default:
      return undefined;
  }
};

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const TeamField: FC<IProps> = ({
  element,
  style,
  reviewMode,
  onUpdateData,
}: IProps) => {
  const teamElements = 6;
  const intl = useIntl();
  const chunks = chunk(element.data, teamElements);
  if (reviewMode && chunks.length === 0) {
    return <span style={{ marginBottom: '8px' }}>-</span>;
  }
  return (
    <div
      className={clsx('_route_issuer_assetIssuance_formField', {
        [`size_${element.size}`]: element.size,
        fillLine: element.fillLine,
      })}
      style={style}
    >
      {!reviewMode && (
        <>
          <Label
            label={i18n(intl.locale, element.label)}
            required={false}
            disabled={reviewMode}
          />
          {element.sublabel && (
            <span
              style={{
                fontSize: '14px',
                lineHeight: '150%',
                color: '#475166',
              }}
            >
              {i18n(intl.locale, element.sublabel)}
            </span>
          )}
        </>
      )}
      {chunks.map((data, teamMemberIndex) => {
        const changeIndex = teamMemberIndex * teamElements;
        const key = `${element.key}_${JSON.stringify(data[0])}_${changeIndex}`;
        return (
          <div
            key={key}
            style={{
              borderBottom:
                chunks.length === teamMemberIndex + 1 && reviewMode
                  ? 'none'
                  : '1px solid #DFE0E6',
            }}
          >
            <Input
              label={intl.formatMessage(
                assetIssuanceMessages.addManagementTeamMembersName,
              )}
              name={`${key}_name`}
              type="text"
              required
              style={{ marginBottom: spacing.small }}
              defaultValue={data[0]}
              readOnly={reviewMode}
              onBlur={(_event, value) => {
                const newValues = [...element.data];
                newValues[changeIndex] = value || '';
                onUpdateData(element.key, newValues);
              }}
            />
            <Input
              label={intl.formatMessage(
                assetIssuanceMessages.addManagementTeamMembersRole,
              )}
              name={`${key}_role`}
              type="text"
              required
              style={{ marginBottom: spacing.small }}
              defaultValue={data[1]}
              readOnly={reviewMode}
              onChange={(_event, value) => {
                const newValues = [...element.data];
                newValues[changeIndex + 1] = value || '';
                onUpdateData(element.key, newValues);
              }}
            />
            <Input
              label={intl.formatMessage(
                assetIssuanceMessages.addManagementTeamMembersUrl,
              )}
              name={`${key}_linkedin`}
              type="url"
              required
              style={{ marginBottom: spacing.small }}
              defaultValue={data[2]}
              readOnly={reviewMode}
              onChange={(_event, value) => {
                const newValues = [...element.data];
                newValues[changeIndex + 2] = value || '';
                onUpdateData(element.key, newValues);
              }}
            />
            <Input
              label={intl.formatMessage(
                assetIssuanceMessages.addManagementTeamMembersBio,
              )}
              name={`${key}_bio`}
              type="textarea"
              required
              style={{ marginBottom: spacing.small }}
              defaultValue={data[3]}
              readOnly={reviewMode}
              onChange={(_event, value) => {
                const newValues = [...element.data];
                newValues[changeIndex + 3] = value || '';
                onUpdateData(element.key, newValues);
              }}
            />
            <InputFile
              name={`${key}_image`}
              label={intl.formatMessage(
                assetIssuanceMessages.addManagementTeamMembersImage,
              )}
              disabled={reviewMode}
              accept={getFileAccept('image')}
              isImage
              required
              style={{ marginBottom: spacing.small }}
              value={!data[4] || !data[5] ? [] : [data[4], data[5]]}
              onChange={async (newValue) => {
                try {
                  const newValues = [...element.data];
                  newValues[changeIndex + 4] = newValue[0] || '';
                  newValues[changeIndex + 5] = newValue[1] || '';
                  onUpdateData(element.key, newValues);
                } catch (err) {
                  console.log(err);
                }
              }}
            />

            {!reviewMode && (
              <Button
                label={intl.formatMessage(
                  assetIssuanceMessages.removeManagementTeamMember,
                )}
                type="button"
                iconLeft={mdiTrashCan}
                secondary
                size="small"
                style={{
                  marginTop: spacing.tightLooser,
                  marginBottom: spacing.tight,
                }}
                color={colors.errorDark}
                onClick={() => {
                  onUpdateData(element.key, [
                    ...element.data.slice(0, changeIndex),
                    ...element.data.slice(changeIndex + teamElements),
                  ]);
                }}
              />
            )}
          </div>
        );
      })}
      {!reviewMode && (
        <Button
          label={intl.formatMessage(
            assetIssuanceMessages.addManagementTeamMembersButton,
          )}
          iconLeft={mdiPlus}
          secondary
          color="#666"
          size="small"
          style={{ marginTop: spacing.tight }}
          onClick={() =>
            onUpdateData(element.key, [
              ...element.data,
              ...Array(teamElements).fill(''),
            ])
          }
        />
      )}
    </div>
  );
};
