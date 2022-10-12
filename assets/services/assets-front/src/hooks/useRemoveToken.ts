import { mdiAlertOctagon } from '@mdi/js';
import { API_DELETE_ASSET } from 'constants/apiRoutes';
import { tokenKeys } from 'constants/queryKeys';
import { colors } from 'constants/styles';
import { useIntl } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { DataCall } from 'utils/dataLayer';
import { EventEmitter, Events } from 'features/events/EventEmitter';

function useRemoveToken(key: ReturnType<typeof tokenKeys['funds']>) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const remove = async (token: IToken) => {
    try {
      await DataCall({
        method: API_DELETE_ASSET.method,
        path: API_DELETE_ASSET.path(token.id),
      });
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(assetCardMessages.removeAssetError),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
      throw error;
    }
  };
  const { mutate } = useMutation<unknown, unknown, IToken>(remove, {
    onMutate: async (token) => {
      await queryClient.cancelQueries(key);
      const previousTokens = queryClient.getQueryData(key);
      queryClient.setQueryData<{ tokens: IToken[]; total: number } | undefined>(
        key,
        (old) => {
          if (old) {
            return {
              ...old,
              tokens: old.tokens.filter((t) => t.id !== token.id),
            };
          }
          return old;
        },
      );
      return previousTokens;
    },
    onError: (err, newToken, context) => {
      queryClient.setQueryData(key, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries(key);
    },
  });
  return mutate;
}

export default useRemoveToken;
