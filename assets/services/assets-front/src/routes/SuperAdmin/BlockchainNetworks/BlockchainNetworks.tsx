import { API_LIST_ALL_NETWORKS_V2 } from 'constants/apiRoutes';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { commonActionsTexts } from 'texts/commun/actions';
import { CommonTexts } from 'texts/commun/commonTexts';
import { accountSettingsMenu } from 'texts/routes/issuer/accountSettings';
import { blockchainNetworksTexts } from 'texts/routes/superAdmin/blockchainNetworks';
import { Network } from 'types/Network';
import Button from 'uiComponents/Button';
import DataTable from 'uiComponents/DataTable';
import { IDataTableData } from 'uiComponents/DataTable/DataTable';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import { DataCall } from 'utils/dataLayer';

import './BlockchainNetworks.scss';
import { Link } from 'react-router-dom';

const BlockchainNetworks: React.FC = () => {
  const [networks, setNetworks] = useState<Array<Network>>([]);
  const [defaultNetwork] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadingError, setHasLoadingError] = useState<boolean>(false);

  const intl = useIntl();

  useEffect(() => {
    const loadNetworks = async () => {
      setIsLoading(true);
      try {
        const { networks }: { networks: Network[] } = await DataCall({
          method: API_LIST_ALL_NETWORKS_V2.method,
          path: API_LIST_ALL_NETWORKS_V2.path(),
        });
        setNetworks(networks);
        // setDefaultNetwork(defaultNetwork);
      } catch (err) {
        setHasLoadingError(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadNetworks();
  }, []);

  const renderNetworkName = (network: Network) => {
    const isDefault = network.key === defaultNetwork;
    return (
      <div>
        <span>{network.name}</span>
        {isDefault && (
          <span className="default">
            {intl.formatMessage(CommonTexts.default)}
          </span>
        )}
      </div>
    );
  };

  const renderRpcUrl = (network: Network) => {
    const endpoint = network.rpcEndpoints[0];
    return (
      <Link
        to={{
          pathname: endpoint,
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {endpoint}
      </Link>
    );
  };

  const renderEdit = () => {
    return (
      <Button
        label={intl.formatMessage(commonActionsTexts.edit)}
        size="small"
        tertiary
      />
    );
  };

  const data: IDataTableData = {
    header: [
      {
        content: intl.formatMessage(blockchainNetworksTexts.networkName),
      },
      {
        content: intl.formatMessage(blockchainNetworksTexts.rpcUrl),
      },
      {
        content: '',
      },
    ],
    rows: networks.map((network: Network) => [
      {
        content: renderNetworkName(network),
      },
      {
        content: renderRpcUrl(network),
      },
      {
        content: renderEdit(),
      },
    ]),
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (hasLoadingError) {
    return <PageError />;
  }

  return (
    <div id="_route_superAdmin_blockchainNetworks_root">
      <PageTitle
        title={intl.formatMessage(accountSettingsMenu.blockchainNetworkTitle)}
        tabActions={[
          {
            label: intl.formatMessage(blockchainNetworksTexts.addNetwork),
            href: '',
          },
        ]}
        withBreadcrumbs
      />
      <main>
        <DataTable className="blockchain-table" data={data} />
      </main>
    </div>
  );
};

export default BlockchainNetworks;
