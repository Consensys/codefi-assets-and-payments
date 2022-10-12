import React from 'react';
import { Checkbox } from 'antd';
import { useIntl } from 'react-intl';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';

import { CommonTexts } from 'texts/commun/commonTexts';
import { UserType } from 'User';
import { API_CREATE_OR_UPDATE_CONFIG } from 'constants/apiRoutes';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { DataCall } from 'utils/dataLayer';
import { accountSettingsMenu } from 'texts/routes/issuer/accountSettings';
import { applyConfig } from 'utils/configUtils';
import { SettingsContainer } from '../SettingsContainer';
import { capitalizeFirstLetter } from 'utils/commonUtils';
import store from 'features/app.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { configSelector } from 'features/user/user.store';

const CheckboxGroup = Checkbox.Group;

export const EntityManagement: React.FC = () => {
  const intl = useIntl();
  const originalConfig = (configSelector(store.getState()) as IConfig) || {};
  const [restrictedUserTypes, setRestrictedUserTypes] = React.useState<
    CheckboxValueType[]
  >(originalConfig.restrictedUserTypes || []);

  const onChange = async (value: CheckboxValueType[]) => {
    try {
      setRestrictedUserTypes(value);
      const { config } = await DataCall({
        method: API_CREATE_OR_UPDATE_CONFIG.method,
        path: API_CREATE_OR_UPDATE_CONFIG.path(),
        body: {
          ...originalConfig,
          restrictedUserTypes: value,
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
    restrictedUserTypes.length === 1 && restrictedUserTypes.includes(value);
  return (
    <SettingsContainer
      title={intl.formatMessage(accountSettingsMenu.entityManagementTitle)}
      description={intl.formatMessage(
        accountSettingsMenu.entityManagementDescription,
      )}
    >
      <CheckboxGroup
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 140,
        }}
        options={[
          UserType.INVESTOR,
          UserType.ISSUER,
          UserType.NAV_MANAGER,
          UserType.UNDERWRITER,
          UserType.VERIFIER,
        ].map((value) => ({
          disabled: setDisabled(value),
          label: capitalizeFirstLetter(value),
          value,
        }))}
        value={
          restrictedUserTypes.length > 0
            ? restrictedUserTypes
            : [
                UserType.INVESTOR,
                UserType.ISSUER,
                UserType.NAV_MANAGER,
                UserType.UNDERWRITER,
                UserType.VERIFIER,
              ]
        }
        onChange={onChange}
      />
    </SettingsContainer>
  );
};
