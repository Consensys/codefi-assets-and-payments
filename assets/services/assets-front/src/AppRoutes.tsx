import { useSelector } from 'react-redux';
import { useAuth0 } from 'auth/auth0';
import { hasPermissions } from 'common/permissions/Can';
import rules from 'common/permissions/rules';
import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import ActivateAccount from 'routes/ActivateAccount';
// Common routes
import clientCreationRoutes from 'routes/common/clientCreationRoutes';
import commonRoutes from 'routes/common/commonRoutes';
import spaceRoutes from 'routes/common/spaceRoutes';
// Issuer routes
import IssuerRoutes from 'routes/Issuer/IssuerRoutes';
import UnactivatedAccount from 'routes/Issuer/UnactivatedAccount';
import UnauthorizedUser from 'routes/Issuer/UnauthorizedUser';
import MarketplaceSwitch from 'routes/Issuer/Switch';
import Explorer from 'routes/Issuer/Explorer';

// kycRoutes
import kycReviewRoutes from 'routes/kyc/kycReviewRoutes';
import { Login } from 'routes/Login';
// Public routes
import StylesGuide from 'routes/StylesGuide';
// Super Admin routes
import SuperAdminRoutes from 'routes/SuperAdmin/SuperAdminRoutes';
// Routes list
import {
  CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_ACTIVATE_ACCOUNT,
  CLIENT_ROUTE_ACTIVATE_URL_BY_ROLE,
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_LOGIN,
  CLIENT_ROUTE_SPACE_SELECTION,
  CLIENT_ROUTE_STYLES_GUIDE,
  CLIENT_ROUTE_SUPERADMIN_HOME,
} from 'routesList';
import PageLoader from 'uiComponents/PageLoader';
import { hasFeature } from 'utils/commonUtils';
import history from 'utils/history';
import { getConfig } from 'utils/configUtils';
import PrivateRoute from './PrivateRoute';
import { UserType } from './User';
import { getMarketplace } from 'utils/configs';
import { useSwitchView } from 'providers/switch-view';
import { userSelector } from 'features/user/user.store';

const getUnspacedRoutes = (
  role: UserType,
  isInvestorCreator: boolean,
): Array<{
  path: string | string[];
  component:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>;
  exact: boolean;
  navigation?: boolean;
  withAside?: boolean;
}> => {
  let routes: Array<any> = [];
  const config = getConfig();
  const enableMarketplace = getMarketplace(config);

  switch (role) {
    case UserType.ISSUER:
    case UserType.ADMIN:
      routes = [
        ...IssuerRoutes,
        ...[...kycReviewRoutes, ...commonRoutes].filter(
          ({ action }) => !action || hasPermissions(rules[role], action),
        ),
      ];
      break;
    case UserType.INVESTOR:
      isInvestorCreator
        ? (routes = [...IssuerRoutes, ...spaceRoutes])
        : (routes = [...spaceRoutes]);
      break;
    case UserType.VERIFIER:
      routes = [...spaceRoutes];
      break;
    case UserType.UNDERWRITER:
      enableMarketplace
        ? (routes = [...IssuerRoutes, ...clientCreationRoutes, ...spaceRoutes])
        : (routes = [...clientCreationRoutes, ...spaceRoutes]);
      break;
    case UserType.SUPERADMIN:
      routes = SuperAdminRoutes;
      break;
    default:
      routes = [];
  }
  return routes.filter(hasFeature);
};

const AppRoutes = () => {
  const { isInitializing, isAuthenticated } = useAuth0();
  const config = getConfig();
  const { isCreator, isExplorer } = useSwitchView();
  const user = useSelector(userSelector);

  if (isInitializing) {
    return <PageLoader />;
  }

  return (
    <Router history={history}>
      <Switch>
        {user &&
          getUnspacedRoutes(user.userType, isCreator).map(
            ({ path, component, exact, navigation, withAside }, index) => (
              <PrivateRoute
                key={`route-${index}`}
                exact={exact}
                path={path}
                component={component}
                navigation={navigation}
                withAside={withAside}
              />
            ),
          )}

        {/**
         * Misc
         */}
        <Route path={CLIENT_ROUTE_STYLES_GUIDE} component={StylesGuide} />
        <Route path="/switch" component={MarketplaceSwitch} />
        <Route path="/explorer" component={Explorer} />

        {/**
         * Common routes
         */}
        {!user && (
          <PrivateRoute
            exact
            path={CLIENT_ROUTE_ACTIVATE_ACCOUNT}
            navigation={false}
            component={UnactivatedAccount}
          />
        )}

        {[
          UserType.ISSUER,
          UserType.INVESTOR,
          UserType.VERIFIER,
          UserType.UNDERWRITER,
          UserType.SUPERADMIN,
          UserType.ADMIN,
          UserType.NAV_MANAGER,
        ].map((userType: UserType) => (
          <Route
            key={userType}
            exact
            path={CLIENT_ROUTE_ACTIVATE_URL_BY_ROLE.path(userType)}
            component={ActivateAccount}
          />
        ))}

        {!isAuthenticated && (
          <Route path={CLIENT_ROUTE_LOGIN} component={Login} />
        )}

        {/**
         * Default
         */}

        <Route
          render={() => {
            if (!isAuthenticated) {
              return <Redirect to={CLIENT_ROUTE_LOGIN} />;
            }
            if (!user) {
              return <Redirect to={CLIENT_ROUTE_ACTIVATE_ACCOUNT} />;
            }

            switch (user.userType) {
              case UserType.INVESTOR:
                // if a tenants has marketplace set then an can
                // switch between two apps (creator or explorer)
                if (config.data.enableMarketplace) {
                  return isCreator ? (
                    <Redirect to={CLIENT_ROUTE_ASSETS} />
                  ) : isExplorer ? (
                    <Redirect to={CLIENT_ROUTE_SPACE_SELECTION} />
                  ) : (
                    <Redirect to={'/switch'} />
                  );
                } else {
                  return <Redirect to={CLIENT_ROUTE_SPACE_SELECTION} />;
                }

              case UserType.UNDERWRITER:
              case UserType.VERIFIER:
                return <Redirect to={CLIENT_ROUTE_SPACE_SELECTION} />;
              case UserType.SUPERADMIN:
                return <Redirect to={CLIENT_ROUTE_SUPERADMIN_HOME} />;
              case UserType.ISSUER:
                return <Redirect to={CLIENT_ROUTE_ASSETS} />;
              case UserType.ADMIN:
                return (
                  <Redirect
                    to={CLIENT_ROUTE_ACCOUNT_SETTINGS_CLIENT_MANAGEMENT}
                  />
                );
              default:
                return <UnauthorizedUser />;
            }
          }}
        />
      </Switch>
    </Router>
  );
};

export default AppRoutes;
