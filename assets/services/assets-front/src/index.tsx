import React from 'react';
import { render } from 'react-dom';
import { init as initApm } from '@elastic/apm-rum';

import { App } from 'App';

import packageJson from '../package.json';
import { I18NProvider } from './common/i18n/I18nProvider';

// Set up Elastic APM
if (process.env.REACT_APP_ENABLE_APM === 'true') {
  try {
    initApm({
      serviceName: 'assets-front',
      serverUrl: process.env.REACT_APP_ELASTIC_APM_SERVER_URL,
      serviceVersion: packageJson.version,
    });
  } catch (e) {
    console.error(e);
  }
}

render(
  <React.StrictMode>
    <I18NProvider>
      <App />
    </I18NProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
