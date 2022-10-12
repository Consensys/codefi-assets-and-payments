let configs: {
  auth: {
    clientId: string;
    domain: string;
    audience: string;
  };
  appUrl: string;
};

const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env '${name}'`);
  return value;
};

export const isLocalHost = (host: string) => {
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

// notice keep the explicit value from process.env or the entrypoint.sh won't replace the value
export const getConfigs = () => {
  if (!configs) {
    configs = {
      auth: {
        clientId: requireEnv(
          'REACT_APP_AUTH_CLIENT_ID',
          process.env.REACT_APP_AUTH_CLIENT_ID,
        ),
        domain: requireEnv(
          'REACT_APP_AUTH_DOMAIN',
          process.env.REACT_APP_AUTH_DOMAIN,
        ),
        audience: requireEnv(
          'REACT_APP_AUTH_AUDIENCE',
          process.env.REACT_APP_AUTH_AUDIENCE,
        ),
      },
      appUrl: requireEnv('REACT_APP_APP_URL', process.env.REACT_APP_APP_URL),
    };
  }
  return configs;
};

export const getSelectedChainId = (config: any): string => {
  // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
  return config?.data?.defaultChainId;
};
export const getSelectedNetworkKey = (config: any): string => {
  return config?.data?.defaultNetworkKey;
};

export const getMarketplace = (config: any): boolean => {
  return config?.enableMarketplace;
};
