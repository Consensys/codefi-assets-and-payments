import React, { useEffect } from 'react';
import { useAuth0 } from 'auth/auth0';
import PageLoader from 'uiComponents/PageLoader';
import { useHistory } from 'react-router-dom';
import { parseQuery } from 'utils/commonUtils';

const ActivateAccount = () => {
  const { isInitializing, loginWithRedirect, isAuthenticated } = useAuth0();
  const { push } = useHistory();
  useEffect(() => {
    if (isInitializing) {
      return;
    } else if (!isAuthenticated) {
      const fn = async () => {
        const { email, screen_hint: screenHint = 'signup' } = parseQuery(
          window.location.search,
        );
        await loginWithRedirect({
          appState: {
            targetUrl: window.location.pathname + window.location.search,
          },
          screen_hint: screenHint,
          login_hint: email,
        });
      };
      fn();
    } else {
      push('/');
    }
  }, [isInitializing, loginWithRedirect, isAuthenticated, push]);
  return <PageLoader />;
};

export default ActivateAccount;
