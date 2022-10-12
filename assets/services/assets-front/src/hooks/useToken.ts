import { API_RETRIEVE_ASSET_BY_ID } from 'constants/apiRoutes';
import { tokenKeys } from 'constants/queryKeys';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';

interface IGetToken {
  id: string;
  withBalances?: boolean;
  withCycles?: boolean;
  withAssetData?: boolean;
}

const loadToken = async ({
  queryKey: [{ id, withAssetData, withBalances, withCycles }],
}: QueryFunctionContext<ReturnType<typeof tokenKeys['token']>>) => {
  const { token }: { token: IToken } = await DataCall({
    method: API_RETRIEVE_ASSET_BY_ID.method,
    path: API_RETRIEVE_ASSET_BY_ID.path(id),
    urlParams: {
      withBalances,
      withAssetData,
      withCycles,
    },
  });
  return token;
};

export default function useToken({
  id,
  withAssetData = false,
  withBalances = false,
  withCycles = false,
}: IGetToken) {
  const { data, isLoading, isError } = useQuery(
    tokenKeys.token(id, withBalances, withCycles, withAssetData),
    loadToken,
    {
      keepPreviousData: true,
    },
  );

  return { token: data, tokenLoading: isLoading, tokenError: isError };
}
