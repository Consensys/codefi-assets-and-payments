// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createProxyMiddleware } = require('http-proxy-middleware');

const isLocalHost = (host) => {
  if (
    host &&
    (host.includes('localhost') ||
      host.includes('assets-api') ||
      host.includes('127.0.0.1'))
  ) {
    return true;
  }

  return false;
};

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api/assets', {
      pathRewrite: { '^/api/assets': '' },
      target: process.env.REACT_APP_APP_URL,
      secure: true,
      changeOrigin: true,
      logLevel: 'debug',
    }),
  );

  app.use(
    createProxyMiddleware('/api/digital-currency', {
      pathRewrite: { '^/api/digital-currency': '' },
      target: isLocalHost(process.env.REACT_APP_CBDC_URL)
        ? process.env.REACT_APP_CBDC_URL
        : process.env.REACT_APP_CBDC_URL + '/api/digital-currency/',
      secure: true,
      changeOrigin: true,
      logLevel: 'debug',
    }),
  );

  app.use(
    createProxyMiddleware('/api/i18n', {
      pathRewrite: { '^/api/i18n': '' },
      target: process.env.REACT_APP_I18N_URL,
      secure: true,
      changeOrigin: true,
      logLevel: 'debug',
    }),
  );
};
