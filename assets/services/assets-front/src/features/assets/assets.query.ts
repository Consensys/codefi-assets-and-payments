import { DataCall } from 'utils/dataLayer';
import { API_ASSET_INVESTORS_ALL_GET } from 'constants/apiRoutes';
import { IUser } from '../../User';

/**
 * React Query Selectors
 */

export const searchAssetInvestorsByNameOrAddressQuerySelector = async (
  assetId: string,
  nameOrAddress: string,
): Promise<{ users: IUser[] }> => {
  const { users }: { users: Array<IUser> } = await DataCall({
    method: API_ASSET_INVESTORS_ALL_GET.method,
    path: API_ASSET_INVESTORS_ALL_GET.path(assetId),
    urlParams: {
      offset: 0,
      limit: 10,
      withBalances: false,
      withCycles: false,
    },
  });

  return {
    users: users.filter((user) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(nameOrAddress.toLowerCase()),
    ), // We do the filter client-side for now as API don't support the LIKE operator yet
  };
};
