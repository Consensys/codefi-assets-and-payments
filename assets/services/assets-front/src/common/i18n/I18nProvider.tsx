import React, { ReactElement, useEffect, useState, createContext } from 'react';
import { IntlProvider } from 'react-intl';
import { getConfig } from 'utils/configUtils';
import PageLoader from '../../uiComponents/PageLoader';

const getPreferences = (key: string) => {
  try {
    const item = localStorage.getItem('preferences');
    const preferences = item ? JSON.parse(item) : {};
    return preferences[key];
  } catch (e) {
    console.error(`failed to get ${key} preference`, e);
  }
};

export const PREFERENCES_LANGUAGE = 'language';
export const PREFERENCES_REGION = 'region';

export const setPreferences = (key: string, value: string) => {
  try {
    const item = localStorage.getItem('preferences');
    const preferences = item ? JSON.parse(item) : {};
    localStorage.setItem(
      'preferences',
      JSON.stringify({
        ...preferences,
        [key]: value,
      }),
    );
  } catch (e) {
    console.error(`failed to set ${key} preference`, e);
  }
};

export const LocaleContext = createContext<{
  language: string;
  region: string;
  toggleLanguage: any;
  toggleRegion: any;
  formatNumber: (num: bigint | number, customRegion?: string) => string;
  formatDate: (date: Date, customRegion?: string) => string;
  formatTime: (date: Date, customRegion?: string) => string;
}>({
  language: 'en',
  region: '',
  toggleLanguage: () => null,
  toggleRegion: () => null,
  formatNumber: () => '',
  formatDate: () => '',
  formatTime: () => '',
});

export const I18NProvider = ({
  children,
}: {
  children: ReactElement;
}): ReactElement => {
  const [defaultLanguage, defaultRegion] = navigator.language.split(/[-_]/);

  const [messages, setMessages] = useState();
  const [language, setLanguage] = useState(
    getPreferences(PREFERENCES_LANGUAGE) || defaultLanguage,
  );
  const [region, setRegion] = useState(
    getPreferences(PREFERENCES_REGION) || defaultRegion,
  );

  const toggleLanguage = (language: string) => {
    setPreferences(PREFERENCES_LANGUAGE, language);
    setLanguage(language);
  };

  const toggleRegion = (region: string) => {
    setPreferences(PREFERENCES_REGION, region);
    setRegion(region);
  };

  const formatNumber = (num: number | bigint, customRegion?: string) => {
    return Intl.NumberFormat(customRegion || region).format(num);
  };

  const formatDate = (date: Date, customRegion?: string) => {
    return Intl.DateTimeFormat(customRegion || region, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date, customRegion?: string) => {
    return Intl.DateTimeFormat(customRegion || region, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    async function fetchMessages() {
      const config = getConfig();
      const lang = (language || '').split('-')[0];
      try {
        const request = await fetch(`/api/i18n/keys?locale=${lang}`);
        const messages = await request.json();

        if (config.usecase) {
          const usecase = await fetch(
            `/api/assets/v2/utils/usecase/${config.usecase}`,
          );
          const usecaseKeys = await usecase.json();
          setMessages({ ...messages, ...usecaseKeys.keys });
        } else {
          setMessages(messages);
        }
      } catch (e) {
        console.error(`failed to fetch ${lang}`);
        const request = await fetch(`/api/i18n/keys?locale=en`);
        const messages = await request.json();
        setMessages(messages);
      }
    }
    // const mockedKeys = require('../../mocked-keys.json');
    // setMessages(mockedKeys);
    fetchMessages();
  }, [language]);
  if (!messages) {
    return <PageLoader />;
  }
  return (
    <LocaleContext.Provider
      value={{
        language,
        region,
        toggleLanguage,
        toggleRegion,
        formatNumber,
        formatDate,
        formatTime,
      }}
    >
      <IntlProvider locale={language} messages={messages}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
};
