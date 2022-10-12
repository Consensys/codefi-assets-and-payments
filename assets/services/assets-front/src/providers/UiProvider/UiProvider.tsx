import React, {
  ReactNode,
  ReactNodeArray,
  createContext,
  useState,
} from 'react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { Theme } from 'theme/Theme.types';
import { defaultTheme } from 'theme/themes/defaultTheme';
import { NotificationProvider } from '../NotificationProvider';

export interface UiProviderProps {
  children: ReactNode | ReactNodeArray;
  theme?: Theme;
  blockScoutUrl?: string;
}

export const UiContext = createContext({
  blockScoutUrl: '',
  changeTheme: (theme: Theme) => {
    console.warn('no theme');
  },
});

export function UiProvider({
  theme = defaultTheme,
  children,
  blockScoutUrl = '',
}: UiProviderProps) {
  const [currentTheme, setTheme] = useState(theme);
  const changeTheme = (theme: Theme) => {
    setTheme(theme);
  };
  return (
    <UiContext.Provider value={{ blockScoutUrl, changeTheme }}>
      <NotificationProvider>
        <StyledComponentsThemeProvider theme={currentTheme}>
          {children}
        </StyledComponentsThemeProvider>
      </NotificationProvider>
    </UiContext.Provider>
  );
}
