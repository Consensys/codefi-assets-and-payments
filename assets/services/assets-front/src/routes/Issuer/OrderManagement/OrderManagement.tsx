import './OrderManagementStyles.scss';

import { API_ASSET_ALL_GET, API_LIST_ALL_ACTIONS } from 'constants/apiRoutes';
import { AssetType, IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  IWorkflowInstance,
  WorkflowType,
} from '../AssetIssuance/templatesTypes';
import { WorkflowStates } from 'texts/routes/common/workflow';
import { TableFetchDataType, tableFilterOptions } from 'uiComponents/Table';
import { WrappedComponentProps, injectIntl } from 'react-intl';
import {
  formatDate,
  formatNumber,
  getActionOperationSign,
  getActionTypeLabel,
  getLoanDataFromToken,
  getTokenMetadata,
  getUserMetadata,
  getClientName,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';

import { CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID } from 'routesList';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import { IUser } from 'User';
import { Link } from 'react-router-dom';
import PageError from 'uiComponents/PageError';
import PageTitle from 'uiComponents/PageTitle';
import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { colors } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { getRepaymentBreakdown } from 'routes/Investor/SyndicatedLoan/RepaymentRequest/repaymentUtils';
import { isTradeOrder } from 'constants/order';
import { ordersManagementTexts } from 'texts/routes/issuer/ordersManagement';
import { useSelector } from 'react-redux';
import { userSelector } from 'features/user/user.store';
import { useCallback } from 'react';

interface TableDataRow {
  assetName: string;
  status: string;
  statusStyle: React.CSSProperties;
  investor: string;
  type: string;
  quantity: string;
  amount: string;
  orderDate: string;
  state: string;
}
interface FilterItem {
  title: string;
  value: string;
}
interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  data: Array<TableDataRow>;
  users: Array<IUser>;
  offset: number;
  total: number;
  limit: number;
  statusFilter: string;
  typeFilter: string;
  assetFilter: string;
  tokens: Array<FilterItem>;
  fetchedTokens: IToken[];
}

const OrderManagement: React.FC<
  RouteComponentProps & WrappedComponentProps
