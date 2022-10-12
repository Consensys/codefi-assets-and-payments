import './index.scss';

import React, { FC, ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { Button, Col, Row, Result } from 'antd';
import { Switch, Route, Link, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

import {
  API_CREATE_OR_UPDATE_CONFIG,
  API_RETRIEVE_CONFIG,
} from 'constants/apiRoutes';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_ASSET_MANAGEMENT,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_INTERFACE_CONFIGURATION,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS_CONTENT,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_ENTITY_MANAGEMENT,
  CLIENT_ROUTE_ACCOUNT_SETTINGS_API_CREDENTIALS,
} from 'routesList';
import { Card } from 'uiComponents/Card';
import PageTitle from 'uiComponents/PageTitle';
import { IUser, UserType } from 'User';
import { capitalizeFirstLetter } from 'utils/commonUtils';
import { applyConfig } from 'utils/configUtils';
import { DataCall } from 'utils/dataLayer';
import { useBreakpoint } from 'utils/layout';

import BlockchainNetworks from './BlockchainNetworks/';
import SuperAdminBlockchainNetworks from 'routes/SuperAdmin/BlockchainNetworks/BlockchainNetworks';
import { InterfaceConfiguration } from './InterfaceConfiguration';
import { Notifications } from './Notifications';
import { NotificationsContent } from './NotificationsContent';
import AccountSettingsProvider, {
  AccountSettingsProviderContext,
} from './provider';

import menuItems from './data';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { CommonTexts } from 'texts/commun/commonTexts';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { EntityManagement } from './EntityManagement/EntityManagement';
import { AssetManagement } from './AssetManagement/AssetManagement';
import { TenantType } from 'constants/tenantKeys';
import {
  accountSettingMessages,
  interfaceConfigurationMessages,
} from 'texts/routes/issuer/accountSettings';
import ApiCredentials from './ApiCredentials/ApiCredentials';
import {
  configSelector,
  tenantTypeSelector,
  userSelector,
} from 'features/user/user.store';
import store from 'features/app.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

const StyledRow = styled(Row)`
  &.xs {
    .ant-col {
      width: 100%;
    }
  }
`;

const StyledCard = styled(Card)`
  &.md {
    min-height: 124px;
  }
  display: block;
  cursor: pointer;
  width: 100%;
  transform: translate3d(0, 0, 0);
  transition: transform 0.15s ease-out;
  position: relative;
  a {
    display: block;
    padding: 1rem;
    width: 100%;
    height: 100%;
    h1,
    h2,
    h3,
    h4,
    h5 {
      font-size: var(--typography-size-f2);
      color: inherit;
    }
    p {
      font-size: var(--typography-size-f1);
      color: initial;
    }
  }
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;
    /* transform: translate3d(0, -5%, 0); */
  }
`;

const AccountSettings = () => {
  const intl = useIntl();
  const tenantType = useSelector(tenantTypeSelector) as TenantType;
  const { goBack } = useHistory();
  const { pathname }: any = useLocation();

  const { responsiveClassNames } = useBreakpoint();
  const user = useSelector(userSelector) as IUser;
  const config = (configSelector(store.getState()) as IConfig) || {};

  const MenuItems: FC = (): ReactElement => (
    <StyledRow
      align="stretch"
      gutter={[16, 16]}
      className={responsiveClassNames}
    >
      {menuItems(intl)
        .filter(({ permissions }) => {
          if (!permissions) {
            return true;
          } else {
            return (
              permissions[tenantType] &&
              permissions[tenantType].length > 0 &&
              permissions[tenantType].includes(user.userType)
            );
          }
        })
        .map(({ title, description, linkTo, permissions }) => (
          <Col key={linkTo} sm={24} md={8}>
            <StyledCard className={responsiveClassNames}>
              <Link to={linkTo}>
                <h4>{capitalizeFirstLetter(title)}</h4>
                <p>{description}</p>
              </Link>
            </StyledCard>
          </Col>
        ))}
    </StyledRow>
  );

  return (
    <AccountSettingsProvider>
      <div id="_route_issuer_accountSettings_root">
        <AccountSettingsProviderContext.Consumer>
          {({ theme, isLoading, setIsLoading }: any) => (
            <PageTitle
              withBreadcrumbs
              title={intl.formatMessage(accountSettingMessages.title)}
              tabNavigation={
                pathname === CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS
                  ? [
                      {
                        label: intl.formatMessage(
                          interfaceConfigurationMessages.layoutCustomisation,
                        ),
                        href: '#',
                        isActive: true,
                      },

                      {
                        label: intl.formatMessage(
                          interfaceConfigurationMessages.contentCustomisation,
                        ),
                        href: CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS_CONTENT,
                      },
                    ]
                  : pathname ===
                    CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS_CONTENT
                  ? [
                      {
                        label: intl.formatMessage(
                          interfaceConfigurationMessages.layoutCustomisation,
                        ),
                        href: CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS,
                      },

                      {
                        label: intl.formatMessage(
                          interfaceConfigurationMessages.contentCustomisation,
                        ),
                        href: '#',
                        isActive: true,
                      },
                    ]
                  : []
              }
              tabActions={
                pathname ===
                CLIENT_ROUTE_ACCOUNT_SETTINGS_INTERFACE_CONFIGURATION
                  ? [
                      {
                        label: intl.formatMessage(
                          accountSettingMessages.saveChangesAction,
                        ),
                        href: '',
                        isLoading: isLoading,
                        disabled: isLoading,
                        action: async () => {
                          setIsLoading(true);
                          try {
                            await DataCall({
                              method: API_CREATE_OR_UPDATE_CONFIG.method,
                              path: API_CREATE_OR_UPDATE_CONFIG.path(),
                              body: {
                                name: theme?.name,
                                logo: theme?.largeLogoBase64,
                                mainColor: theme?.colorMain,
                                data: {
                                  LOGO_WITHOUT_LABEL: theme?.smallLogoBase64,
                                  SIDEBAR_BACKGROUND:
                                    theme?.colorSidebarBackground,
                                  SIDEBAR_BACKGROUND_HOVER:
                                    theme?.colorSidebarBackgroundHover,
                                  SIDEBAR_TEXT: theme?.colorSidebarText,
                                  SIDEBAR_TEXT_HOVER:
                                    theme?.colorSidebarTextHover,
                                  FAVICON: theme?.faviconBase64,
                                },
                              },
                            });
                            const { config } = await DataCall({
                              method: API_RETRIEVE_CONFIG.method,
                              path: API_RETRIEVE_CONFIG.path(),
                            });
                            applyConfig(config);
                            window.location.reload();
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
                          setIsLoading(false);
                        },
                      },
                      {
                        label: intl.formatMessage(
                          accountSettingMessages.resetChangesAction,
                        ),
                        href: '',
                        secondary: true,
                        disabled: isLoading,
                        action: () => {
                          setIsLoading(true);
                          try {
                            applyConfig(config);
                            window.location.reload();
                          } catch (error) {
                            console.log(error);
                          }
                          setIsLoading(false);
                        },
                      },
                    ]
                  : pathname === CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS
                  ? [
                      {
                        label: intl.formatMessage(
                          accountSettingMessages.saveChangesAction,
                        ),
                        href: '',
                        isLoading: isLoading,
                        disabled: isLoading,
                        action: async () => {
                          setIsLoading(true);
                          try {
                            await DataCall({
                              method: API_CREATE_OR_UPDATE_CONFIG.method,
                              path: API_CREATE_OR_UPDATE_CONFIG.path(),
                              body: {
                                mailLogo: theme?.mailLogo,
                                mailColor: theme?.mailColor,
                              },
                            });
                            const { config } = await DataCall({
                              method: API_RETRIEVE_CONFIG.method,
                              path: API_RETRIEVE_CONFIG.path(),
                            });
                            applyConfig(config);
                            window.location.reload();
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
                          setIsLoading(false);
                        },
                      },
                      {
                        label: intl.formatMessage(
                          accountSettingMessages.resetChangesAction,
                        ),
                        href: '',
                        secondary: true,
                        disabled: isLoading,
                        action: () => {
                          setIsLoading(true);
                          try {
                            applyConfig(config);
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
            />
          )}
        </AccountSettingsProviderContext.Consumer>
        <main>
          <Switch>
            <Route exact path={CLIENT_ROUTE_ACCOUNT_SETTINGS}>
              <MenuItems />
            </Route>
            <Route exact path={CLIENT_ROUTE_ACCOUNT_SETTINGS_ENTITY_MANAGEMENT}>
              <EntityManagement />
            </Route>
            <Route
              exact
              path={CLIENT_ROUTE_ACCOUNT_SETTINGS_INTERFACE_CONFIGURATION}
            >
              <InterfaceConfiguration />
            </Route>
            <Route exact path={CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS}>
              <Notifications />
            </Route>
            <Route
              exact
              path={CLIENT_ROUTE_ACCOUNT_SETTINGS_NOTIFICATIONS_CONTENT}
            >
              <NotificationsContent />
            </Route>
            <Route
              exact
              path={CLIENT_ROUTE_ACCOUNT_SETTINGS_BLOCKCHAIN_NETWORKS}
            >
              {user.userType !== UserType.SUPERADMIN ? (
                <BlockchainNetworks />
              ) : (
                <SuperAdminBlockchainNetworks />
              )}
            </Route>
            <Route exact path={CLIENT_ROUTE_ACCOUNT_SETTINGS_API_CREDENTIALS}>
              <ApiCredentials />
            </Route>
            <Route exact path={CLIENT_ROUTE_ACCOUNT_SETTINGS_ASSET_MANAGEMENT}>
              <AssetManagement />
            </Route>
            {/* Fallback Route */}
            <Route>
              <Result
                title="WE ARE LAUNCHING SOON... SIT TIGHT !"
                extra={
                  <Button type="primary" key="console" onClick={() => goBack()}>
                    Go Back
                  </Button>
                }
              />
            </Route>
          </Switch>
        </main>
      </div>
    </AccountSettingsProvider>
  );
};

export { InterfaceConfiguration } from './InterfaceConfiguration/';
export { Notifications } from './Notifications/';
export { NotificationsContent } from './NotificationsContent/';
export { EntityManagement } from './EntityManagement/EntityManagement';
export { AssetManagement } from './AssetManagement/AssetManagement';
export { default as BlockchainNetworks } from './BlockchainNetworks/';

export default AccountSettings;
