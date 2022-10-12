import React from 'react';
import { mdiLock } from '@mdi/js';
import Logo from 'uiComponents/Logo';
import Icon from 'uiComponents/Icon';

import './UnactivatedAccountStyles.scss';
import { colors } from 'constants/styles';
import Button from 'uiComponents/Button';
import { useAuth0 } from 'auth/auth0';
import { useIntl } from 'react-intl';
import { loginTexts } from 'texts/routes/login';

const UnactivatedAccount = () => {
  const { logout } = useAuth0();
  const intl = useIntl();
  return (
    <div id="_routes_unactivatedAccount">
      <div>
        <Logo withLabel />
        <Icon icon={mdiLock} color={colors.main} width={36} />
        <span>{intl.formatMessage(loginTexts.unActivatedAccount)}</span>
        <Button
          onClick={() => logout({ returnTo: window.location.origin })}
          size="small"
          color={colors.mainDark}
          label={intl.formatMessage(loginTexts.logout)}
        />
      </div>
    </div>
  );
};

export default UnactivatedAccount;
