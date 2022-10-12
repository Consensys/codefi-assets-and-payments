import { API_LIST_ALL_ACTIONS } from 'constants/apiRoutes';
import { tokenKeys } from 'constants/queryKeys';
import { useState } from 'react';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';

interface IGetActions {
  states?: string;
  functionNames?: string;
  tokenIds?: string;
  tokenId?: string;
}

const loadActions = async ({
  queryKey: [{ functionNames, limit, offset, tokenIds, tokenId, states }],
}: QueryFunctionContext<ReturnType<typeof tokenKeys['actions']>>) => {
  const {
    actions,
    total,
  }: { actions: Array<IWorkflowInstance>; total: number } = await DataCall({
    method: API_LIST_ALL_ACTIONS.method,
    path: API_LIST_ALL_ACTIONS.path(),
    urlParams: {
      offset,
      limit,
      states,
      functionNames,
      tokenId,
      tokenIds,
    },
  });
  const sortedActions = actions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return { actions: sortedActions, total };
};

export default function useActions({
  functionNames = '',
  states = '',
  tokenIds = '',
  tokenId = '',
}: IGetActions) {
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, isFetching, isPreviousData } = useQuery(
    tokenKeys.actions(offset, limit, states, functionNames, tokenIds, tokenId),
    loadActions,
    {
      keepPreviousData: true,
    },
  );

  const setPagination = (limit: number, offset: number) => {
    setLimit(limit);
    setOffset(offset);
  };

  return {
    actions: data?.actions || [],
    actionsTotal: data?.total || 0,
    actionsLoading: isLoading,
    actionsError: isError,
    setPagination,
    limit,
    offset,
    isFetching,
    isPreviousData,
  };
}
