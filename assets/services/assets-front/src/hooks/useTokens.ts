import { useEffect } from 'react';
import { API_ASSET_ALL_GET } from 'constants/apiRoutes';
import {
  useQuery,
  useQueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { DataCall } from 'utils/dataLayer';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { tokenKeys } from 'constants/queryKeys';
import { EventEmitter, Events } from 'features/events/EventEmitter';

export default function useTokens(key: ReturnType<typeof tokenKeys['funds']>) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const loadData = async ({
    queryKey: [{ offset, limit, withBalances, withCycles, withSearch = '' }],
  }: QueryFunctionContext<ReturnType<typeof tokenKeys['funds']>>) => {
    try {
      const { tokens, total }: { tokens: Array<IToken>; total: number } =
        await DataCall({
          method: API_ASSET_ALL_GET.method,
          path: API_ASSET_ALL_GET.path(),
          urlParams: {
            offset,
            limit,
            withBalances,
            withCycles,
            withSearch,
          },
        });
      return { tokens, total };
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
  };

  const queryResponse = useQuery(key, loadData, {
    keepPreviousData: true,
  });
  const prefetch = async (nextOffset: number) => {
    await queryClient.prefetchQuery(
      tokenKeys.funds(
        nextOffset,
        key[0].limit,
        key[0].withBalances,
        key[0].withCycles,
        key[0].withAssetData,
      ),
      loadData,
      { staleTime: 5000 },
    );
  };
  useEffect(() => {
    if (
      queryResponse.data &&
      queryResponse.data?.total > key[0].offset + key[0].limit
    ) {
      prefetch(key[0].offset + key[0].limit);
    }
    // eslint-disable-next-line
  }, [queryResponse.data]);
  return queryResponse;
}
