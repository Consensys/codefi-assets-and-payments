import { hasPermissions } from 'common/permissions/Can';
import rules from 'common/permissions/rules';
import { API_FETCH_LINKS, API_FETCH_USERS } from 'constants/apiRoutes';
import { useSelector, useDispatch } from 'react-redux';
import { spacing } from 'constants/styles';
import PrivateRoute from 'PrivateRoute';
import React, { useCallback, useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import commonRoutes, { rejectedUserRoutes } from 'routes/common/commonRoutes';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import kycReviewRoutes from 'routes/kyc/kycReviewRoutes';
import kycSubmitRoutes from 'routes/kyc/kycSubmitRoutes';
import {
  CLIENT_ROUTE_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_INVESTMENT_PRODUCTS,
  CLIENT_ROUTE_INVESTOR_PORTFOLIO,
  CLIENT_ROUTE_KYC_REJECTED,
  CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE,
} from 'routesList';
import Button from 'uiComponents/Button';
import Layout from 'uiComponents/Layout';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import UndrawOnboarding from 'uiComponents/UndrawOnboarding';
import { EntityType, ILink, IUser, LinkStatus, UserType } from 'User';
import { hasFeature } from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import {
  setUserSpace,
  userSelector,
  userSpaceSelector,
} from 'features/user/user.store';

const SpaceSelection = () => {
  const dispatch = useDispatch();
  const currentSpace = useSelector(userSpaceSelector) as IWorkflowInstance;
  const user = useSelector(userSelector) as IUser;
  const role = user?.userType;
  const [loading, setLoading] = useState(true);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [spaces, setSpaces] = useState<Array<IWorkflowInstance>>([]);
  const [selectedSpace, setSelectedSpace] = useState<IWorkflowInstance>();
  const [routes, setRoutes] = useState<Array<any>>([]);

  const handleSpace = (space: IWorkflowInstance) => {
    if (space.state === LinkStatus.REJECTED) {
      setRoutes(rejectedUserRoutes);
    } else if (
      space.state === LinkStatus.INVITED ||
      space.state === LinkStatus.KYCSUBMITTED
    ) {
      setRoutes(kycSubmitRoutes(role));
    } else if (space.state === LinkStatus.VALIDATED) {
      if (
        role === UserType.INVESTOR ||
        role === UserType.UNDERWRITER ||
        role === UserType.VERIFIER
      ) {
        setRoutes(
          [...kycReviewRoutes, ...commonRoutes].filter(
            ({ action }) => !action || hasPermissions(rules[role], action),
          ),
        );
      }
    }
    dispatch(setUserSpace(space));
    setSelectedSpace(space);
  };

  const loadSpaces = useCallback(async () => {
    try {
      setLoading(true);
      let thirdPartyIssuerLink: ILink | undefined;
      // In case the user is a third party (e.g. user of type UNDERWRITE/VERIFIER/NAV_MANAGER), he can only access the platform when there is a link between himself and the ISSUER who selected him. The link can be called the thirdParty-issuer link.
      // Here we make the assumption, the user has been selected as third party by only 1 issuer. In theory, he could be selected as third party by multiple issuers, but this is not supported here.
      if (user.userType === UserType.UNDERWRITER) {
        const { users }: { users: IUser[] } = await DataCall({
          method: API_FETCH_USERS.method,
          path: API_FETCH_USERS.path(user.id, ''),
        });

        thirdPartyIssuerLink = users.find(
          (filterUser) =>
            filterUser.id === user.id &&
            filterUser.link?.entityType === EntityType.ISSUER,
        )?.link;
      }
      const { links }: { links: Array<IWorkflowInstance> } = await DataCall({
        method: API_FETCH_LINKS.method,
        path: API_FETCH_LINKS.path(user.id),
        urlParams: {
          offset: 0,
          limit: 50,
          userType: role,
          entityType: EntityType.ISSUER,
          ...(thirdPartyIssuerLink
            ? { entityId: thirdPartyIssuerLink.entityId }
            : undefined),
        },
      });

      setSpaces(links);

      if (links.length === 1) {
        const selectedSpace = links[0];
        handleSpace(selectedSpace);
      } else {
        if (currentSpace) {
          handleSpace(currentSpace);
        }
      }
    } catch (error) {
      setHasLoadingError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  if (loading) {
    return <PageLoader />;
  }

  if (hasLoadingError) {
    return <PageError />;
  }

  if (spaces.length === 0) {
    return (
      <Layout>
        <UndrawOnboarding />
      </Layout>
    );
  }

  if (selectedSpace) {
    const filtedRoutes = routes.filter(hasFeature);

    return (
      <Switch>
        {filtedRoutes.map(({ path, component, exact, navigation }, index) => (
          <PrivateRoute
            key={`space-route-${index}`}
            exact={exact}
            path={path}
            component={component}
            navigation={navigation}
          />
        ))}

        <Route
          render={() => {
            if (selectedSpace.state === LinkStatus.REJECTED) {
              return <Redirect to={CLIENT_ROUTE_KYC_REJECTED} />;
            } else if (
              selectedSpace.state === LinkStatus.INVITED ||
              selectedSpace.state === LinkStatus.KYCSUBMITTED
            ) {
              return (
                <Redirect
                  to={CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.pathBuilder({
                    issuerId: selectedSpace.entityId,
                  })}
                />
              );
            } else if (
              selectedSpace.state === LinkStatus.VALIDATED ||
              selectedSpace.state === LinkStatus.VERIFIER
            ) {
              if (role === UserType.INVESTOR) {
                return <Redirect to={CLIENT_ROUTE_INVESTOR_PORTFOLIO} />;
              } else if (role === UserType.UNDERWRITER) {
                return <Redirect to={CLIENT_ROUTE_INVESTMENT_PRODUCTS} />;
              } else if (role === UserType.VERIFIER) {
                return <Redirect to={CLIENT_ROUTE_CLIENT_MANAGEMENT} />;
              }
            }
          }}
        />
      </Switch>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          padding: spacing.regular,
        }}
      >
        {spaces.map((space) => {
          const issuerMetadata = space?.metadata?.issuer;
          return (
            <Button
              key={space.entityId}
              label={`${issuerMetadata?.firstName} ${issuerMetadata?.lastName}`}
              tertiary
              onClick={() => handleSpace(space)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SpaceSelection;
