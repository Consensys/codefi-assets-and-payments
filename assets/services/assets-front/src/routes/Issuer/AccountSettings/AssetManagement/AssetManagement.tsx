import React from 'react';
import { Checkbox } from 'antd';
import { useIntl } from 'react-intl';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';

import { accountSettingsMenu } from 'texts/routes/issuer/accountSettings';
import { CommonTexts } from 'texts/commun/commonTexts';
import { API_CREATE_OR_UPDATE_CONFIG } from 'constants/apiRoutes';
import { AssetType, IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { DataCall } from 'utils/dataLayer';
import { applyConfig } from 'utils/configUtils';
import { SettingsContainer } from '../SettingsContainer';
import { getAssetType } from 'utils/commonUtils';
import store from 'features/app.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { configSelector } from 'features/user/user.store';

const CheckboxGroup = Checkbox.Group;

export const AssetManagement: React.FC = () => {
  const intl = useIntl();
  const originalConfig = (configSelector(store.getState()) as IConfig) || {};

  const [retrictedAssetTypes, setRestrictedAssetTypes] = React.useState<
    CheckboxValueType[]
  >(originalConfig.restrictedAssetTypes || []);

  const onChange = async (value: CheckboxValueType[]) => {
    try {
      setRestrictedAssetTypes(value);
      const { config } = await DataCall({
        method: API_CREATE_OR_UPDATE_CONFIG.method,
        path: API_CREATE_OR_UPDATE_CONFIG.path(),
        body: {
          ...originalConfig,
          restrictedAssetTypes: value,
        },
      });
      applyConfig(config);
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };
  const setDisabled = (value: string) =>
    retrictedAssetTypes.length === 1 && retrictedAssetTypes.includes(value);
  return (
    <SettingsContainer
      title={intl.formatMessage(accountSettingsMenu.assetManagementTitle)}
      description={intl.formatMessage(
        accountSettingsMenu.assetManagementDescription,
      )}
    >
      <CheckboxGroup
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 140,
        }}
        options={Object.values(AssetType).map((value) => ({
          value,
          label: getAssetType(value),
          disabled: setDisabled(value),
        }))}
        value={
          retrictedAssetTypes.length > 0
            ? retrictedAssetTypes
            : Object.values(AssetType)
        }
        onChange={onChange}
      />
    </SettingsContainer>
  );
};
