import { API_RETRIEVE_ORDER } from 'constants/apiRoutes';
import { orderKeys } from 'constants/queryKeys';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';
import { IWorkflowInstance } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';

interface IGetOrder {
  id: string;
  withBalances?: boolean;
}

const loadOrder = async ({
  queryKey: [{ id, withBalances }],
}: QueryFunctionContext<ReturnType<typeof orderKeys['order']>>) => {
  const { order }: { order: IWorkflowInstance } = await DataCall({
    method: API_RETRIEVE_ORDER.method,
    path: API_RETRIEVE_ORDER.path(id),
    urlParams: {
      withBalances,
    },
  });
  return order;
};

export default function useOrder({ id, withBalances = false }: IGetOrder) {
  const { data, isLoading, isError } = useQuery(
    orderKeys.order(id, withBalances),
    loadOrder,
    {
      keepPreviousData: true,
    },
  );

  return { order: data, orderLoading: isLoading, orderError: isError };
}
