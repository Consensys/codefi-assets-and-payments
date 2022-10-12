import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  configure,
  fireEvent,
  render,
  RenderResult,
  screen,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '../src/features/app.store';
import { IntlProvider } from 'react-intl';
import { Router } from 'react-router-dom';
import history from 'utils/history';

const queryClient = new QueryClient();

export const id = (id: string) => screen.getByTestId(id);

// for asserting elements are not in document
export const query = (_id: string) => screen.queryByTestId(_id);

// will throw error if element doesn't exist
export const clickElement = (_id: string) => fireEvent.click(id(_id));

export const changeElementValue = (_id: string, _value: string) =>
  fireEvent.change(id(_id), {
    target: {
      value: _value,
    },
  });

export const renderTestBed = (Inject: any): RenderResult => {
  configure({
    testIdAttribute: 'data-test-id',
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale={'en'}>
          <Router history={history}>
            <Inject />
          </Router>
        </IntlProvider>
      </QueryClientProvider>
    </Provider>,
  );
};
