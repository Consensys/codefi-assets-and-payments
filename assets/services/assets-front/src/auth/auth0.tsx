/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { reset, setUser as setUserStore } from 'features/user/user.store';
import createAuth0Client, {
  Auth0Client,
  IdToken,
  PopupLoginOptions,
  RedirectLoginResult,
  getIdTokenClaimsOptions,
  RedirectLoginOptions,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
  LogoutOptions,
  Auth0ClientOptions,
} from '@auth0/auth0-spa-js';

import { DataCall } from 'utils/dataLayer';
import { API_GET_USER_IDENTITY } from 'constants/apiRoutes';
import { UserType, IUser } from 'User';
import { CLIENT_ROUTE_ACTIVATE_ACCOUNT } from 'routesList';
import store from 'features/app.store';

export interface IAuth0RedirectState {
  targetUrl?: string;
}

export interface IAuth0User extends Omit<IdToken, '__raw'> {}

interface IAuth0Context {
  user?: IAuth0User;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isPopupOpen: boolean;
  loginWithPopup(o?: PopupLoginOptions): Promise<void>;
  handleRedirectCallback(): Promise<RedirectLoginResult>;
  getIdTokenClaims(o?: getIdTokenClaimsOptions): Promise<IdToken | undefined>;
  loginWithRedirect(o?: RedirectLoginOptions): Promise<void>;
  getTokenSilently(o?: GetTokenSilentlyOptions): Promise<string | undefined>;
  getTokenWithPopup(o?: GetTokenWithPopupOptions): Promise<string | undefined>;
  logout(o?: LogoutOptions): void;
}
interface IAuth0ProviderOptions {
  children: React.ReactElement;
  onRedirectCallback(result: RedirectLoginResult): void;
  onAuthenticatedCallback?(isAuthenticated: boolean): void;
}

export const Auth0Context = React.createContext<IAuth0Context | null>(null);
export const useAuth0 = () => useContext(Auth0Context)!;

// to be used off hook
let _initOptions: any, _client: Auth0Client;

export const getTokenSilently = async (...p: any) => {
  if (!_client) {
    _client = await createAuth0Client({
      ..._initOptions,
      cacheLocation: 'localstorage',
    });
  }
  return await _client.getTokenSilently(...p);
};

export const logout = async (options?: LogoutOptions) => {
  if (!_client) {
    _client = await createAuth0Client({
      ..._initOptions,
      cacheLocation: 'localstorage',
    });
  }
  cleanStorage();
  return await _client!.logout(options);
};

// end to be used off hook

const cleanStorage = () => {
  // on logout we don't want to remove *all* storage as we want some to persist i.e. Language pref
  // So we remove any individual storage here and don't use localStorage.clear()
  const { dispatch } = store;
  dispatch(reset());
  localStorage.removeItem('codefi-app');
};

export const Auth0Provider = ({
  children,
  onRedirectCallback,
  onAuthenticatedCallback,
  ...initOptions
}: IAuth0ProviderOptions & Auth0ClientOptions) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [user, setUser] = useState<IAuth0User>();
  const [auth0Client, setAuth0Client] = useState<Auth0Client>();
  const dispatch = useDispatch();

  const setUserAuthenticated = async (user?: IAuth0User) => {
    setIsAuthenticated(true);
    setUser(user);
  };

  useEffect(() => {
    const initAuth0 = async () => {
      _initOptions = initOptions;
      const auth0FromHook = await createAuth0Client({
        ...initOptions,
        cacheLocation: 'localstorage',
      });
      _client = auth0FromHook;
      setAuth0Client(auth0FromHook);

      if (window.location.search.includes('code=')) {
        let appState: any = {};
        try {
          ({ appState } = await auth0FromHook.handleRedirectCallback());
        } catch (error) {
          console.log(error);
        } finally {
          try {
            let params;
            const searchParams = (
              (appState as { [key: string]: string }).targetUrl || ''
            ).split('?');
            if (searchParams.length === 2) {
              params = new URLSearchParams(searchParams[1]);
            }
            let urlParams: { [key: string]: string } = {
              userType: UserType.ISSUER,
            };
            if (params && (params.get('firstConnectionCode') as string)) {
              appState = { appState: '/' };
              urlParams = {
                ...urlParams,
                firstConnectionCode: params.get(
                  'firstConnectionCode',
                ) as string,
              };
            }
            const { user }: { user: IUser } = await DataCall({
              method: API_GET_USER_IDENTITY.method,
              path: API_GET_USER_IDENTITY.path(),
              urlParams,
            });
            dispatch(setUserStore(user || null));
            onRedirectCallback({
              appState: !user
                ? { targetUrl: CLIENT_ROUTE_ACTIVATE_ACCOUNT }
                : appState,
            });
          } catch (error) {
            console.log(error);
            await auth0FromHook.logout({ returnTo: window.location.origin });
          }
        }
      }

      const authed = await auth0FromHook.isAuthenticated();

      if (authed) {
        const userProfile = await auth0FromHook.getUser();

        setUserAuthenticated(userProfile);
      }

      setIsInitializing(false);
    };

    initAuth0();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (onAuthenticatedCallback) {
      onAuthenticatedCallback(isAuthenticated);
    }
  }, [isAuthenticated, onAuthenticatedCallback, user]);

  const loginWithPopup = async (options?: PopupLoginOptions) => {
    setIsPopupOpen(true);

    try {
      await auth0Client!.loginWithPopup(options);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPopupOpen(false);
    }

    const userProfile = await auth0Client!.getUser();
    setUserAuthenticated(userProfile);
  };

  const handleRedirectCallback = async () => {
    setIsInitializing(true);

    const result = await auth0Client!.handleRedirectCallback();
    const userProfile = await auth0Client!.getUser();

    setIsInitializing(false);
    setUserAuthenticated(userProfile);

    return result;
  };

  const loginWithRedirect = (options?: RedirectLoginOptions) =>
    auth0Client!.loginWithRedirect(options);

  const getTokenSilently = (options?: GetTokenSilentlyOptions) =>
    auth0Client!.getTokenSilently(options);

  const logout = (options?: LogoutOptions) => {
    cleanStorage();
    return auth0Client!.logout(options);
  };

  const getIdTokenClaims = (options?: getIdTokenClaimsOptions) =>
    auth0Client!.getIdTokenClaims(options);

  const getTokenWithPopup = (options?: GetTokenWithPopupOptions) =>
    auth0Client!.getTokenWithPopup(options);

  return (
    <Auth0Context.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        isPopupOpen,
        loginWithPopup,
        loginWithRedirect,
        logout,
        getTokenSilently,
        handleRedirectCallback,
        getIdTokenClaims,
        getTokenWithPopup,
      }}
    >
      {children}
    </Auth0Context.Provider>
  );
};
