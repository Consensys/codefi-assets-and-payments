import { Network } from 'types/Network';
import { DataCall } from 'utils/dataLayer';
import { API_LIST_ALL_NETWORKS } from 'constants/apiRoutes';

export const networksListQuerySelector = async (): Promise<{
  networks: Network[];
}> => {
  const { networks } = await DataCall({
    method: API_LIST_ALL_NETWORKS.method,
    path: API_LIST_ALL_NETWORKS.path(),
  });

  return { networks };
};
