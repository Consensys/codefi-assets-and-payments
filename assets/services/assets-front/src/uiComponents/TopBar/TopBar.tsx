import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  mdiAccount,
  mdiCogOutline,
  mdiHelpCircleOutline,
  mdiLogout,
} from '@mdi/js';

import { useAuth0 } from 'auth/auth0';
import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS,
  CLIENT_ROUTE_PROFILE,
} from 'routesList';
import Icon from 'uiComponents/Icon';
import { AppSwitcher } from 'uiComponents/AppSwitcher';
import { hasPermissions } from 'common/permissions/Can';
import rules, { Permissions } from 'common/permissions/rules';
import { IUser, UserType } from 'User';
import { getConfig } from 'utils/configUtils';
import { TenantType } from 'constants/tenantKeys';

import StyledTopBar from './StyledTopBar';

export const TopBar = ({ user }: { user: IUser }) => {
  const { logout } = useAuth0();
  const history = useHistory();
  const config = getConfig();
  const role = user?.userType;

  const enableSettings =
    hasPermissions(rules[role], Permissions.SETTINGS_MANAGE) ||
    (role === UserType.ISSUER &&
      config.tenantType === TenantType.PLATFORM_SINGLE_ISSUER);

  const enableMarketplaceSwitch =
    role === UserType.INVESTOR && config.data.enableMarketplace;
  // config.data is dynamic and can hold any data, so its not really possible to
  // add a correct type

  return (
    <StyledTopBar>
      <div
        onClick={() => {
          // eslint-disable-next-line
          (window as any).zE && (window as any).zE('webWidget', 'open');
        }}
      >
        <Icon icon={mdiHelpCircleOutline} />
      </div>
      {enableSettings && (
        <div onClick={() => history.push(CLIENT_ROUTE_ACCOUNT_SETTINGS)}>
          <Icon icon={mdiCogOutline} />
        </div>
      )}
      {enableMarketplaceSwitch && <AppSwitcher />}
      <div onClick={() => history.push(CLIENT_ROUTE_PROFILE)}>
        <Icon icon={mdiAccount} />
      </div>
      <div onClick={() => logout({ returnTo: window.location.origin })}>
        <Icon icon={mdiLogout} />
      </div>
    </StyledTopBar>
  );
};
