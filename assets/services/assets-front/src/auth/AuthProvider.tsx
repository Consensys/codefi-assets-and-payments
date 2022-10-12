import React, { ReactElement, useEffect, useState, useContext } from 'react';
import { Auth0Provider } from 'auth/auth0';
import { TenantKeys } from 'constants/tenantKeys';
import { IConfig } from 'routes/Issuer/AssetIssuance/templatesTypes';
import PageLoader from 'uiComponents/PageLoader';
import { getConfigs, isLocalHost } from 'utils/configs';
import { applyConfig, applyTenantClientData } from 'utils/configUtils';
import history from 'utils/history';
import { LocaleContext } from 'common/i18n/I18nProvider';
import { RedirectLoginResult } from '@auth0/auth0-spa-js';
import { DataCall } from 'utils/dataLayer';
import { API_RETRIEVE_CONFIG } from 'constants/apiRoutes';

export const AuthProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const locale = useContext(LocaleContext);
  const [credentials, setCredentials] = useState<{
    domain: string;
    clientId: string;
    audience: string;
  }>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { hostname, port } = window.location;
        let requestUrl;
        if (isLocalHost(hostname)) {
          requestUrl = `/api/assets/v2/utils/tenant/${
            getConfigs().auth.clientId
          }`;
        } else {
          requestUrl = `/api/assets/v2/utils/tenant/${hostname}${
            port ? `:${port}` : ''
          }`;
        }
        const request = await fetch(requestUrl);
        const { clientApplications, config } = await request.json();
        if (!isAuthenticated) {
          locale.toggleRegion(config.region);
          locale.toggleLanguage(config.language);
        } else {
          try {
            const { config }: { config: IConfig } = await DataCall({
              method: API_RETRIEVE_CONFIG.method,
              path: API_RETRIEVE_CONFIG.path(),
              urlParams: {
                userConfiguration: true,
              },
            });
            locale.toggleRegion(config.region);
            locale.toggleLanguage(config.language);
          } catch (e) {
            console.log('failed to load user config', e);
          }
        }
        applyConfig(config);

        const tenant = clientApplications?.[0];
        applyTenantClientData(tenant[TenantKeys.CLIENT_METADATA]);

        setCredentials({
          clientId: tenant.clientId,
          domain: getConfigs().auth.domain,
          audience: getConfigs().auth.audience,
        });
      } catch (e) {
        console.log('fallback to default auth app', getConfigs().auth);
        setCredentials({
          clientId: getConfigs().auth.clientId,
          domain: getConfigs().auth.domain,
          audience: getConfigs().auth.audience,
        });
      }
    };
    loadConfig();
  }, [locale, isAuthenticated]);

  const onAuthRedirectCallback = (redirectResult?: RedirectLoginResult) => {
    // Clears auth0 query string parameters from url
    const targetUrl =
      redirectResult && redirectResult && redirectResult.appState.targetUrl
        ? redirectResult.appState.targetUrl
        : window.location.pathname;
    history.push(targetUrl);
  };

  const onAuthenticatedCallback = (isAuthenticatedResult: boolean) => {
    setIsAuthenticated((prevState: boolean) => {
      if (prevState === isAuthenticatedResult) {
        return prevState;
      }
      return isAuthenticatedResult;
    });
  };

  if (!credentials) {
    return <PageLoader />;
  }

  const { domain, clientId, audience } = credentials;

  return (
    <Auth0Provider
      domain={domain}
      client_id={clientId}
      redirect_uri={window.location.origin}
      onRedirectCallback={onAuthRedirectCallback}
      onAuthenticatedCallback={onAuthenticatedCallback}
      audience={audience}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
