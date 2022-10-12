import React, {
  createContext,
  useContext,
  useState,
  ReactElement,
} from 'react';
import { getConfig } from 'utils/configUtils';

export const AccountSettingsProviderContext = createContext({});

export interface IAccountSettingsProps {
  theme: any;
  setTheme: () => Record<string, unknown>;
}

const config = getConfig();
// initital state
const initState = {
  theme: {
    isLoading: false,
    hasLoadingError: false,
    name: config.name,
    largeLogoBase64: config.logo,
    smallLogoBase64: config.LOGO_WITHOUT_LABEL,
    faviconBase64: config.FAVICON,
    colorMain: config.mainColor,
    colorSidebarText: config.SIDEBAR_TEXT,
    colorSidebarTextHover: config.SIDEBAR_TEXT_HOVER,
    colorSidebarBackground: config.SIDEBAR_BACKGROUND,
    colorSidebarBackgroundHover: config.SIDEBAR_BACKGROUND_HOVER,
  },
  // here you can define rest or props need to be managed by the provider
};

const AccountSettingsProvider = ({ children }: { children: ReactElement }) => {
  const [theme, setTheme] = useState(initState.theme);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AccountSettingsProviderContext.Provider
      value={{
        theme,
        setTheme,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AccountSettingsProviderContext.Provider>
  );
};

export const useAccountSettingsProvider = () => {
  const value = useContext(AccountSettingsProviderContext);

  return {
    ...value,
  };
};

export default AccountSettingsProvider;