> = ({ intl, match }) => {
  const user = useSelector(userSelector) as IUser;
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    users: [],
    offset: 0,
    total: 0,
    limit: 10,
    data: [],
    statusFilter: '',
    typeFilter: '',
    assetFilter: '',
    tokens: [],
    fetchedTokens: [],
  });

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));

      const {
        actions: workflowActions,
        total,
      }: { actions: Array<IWorkflowInstance>; total: number } = await DataCall({
        method: API_LIST_ALL_ACTIONS.method,
        path: API_LIST_ALL_ACTIONS.path(),
        urlParams: {
          offset: state.offset,
          limit: state.limit,
          states: state.statusFilter,
          functionNames: state.typeFilter,
          tokenIds: state.assetFilter,
        },
      });

      const orders = workflowActions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      let fetchedTokens = state.fetchedTokens;
      const tableData = await Promise.all(
        orders.map(async (order) => {
          const {
            name: tokenName,
            assetType,
            currency: tokenCurrency,
          } = getTokenMetadata(order);
          let isSecondary =
            assetType === AssetType.PHYSICAL_ASSET && !isTradeOrder(order.name);

          let issuerName;
          let borrowerName;

          const quantity = order.quantity;
          let amount = order.price;

          if (assetType === AssetType.SYNDICATED_LOAN) {
            if (fetchedTokens.length === 0) {
              const { tokens }: { tokens: Array<IToken>; total: number } =
                await DataCall({
                  method: API_ASSET_ALL_GET.method,
                  path: API_ASSET_ALL_GET.path(),
                  urlParams: {
                    withBalances: false,
                    withCycles: false,
                  },
                });
              fetchedTokens = tokens;
            }
            isSecondary = true;

            if (isTradeOrder(order.name) || order.name === 'forceBurn') {
              const matchedToken = fetchedTokens.find(
                ({ id: tokenId }) => tokenId === order.entityId,
              );
              if (matchedToken) {
                issuerName = getClientName(matchedToken.issuer as IUser);
                borrowerName = getClientName(
                  matchedToken.assetData?.asset?.participants
                    ?.borrower as IUser,
                );
              }
            }

            if (order.data.tradeOrderType === 'Repayment') {
              const matchedToken = fetchedTokens.find(
                ({ id: tokenId }) => tokenId === order.entityId,
              );
              if (matchedToken) {
                const { facilities } = getLoanDataFromToken(matchedToken);
                amount = getRepaymentBreakdown(
                  matchedToken,
                  facilities[0],
                  order,
                ).totalRepaymentAmount;
              }
            }
          }

          const { name: userName } = getUserMetadata(
            order,
            assetType,
            issuerName,
            borrowerName,
          );

          return {
            assetName: isSecondary
              ? `${tokenName}`
              : `${tokenName} - ${order.assetClassKey}`,
            status: getWorkflowInstanceStatus(
              intl,
              order,
              isSecondary,
              assetType,
            ),
            state: order.state,
            statusStyle: getWorkflowInstanceStatusStyle(order, isSecondary),
            investor: userName,
            type: getActionTypeLabel(intl, order, isSecondary, assetType),
            quantity:
              assetType === AssetType.SYNDICATED_LOAN
                ? '-'
                : `${getActionOperationSign(order, quantity)}${formatNumber(
                    quantity > 0 ? quantity : -1 * quantity,
                  )}`,
            amount: `${getActionOperationSign(order, amount)}${currencyFormat(
              amount > 0 ? amount : -1 * amount,
              tokenCurrency,
            )}`,
            orderDate: formatDate(new Date(order.date)),
            viewLink: CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${order.id}`,
            }),
            linkVisible: order.workflowType === WorkflowType.ORDER,
          };
        }),
      );

      setState((s) => ({
        ...s,
        total,
        data: tableData,
        isLoading: false,
        hasLoadingError: false,
        fetchedTokens,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        hasLoadingError: true,
        isLoading: false,
      }));
    }
  }, [
    intl,
    state.assetFilter,
    state.fetchedTokens,
    state.limit,
    state.offset,
    state.statusFilter,
    state.typeFilter,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchData = useCallback(
    (data: TableFetchDataType) => {
      const newFilters: Record<string, string> = {};
      data.filters.forEach((el) => {
        newFilters[el.id] =
          el.value.length > 0
            ? JSON.stringify(
                el.value.reduce((acc: string[], el: string) => {
                  return [...acc, ...el.split(',')];
                }, []),
              )
            : '';
      });
      setState((s) => ({
        ...s,
        statusFilter: newFilters.status ?? '',
        offset: data.pageSize * data.pageIndex,
        limit: data.pageSize,
        typeFilter: newFilters.type ?? '',
        assetFilter: newFilters.assetName ?? '',
      }));
      loadData();
    },
    [loadData],
  );

  if (state.hasLoadingError || !user) {
    return (
      <div id="_routes_issuer_ordersManagement">
        <PageTitle title={intl.formatMessage(ordersManagementTexts.title)} />
        <PageError />
      </div>
    );
  }

  const allOrderStatuses = [
    {
      title: intl.formatMessage(WorkflowStates.created),
      value: 'subscribed',
    },
    {
      title: intl.formatMessage(WorkflowStates.outstanding),
      value: 'subscribed,outstanding',
    },
    {
      title: intl.formatMessage(WorkflowStates.canceled),
      value: 'unpaidCancelled',
    },
    {
      title: intl.formatMessage(WorkflowStates.settling),
      value: 'pending,processing,paid',
    },
    {
      title: intl.formatMessage(WorkflowStates.paid),
      value: 'paid',
    },
    {
      title: intl.formatMessage(WorkflowStates.rejected),
      value: 'paidRejected,unpaidRejected,rejected',
    },
    {
      title: intl.formatMessage(WorkflowStates.settled),
      value: 'executed',
    },
    {
      title: intl.formatMessage(WorkflowStates.submitted),
      value: 'subscribed,submitted',
    },
    {
      title: intl.formatMessage(WorkflowStates.pending),
      value: 'paying',
    },
    {
      title: intl.formatMessage(WorkflowStates.approved),
      value: 'paidSettled,approved',
    },
    {
      title: intl.formatMessage(WorkflowStates.accepted),
      value: 'accepted',
    },
    {
      title: intl.formatMessage(WorkflowStates.processing),
      value: 'pending,processing',
    },
    {
      title: intl.formatMessage(WorkflowStates.failed),
      value: 'reverted,failed',
    },
  ];

  return (
    <div id="_routes_issuer_ordersManagement">
      <PageTitle title={intl.formatMessage(ordersManagementTexts.title)} />

      <main>
        <TablePaginated
          serverSidePagination={{
            totalRows: state.total,
            pageSize: state.limit,
            currentPage: state.offset / state.limit,
          }}
          tableSettingsId="orderManagement"
          isLoading={state.isLoading}
          defaultColumnsHidden={[]}
          columns={[
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersAsset,
              ),
              accessor: 'assetName',
              disableSortBy: true,
              width: 170,
            },
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersStatus,
              ),
              accessor: 'status',
              filter: tableFilterOptions,
              filterValues: allOrderStatuses,
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) => (
                <span
                  style={{
                    padding: '2px 8px',
                    margin: '6px 16px',
                    fontSize: 12,
                    borderRadius: 4,
                    ...original.statusStyle,
                  }}
                >
                  {original.status}
                </span>
              ),
              disableSortBy: true,
              noPadding: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersInvestor,
              ),
              accessor: 'investor',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(ordersManagementTexts.listHeadersType),
              accessor: 'type',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersQuantity,
              ),
              accessor: 'quantity',
              disableSortBy: true,
              width: 80,
            },
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersAmount,
              ),
              accessor: 'amount',
              disableSortBy: true,
              width: 80,
            },
            {
              Header: intl.formatMessage(
                ordersManagementTexts.listHeadersOrderDate,
              ),
              accessor: 'orderDate',
              disableSortBy: true,
              width: 100,
            },
            {
              Header: '',
              reorderName: intl.formatMessage(CommonTexts.actions),
              disableReorder: true,
              accessor: 'actions',
              disableResizing: true,
              disableSortBy: true,
              noPadding: true,
              disableExport: true,
              Cell: ({ row: { original } }: any) => {
                if (!original.linkVisible) {
                  return '';
                }
                return (
                  <Link
                    to={original.viewLink}
                    style={{
                      color: colors.main,
                    }}
                  >
                    {intl.formatMessage(CommonTexts.viewOrder)}
                  </Link>
                );
              },
            },
          ]}
          data={state.data}
          fetchData={fetchData}
          translations={{
            emptyTitle: intl.formatMessage(ordersManagementTexts.listEmpty),
            emptyDescription: intl.formatMessage(
              ordersManagementTexts.listEmptyDesc,
            ),
          }}
        />
      </main>
    </div>
  );
};

export default injectIntl(OrderManagement);
