import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import mainAppStore from 'features/app.store';

interface IProps {
  children: ReactElement | ReactElement[];
}

export const StoreProvider: React.FC<IProps> = ({ children }: IProps) => {
  return <Provider store={mainAppStore}>{children}</Provider>;
};
