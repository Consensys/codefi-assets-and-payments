import React, { useState } from 'react';

import { useSelector } from 'react-redux';
import { DataCall } from 'utils/dataLayer';
import {
  API_CREATE_OR_UPDATE_CONFIG,
  API_RETRIEVE_CONFIG,
} from 'constants/apiRoutes';

import PageTitle from 'uiComponents/PageTitle';
import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION,
  // CLIENT_ROUTE_ACCOUNT_SETTINGS_USER_MANAGEMENT,
  // CLIENT_ROUTE_ACCOUNT_SETTINGS_PLATFORM_SETTINGS,
} from 'routesList';
import { applyConfig } from 'utils/configUtils';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { TenantType } from 'constants/tenantKeys';
import { useIntl } from 'react-intl';
import { accountSettingMessages } from 'texts/routes/issuer/accountSettings';
import { IUser, UserType } from 'User';
import {
  configSelector,
  tenantTypeSelector,
  userSelector,
} from 'features/user/user.store';
import store from 'features/app.store';

interface IProps {
  readonly currentPath:
    | 'companyInformation'
    | 'interfaceConfiguration'
    | 'userManagment'
    | 'platformSettings'
    | '';
  callback?: () => any;
}

export const SettingsTitle: React.FC<IProps> = ({
  currentPath,
  callback,
}: IProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector(userSelector) as IUser;
  const originalConfig = (configSelector(store.getState()) as IConfig) || {};
  const tenantType = useSelector(tenantTypeSelector) as TenantType;
  const intl = useIntl();

  let configFieldsToUpdate: any = {};
  if (callback) {
    configFieldsToUpdate = callback();
  }

  const sameConfig = Object.keys(configFieldsToUpdate).every((key) => {
    if (key !== 'data') {
      return configFieldsToUpdate[key] === (originalConfig as any)[key];
    } else {
      return Object.keys(configFieldsToUpdate.data).every(
        (key_) =>
          configFieldsToUpdate.data[key_] ===
          (originalConfig as any).data[key_],
      );
    }
  });

  const configUpdated = {
    ...originalConfig,
    ...configFieldsToUpdate,
    data: {
      ...originalConfig.data,
      ...configFieldsToUpdate.data,
    },
  };

  let interfaceCanBeConfigured: boolean;

  switch (tenantType) {
    case TenantType.PLATFORM_SINGLE_ISSUER:
      interfaceCanBeConfigured =
        user.userType === UserType.ISSUER || user.userType === UserType.ADMIN;
      break;
    case TenantType.PLATFORM_MULTI_ISSUER:
      interfaceCanBeConfigured = user.userType === UserType.ADMIN;
      break;
    default:
      interfaceCanBeConfigured = user.userType === UserType.ADMIN;
  }

  return (
    <PageTitle
      title={intl.formatMessage(accountSettingMessages.title)}
      tabActions={
        interfaceCanBeConfigured
          ? [
              {
                label: intl.formatMessage(
                  accountSettingMessages.saveChangesAction,
                ),
                href: '',
                isLoading: isLoading,
                disabled: sameConfig,
                action: async () => {
                  setIsLoading(true);
                  try {
                    await DataCall({
                      method: API_CREATE_OR_UPDATE_CONFIG.method,
                      path: API_CREATE_OR_UPDATE_CONFIG.path(),
                      body: configUpdated,
                    });
                    const { config } = await DataCall({
                      method: API_RETRIEVE_CONFIG.method,
                      path: API_RETRIEVE_CONFIG.path(),
                    });
                    applyConfig(config);
                    window.location.reload();
                  } catch (error) {
                    console.log(error);
                  }
                  setIsLoading(false);
                },
              },
              {
                label: intl.formatMessage(
                  accountSettingMessages.resetChangesAction,
                ),
                href: '',
                secondary: true,
                disabled: sameConfig,
                action: () => {
                  setIsLoading(true);
                  try {
                    applyConfig(originalConfig);
                    window.location.reload();
                  } catch (error) {
                    console.log(error);
                  }
                  setIsLoading(false);
                },
              },
            ]
          : []
      }
      tabNavigation={
        interfaceCanBeConfigured
          ? [
              {
                href: CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION,
                label: intl.formatMessage(
                  accountSettingMessages.companyInformation,
                ),
                isActive: currentPath === 'companyInformation',
              },
              // {
              //   href: CLIENT_ROUTE_ACCOUNT_SETTINGS_USER_MANAGEMENT,
              //   label: "User Managment",
              //   isActive: currentPath === "userManagment",
              // },
              // {
              //   href: CLIENT_ROUTE_ACCOUNT_SETTINGS_PLATFORM_SETTINGS,
              //   label: "Platform Settings",
              //   isActive: currentPath === "platformSettings",
              // },
            ]
          : [
              {
                href: CLIENT_ROUTE_ACCOUNT_SETTINGS_COMPANY_INFORMATION,
                label: intl.formatMessage(
                  accountSettingMessages.companyInformation,
                ),
                isActive: currentPath === 'companyInformation',
              },
            ]
      }
    />
  );
};
