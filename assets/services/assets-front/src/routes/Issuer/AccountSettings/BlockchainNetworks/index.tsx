import React, { useState } from 'react';
import { Radio, Space, message } from 'antd';

import { IUser } from 'User';
import { DataCall } from 'utils/dataLayer';
import { API_LIST_ALL_NETWORKS } from 'constants/apiRoutes';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import {
  API_CREATE_OR_UPDATE_CONFIG,
  API_RETRIEVE_CONFIG,
} from 'constants/apiRoutes';
import { accountSettingsMenu } from 'texts/routes/issuer/accountSettings';
import { getSelectedChainId, getSelectedNetworkKey } from 'utils/configs';
import { CommonTexts } from 'texts/commun/commonTexts';
import { applyConfig } from 'utils/configUtils';
import { SettingsContainer } from '../SettingsContainer';
import { useIntl } from 'react-intl';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from 'features/user/user.store';

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  networks: Array<any>;
  defaultKYCTemplate?: string;
  defaultNetworkKey?: string;
  userRedefinedNetworkChainId?: string; // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
  userRedefinedNetworkKey?: string;
  config?: any;
}

const BlockchainNetworks: React.FC = () => {
  useEffect(() => {
    loadConfig();
    loadNetworks();
  }, []);
  const user = useSelector(userSelector) as IUser;
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    networks: [],
    defaultKYCTemplate: user.data.kycTemplateId,
    userRedefinedNetworkChainId: '',
    userRedefinedNetworkKey: '',
  });

  const intl = useIntl();

  const loadConfig = async () => {
    try {
      const { config } = await DataCall({
        method: API_RETRIEVE_CONFIG.method,
        path: API_RETRIEVE_CONFIG.path(),
      });
      setState((s) => ({
        ...s,
        config,
        userRedefinedNetworkChainId: getSelectedChainId(config), // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
        userRedefinedNetworkKey: getSelectedNetworkKey(config),
      }));
    } catch (error) {}
  };

  const loadNetworks = async () => {
    try {
      const { networks, defaultNetwork: defaultNetworkKey } = await DataCall({
        method: API_LIST_ALL_NETWORKS.method,
        path: API_LIST_ALL_NETWORKS.path(),
      });

      setState((s) => ({
        ...s,
        isLoading: false,
        networks: networks.filter((network: any) => !network.kaleido),
        defaultNetworkKey,
      }));
    } catch {
      setState((s) => ({
        ...s,
        hasLoadingError: true,
        isLoading: false,
      }));
    }
  };

  const onChange = async (selectedNetworkKey: string) => {
    try {
      const selectedNetwork = state.networks.find((network) => {
        return network?.key === selectedNetworkKey;
      });

      // save config
      setState((s) => ({
        ...s,
        userRedefinedNetworkChainId: selectedNetwork?.chainId, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
        userRedefinedNetworkKey: selectedNetwork?.key,
      }));
      const { config } = await DataCall({
        method: API_CREATE_OR_UPDATE_CONFIG.method,
        path: API_CREATE_OR_UPDATE_CONFIG.path(),
        body: {
          data: {
            ...state.config.data,
            defaultChainId: selectedNetwork?.chainId, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
            defaultNetworkKey: selectedNetwork?.key,
          },
        },
      });
      applyConfig(config);
      message.success(intl.formatMessage(CommonTexts.savedSuccessfully));
    } catch (error) {
      console.log('error', error);
    }
  };

  if (state.isLoading) {
    return (
      <div id="_route_issuer_accountSettings">
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError) {
    return (
      <div id="_route_issuer_accountSettings">
        <PageError />
      </div>
    );
  }

  return (
    <SettingsContainer
      title={intl.formatMessage(accountSettingsMenu.blockchainNetworkTitle)}
      description={intl.formatMessage(
        accountSettingsMenu.blockchainNetworkDescription,
      )}
    >
      <Radio.Group
        onChange={(e) => onChange(e.target.value)}
        value={
          !state.userRedefinedNetworkKey
            ? state.defaultNetworkKey
            : state.userRedefinedNetworkKey
        }
      >
        <Space direction="vertical">
          {state.networks.map((selectedNetwork) => (
            <Radio key={selectedNetwork?.key} value={selectedNetwork?.key}>
              {selectedNetwork?.name}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </SettingsContainer>
  );
};

export default BlockchainNetworks;
