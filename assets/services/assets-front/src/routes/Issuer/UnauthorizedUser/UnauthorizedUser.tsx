import React from 'react';
import { mdiLock } from '@mdi/js';
import Logo from 'uiComponents/Logo';
import Icon from 'uiComponents/Icon';

import './UnauthorizedUserStyles.scss';
import { colors } from 'constants/styles';
import Button from 'uiComponents/Button';
import { useAuth0 } from 'auth/auth0';
import { useSelector } from 'react-redux';
import { IUser } from 'User';
import { getClientName } from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { loginTexts } from 'texts/routes/login';
import { userSelector } from 'features/user/user.store';

const UnauthorizedUser = () => {
  const { logout } = useAuth0();
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;

  return (
    <div id="_routes_unauthorizedUser">
      <div>
        <Logo withLabel />
        <Icon icon={mdiLock} color={colors.main} width={36} />
        <span>
          {intl.formatMessage(loginTexts.unauthorizedUser, {
            userName: getClientName(user),
            userType: user.userType,
          })}
        </span>
        <Button
          onClick={() => logout({ returnTo: window.location.origin })}
          size="small"
          color={colors.mainDark}
          label="Logout"
        />
      </div>
    </div>
  );
};

export default UnauthorizedUser;
