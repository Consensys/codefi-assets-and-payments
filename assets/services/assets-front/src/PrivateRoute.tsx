import React, { useEffect } from 'react';
import { Route, RouteProps, useHistory } from 'react-router-dom';
import { useAuth0 } from 'auth/auth0';
import { useSelector } from 'react-redux';
import { UserType } from 'User';
import {
  CLIENT_ROUTE_ACTIVATE_ACCOUNT,
  CLIENT_ROUTE_WORKSPACE,
} from 'routesList';
import PageLoader from 'uiComponents/PageLoader';
import Layout from 'uiComponents/Layout';
import { getConfig } from 'utils/configUtils';
import { userSelector } from 'features/user/user.store';

interface IProps extends RouteProps {
  navigation?: boolean;
  withAside?: boolean;
}

const PrivateRoute = ({
  navigation = true,
  withAside = true,
  component: Component,
  path,
  ...rest
}: IProps) => {
  const { isInitializing, isAuthenticated, loginWithRedirect } = useAuth0();
  const user = useSelector(userSelector);
  const { push } = useHistory();
  const config = getConfig();
  const hasWorkspaceFeature = config.DISPLAY_COMPANY_NAME_SCREEN;

  useEffect(() => {
    if (isInitializing) {
      return;
    } else if (isAuthenticated) {
      if (!user) {
        push(CLIENT_ROUTE_ACTIVATE_ACCOUNT);
      } else if (
        hasWorkspaceFeature &&
        user.userType === UserType.ISSUER &&
        !user.data.company
      ) {
        push(CLIENT_ROUTE_WORKSPACE);
      }
    } else {
      const fn = async () => {
        await loginWithRedirect({
          appState: { targetUrl: window.location.pathname },
        });
      };
      fn();
    }
  }, [
    isInitializing,
    isAuthenticated,
    loginWithRedirect,
    path,
    push,
    hasWorkspaceFeature,
    user,
  ]);

  if (isAuthenticated) {
    if (navigation) {
      return (
        <Layout withAside={withAside}>
          <Route path={path} component={Component} {...rest} />
        </Layout>
      );
    }
    return <Route path={path} component={Component} {...rest} />;
  }

  return <PageLoader />;
};

export default PrivateRoute;
