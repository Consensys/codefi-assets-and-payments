import React, { useEffect } from 'react';

import Logo from 'uiComponents/Logo/Logo';
import { useAuth0 } from 'auth/auth0';
import { useIntl } from 'react-intl';
import Button from 'uiComponents/Button';
import { mdiLogin } from '@mdi/js';
import { useHistory } from 'react-router-dom';
import { loginTexts } from 'texts/routes/login';
import StyledLogin from './StyledLogin';

export const Login = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const { push } = useHistory();
  const intl = useIntl();

  useEffect(() => {
    if (isAuthenticated) {
      push('/');
    }
  }, [isAuthenticated, push]);

  return (
    <StyledLogin>
      <Logo withLabel />

      <Button
        iconLeft={mdiLogin}
        data-test-id="login"
        label={intl.formatMessage(loginTexts.signInLabel)}
        onClick={() => {
          loginWithRedirect({
            appState: {
              targetUrl: window.location.pathname + window.location.search,
            },
            ui_locales: intl.locale,
          });
        }}
        size="small"
      />
    </StyledLogin>
  );
};
