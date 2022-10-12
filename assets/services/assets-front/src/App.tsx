import React from 'react';
import Zendesk from 'react-zendesk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import 'antd/dist/antd.css';
import './constants.scss';
import './reset.scss';

import AppMessages from './uiComponents/AppMessages';
import AppModal from './uiComponents/AppModal';

import { getConfig } from 'utils/configUtils';
import AppRoutes from './AppRoutes';
import { Maintenance } from 'routes/Maintenance';
import { StoreProvider } from './StoreProvider';
import ErrorBoundaryProvider from 'providers/error-boundary';
import { SwitchViewProvider } from 'providers/switch-view';
import { UiProvider } from 'providers/UiProvider';
import AuthProvider from 'auth/AuthProvider';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const config = getConfig();

  if (process.env.REACT_APP_MAINTENANCE_MODE === 'true') {
    return <Maintenance />;
  }

  return (
    <ErrorBoundaryProvider>
      <StoreProvider>
        <AuthProvider>
          <>
            <UiProvider>
              <QueryClientProvider client={queryClient}>
                <SwitchViewProvider>
                  <AppRoutes />
                </SwitchViewProvider>
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </UiProvider>

            <AppModal />
            <AppMessages />
            <Zendesk
              webWidget={{
                position: { horizontal: 'right', vertical: 'top' },
              }}
              zendeskKey={
                process.env.REACT_APP_ZENDESK_KEY || config.ZENDESK_KEY
              }
            />
          </>
        </AuthProvider>
      </StoreProvider>
    </ErrorBoundaryProvider>
  );
};
