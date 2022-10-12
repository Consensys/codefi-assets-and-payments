import React, { FC } from 'react';
import clsx from 'clsx';
import CSS from 'csstype';
import debounce from 'lodash/debounce';
import { useIntl } from 'react-intl';
import { mdiDelete } from '@mdi/js';

import i18n from 'utils/i18n';
import { constructCofidocsFileUrl } from 'utils/commonUtils';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import Icon from 'uiComponents/Icon';
import Input from 'uiComponents/Input';
import Preview from 'uiComponents/Preview';
import { colors } from 'constants/styles';
import Label from 'uiComponents/Label';
import { IIssuanceElement } from '../../insuanceDataType';
import { DocumentField } from './DocumentField';
import { DEBOUNCE_WAIT_TIME } from '../FormField';

interface IProps {
  element: IIssuanceElement;
  reviewMode: boolean;
  style?: CSS.Properties;
  onUpdateData: (key: string, value: string[]) => Promise<void>;
}

export const DocusignField: FC<IProps> = ({
  element,
  reviewMode,
  style,
  onUpdateData,
}: IProps) => {
  const intl = useIntl();
  if (element.data.length > 0) {
    return (
      <div
        className={clsx('_route_issuer_assetIssuance_formField', {
          [`size_${element.size}`]: element.size,
          fillLine: element.fillLine,
        })}
        style={{ ...style }}
      >
        <Label label={i18n(intl.locale, element.label)} disabled />
        <table className="docusign">
          <thead>
            <tr>
              <td style={{ color: '#989CA6' }}>
                {intl.formatMessage(assetIssuanceMessages.document)}
              </td>
              <td>{intl.formatMessage(assetIssuanceMessages.docSignURL)}</td>
              {!reviewMode && <td></td>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Preview
                  label={element.data[0]}
                  url={constructCofidocsFileUrl(element.data[1])}
                  filename={element.data[0]}
                />
              </td>
              <td>
                <Input
                  type="url"
                  readOnly={reviewMode}
                  required
                  className="docusign-url"
                  style={{ marginBottom: '0' }}
                  onChange={debounce((_event, value) => {
                    const newValues = [...element.data];
                    newValues[2] = value || '';
                    onUpdateData(element.key, newValues);
                  }, DEBOUNCE_WAIT_TIME)}
                  defaultValue={element.data[2]}
                />
              </td>
              {!reviewMode && (
                <td>
                  <button
                    type="button"
                    onClick={() => onUpdateData(element.key, [])}
                  >
                    <Icon icon={mdiDelete} color={colors.errorDark} />
                  </button>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <DocumentField
      element={element}
      reviewMode={reviewMode}
      style={style}
      onUpdateData={onUpdateData}
    />
  );
};
