import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  ReactNode,
} from 'react';

interface ISwitchViewCotextProps {
  view: APP_VIEWS;
  changeView: (view: APP_VIEWS) => void;
  isCreator: boolean;
  isExplorer: boolean;
}

const SwitchViewContext = createContext<ISwitchViewCotextProps | null>(null);

export enum APP_VIEWS {
  CREATOR = 'creator',
  EXPLORER = 'explorer',
}

export const VIEW_SWITCH_KEY = 'codefi-app';

interface ISwitchProviderProps {
  children: ReactNode;
}

export const SwitchViewProvider = ({ children }: ISwitchProviderProps) => {
  const [currentView, setCurrentView] = useState<APP_VIEWS>(APP_VIEWS.EXPLORER);

  const changeView = (view: APP_VIEWS) => {
    localStorage.setItem(VIEW_SWITCH_KEY, view);
    setCurrentView(view);
  };
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_SWITCH_KEY) as APP_VIEWS;
    if (savedView) setCurrentView(savedView);
  }, []);

  return (
    <SwitchViewContext.Provider
      value={{
        view: currentView,
        changeView,
        isCreator: currentView === APP_VIEWS.CREATOR,
        isExplorer: currentView === APP_VIEWS.EXPLORER,
      }}
    >
      {children}
    </SwitchViewContext.Provider>
  );
};

export const useSwitchView = () =>
  useContext(SwitchViewContext) as ISwitchViewCotextProps;
