import React, { useState } from 'react';
import './FundPrimaryMarketStyles.scss';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import {
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { useParams } from 'react-router-dom';
import {
  IToken,
  IWorkflowInstance,
  AssetType,
  PrimaryTradeType,
} from '../AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';
import {
  API_BATCH_SETTLE_PRIMARY_ORDER,
  API_EXECUTE_PRIMARY_TRADE_ORDER,
  API_LIST_ALL_ACTIONS,
  API_REJECT_PRIMARY_TRADE_ORDER,
} from 'constants/apiRoutes';
import { IUser } from 'User';
import Button from 'uiComponents/Button';

import {
  formatDate,
  formatNumber,
  getActionOperationSign,
  getActionTypeLabel,
  getClientName,
  getFundOverviewTabs,
  getNextTransactionStatus,
  getProductFromToken,
  getTokenCurrency,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
  OVERVIEW_TABS,
} from 'utils/commonUtils';
import { useIntl } from 'react-intl';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { fundOverviewTexts } from 'texts/routes/issuer/funds';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { isTradeOrder } from 'constants/order';
import { currencyFormat } from 'utils/currencyFormat';
import moment from 'moment';
import { fundPrimaryMarketTexts } from 'texts/routes/issuer/fundPrimaryMarket';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { colors } from 'constants/styles';
import { mdiAlertOctagon, mdiInformation } from '@mdi/js';
import { SubscriptionTexts } from 'texts/routes/investor/Subscription';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import Icon from 'uiComponents/Icon';
import { TableFetchDataType, tableFilterOptions } from 'uiComponents/Table';
import { CommonTexts } from 'texts/commun/commonTexts';
import { Link } from 'react-router-dom';
import { WorkflowStates } from 'texts/routes/common/workflow';
import { useDispatch } from 'react-redux';
import { combineDateAndTime } from '../AssetIssuance/assetTypes';
import {
  QueryFunctionContext,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { tokenKeys } from 'constants/queryKeys';
import useToken from 'hooks/useToken';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface TableDataRow {
  status: string;
  statusStyle: React.CSSProperties;
  investor: string;
  type: string;
  quantity: string;
  amount: string;
  orderDate: string;
  orderId: string;
}

export const FundPrimaryMarket: React.FC = () => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const params = useParams<{ assetId: string }>();
  const queryClient = useQueryClient();
  const [state, setState] = useState({
    hasLoadingError: false,
    offset: 0,
    total: 0,
    limit: 10,
    statusFilter: '',
    isAfterSettlementDate: false,
  });

  const { token, tokenLoading } = useToken({
    id: params.assetId,
    withBalances: true,
  });

  const loadData = async ({
    queryKey: [{ token, limit, offset, filter }],
  }: QueryFunctionContext<ReturnType<typeof tokenKeys['primaryMarket']>>) => {
    try {
      const { actions }: { actions: Array<IWorkflowInstance>; total: number } =
        await DataCall({
          method: API_LIST_ALL_ACTIONS.method,
          path: API_LIST_ALL_ACTIONS.path(),
          urlParams: {
            tokenId: token.id,
            offset,
            limit,
            states: filter,
          },
        });

      const { shareClasses, assetType } = getProductFromToken(token);

      const isSecondary = assetType === AssetType.PHYSICAL_ASSET;

      const initialSubscription = shareClasses[0].initialSubscription;

      const isAfterSettlementDate = initialSubscription
        ? new Date(Date.now()) >
          new Date(
            combineDateAndTime(
              initialSubscription.settlementDate,
              initialSubscription.settlementHour,
            ) || '',
          )
        : true;

      let totalQuantity = 0;
      let totalAmount = 0;

      const tableData = actions
        .filter(
          (action) => action.data.tradeType === PrimaryTradeType.SUBSCRIPTION,
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((transaction) => {
          const matchInvestor = token.notaries?.find(
            (user: IUser) => user.id === transaction.userId,
          );

          const quantity = transaction.quantity;
          const amount = transaction.price;

          totalQuantity = totalQuantity + quantity;
          totalAmount = totalAmount + amount;

          return {
            investor: matchInvestor ? getClientName(matchInvestor) : '-',

            status: getWorkflowInstanceStatus(
              intl,
              transaction,
              isSecondary,
              assetType,
            ),
            statusStyle: getWorkflowInstanceStatusStyle(
              transaction,
              isSecondary,
            ),
            type: getActionTypeLabel(
              intl,
              transaction,
              isSecondary && !isTradeOrder(transaction.name),
            ),
            quantity: `${getActionOperationSign(
              transaction,
              quantity,
            )}${formatNumber(quantity > 0 ? quantity : -1 * quantity)}`,
            amount: `${getActionOperationSign(
              transaction,
              amount,
            )}${currencyFormat(
              amount > 0 ? amount : -1 * amount,
              getTokenCurrency(token),
            )}`,
            orderId: `${transaction.id}`,
            orderDate: formatDate(new Date(transaction.date)),
            cycleId: `${transaction.objectId}`,
            viewLink: CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${transaction.id}`,
            }),
          };
        });
      return {
        isLoading: false,
        rowsUpdating: [],
        initialSubscription,
        data: tableData,
        shareClasses,
        amountInvested: { price: totalAmount, quantity: totalQuantity },
        total: tableData.length,
        isAfterSettlementDate,
        actions,
      };
    } catch (error) {
      throw error;
    }
  };

  const { data, isLoading, isError, isFetching, isPreviousData, refetch } =
    useQuery(
      tokenKeys.primaryMarket(
        token as IToken,
        state.limit,
        state.offset,
        state.statusFilter,
      ),
      loadData,
      {
        enabled: token !== undefined,
        keepPreviousData: true,
        onSuccess: (data) => {
          checkPendingTokenActions(data?.actions || []);
        },
      },
    );

  const checkPendingTokenActions = (actions: Array<IWorkflowInstance>) => {
    const isPending = hasPendingTokenAction(actions || []);
    if (isPending) {
      queryClient.invalidateQueries(
        tokenKeys.investors(params.assetId, limit, offset),
      );
    }
  };

  const hasPendingTokenAction = (
    tokenActions: Array<IWorkflowInstance>,
  ): boolean => {
    let isPending = false;
    for (const tokenAction of tokenActions) {
      if (isPendingTokenAction(tokenAction)) {
        isPending = true;
        break;
      }
    }
    return isPending;
  };

  const isPendingTokenAction = (tokenAction: IWorkflowInstance): boolean => {
    const nextTransactioStatus = getNextTransactionStatus(tokenAction.data);

    return nextTransactioStatus === 'pending';
  };

  const addQuantity = (accumulator: number, a: any) => {
    return accumulator + parseInt(a.quantity);
  };

  const setProcessingStatus = (
    selectedOrders: Array<TableDataRow>,
    orders: Array<TableDataRow>,
    state: string,
  ) => {
    const orderIds = selectedOrders.map((order: TableDataRow) =>
      parseInt(order.orderId),
    );
    orders.forEach((element) => {
      if (orderIds.includes(parseInt(element.orderId))) {
        element.status = state;
        element.statusStyle.background = '#F0F8FF';
        element.statusStyle.color = '#1A5AFE';
        element.statusStyle.border = `0.5px solid #1A5AFE`;
      }
    });
    setState((s) => ({ ...s, data: orders }));
  };

  const { hasLoadingError, total, limit, offset, isAfterSettlementDate } =
    state;

  if (isLoading || tokenLoading) {
    return <PageLoader />;
  }

  if (isError || !data || !token || hasLoadingError) {
    return <PageError />;
  }

  return (
    <div className="_route_issuer_fundPrimaryMarket">
      <PageTitle
        title={token.name}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabNavigation={getFundOverviewTabs(
          params.assetId,
          data.shareClasses.length > 1,
          token.assetData?.type as string,
          intl,
          OVERVIEW_TABS.PRIMARY_MARKET,
        )}
      />
      <main>
        <div className="keyInfoCutOff">
          <div className="keyInfo">
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(fundPrimaryMarketTexts.orderType)}
              </div>
              <div className="infoValue">
                {intl.formatMessage(fundPrimaryMarketTexts.subscription)}
              </div>
            </div>
            {data.shareClasses[0].initialSubscription && (
              <div className="infoBox">
                <div className="infoTitle">
                  {intl.formatMessage(
                    fundPrimaryMarketTexts.subscriptionCutOff,
                  )}
                </div>
                <div className="infoValue">
                  {moment(
                    combineDateAndTime(
                      data.shareClasses[0].initialSubscription.cutoffDate,
                      data.shareClasses[0].initialSubscription.cutoffHour,
                    ),
                  ).format('YYYY-MM-DD hh:mm')}{' '}
                  {
                    new Date(
                      combineDateAndTime(
                        data.shareClasses[0].initialSubscription.cutoffDate,
                        data.shareClasses[0].initialSubscription.cutoffHour,
                      ) || '',
                    )
                      .toLocaleTimeString('en-us', {
                        timeZoneName: 'short',
                      })
                      .split(' ')[2]
                  }
                </div>
              </div>
            )}
            {data.shareClasses[0].initialSubscription && (
              <div className="infoBox">
                <div className="infoTitle">
                  {intl.formatMessage(
                    fundPrimaryMarketTexts.subscriptionIssuance,
                  )}
                </div>
                <div className="infoValue">
                  {moment(
                    combineDateAndTime(
                      data.shareClasses[0].initialSubscription.valuationDate,
                      data.shareClasses[0].initialSubscription.valuationHour,
                    ),
                  ).format('YYYY-MM-DD hh:mm')}{' '}
                  {
                    new Date(
                      combineDateAndTime(
                        data.shareClasses[0].initialSubscription.valuationDate,
                        data.shareClasses[0].initialSubscription.valuationHour,
                      ) || '',
                    )
                      .toLocaleTimeString('en-us', {
                        timeZoneName: 'short',
                      })
                      .split(' ')[2]
                  }
                </div>
              </div>
            )}
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(fundPrimaryMarketTexts.orders)}
              </div>
              <div className="infoValue">{total}</div>
            </div>
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(fundPrimaryMarketTexts.totalAmount)}
              </div>
              <div className="infoValue">
                {currencyFormat(
                  data.amountInvested.price,
                  getTokenCurrency(token),
                )}
              </div>
            </div>
            <div className="infoBox">
              <div className="infoTitle">
                {intl.formatMessage(fundPrimaryMarketTexts.totalQuantity)}
              </div>
              <div className="infoValue">{data.amountInvested.quantity}</div>
            </div>
          </div>
        </div>
        <TablePaginated
          tableSettingsId="primaryMarket"
          isLoading={isFetching && isPreviousData}
          defaultColumnsHidden={[]}
          selectable={true}
          data={data.data}
          serverSidePagination={{
            totalRows: total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          fetchData={(data: TableFetchDataType) => {
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
              offset: data.pageSize * data.pageIndex,
              limit: data.pageSize,
              statusFilter: newFilters.stattus ?? '',
            }));
          }}
          SelectedItemsActions={({ selectedItems }) => {
            const toConfirm = selectedItems.filter(
              (el) => el.status === 'Outstanding',
            );
            const toSettle = selectedItems.filter(
              (el) => el.status === 'Paid' || el.status === 'Outstanding',
            );
            return (
              <>
                {toConfirm.length > 0 && !isAfterSettlementDate && (
                  <Button
                    label={intl.formatMessage(
                      fundPrimaryMarketTexts.confirmPayment,
                    )}
                    type="submit"
                    onClick={async () => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              fundPrimaryMarketTexts.confirmPayment,
                            ),
                            confirmAction: async () => {
                              try {
                                setProcessingStatus(
                                  toConfirm,
                                  data.data,
                                  intl.formatMessage(WorkflowStates.processing),
                                );

                                const orders = toConfirm.map(async (order) =>
                                  DataCall({
                                    method:
                                      API_EXECUTE_PRIMARY_TRADE_ORDER.method,
                                    path: API_EXECUTE_PRIMARY_TRADE_ORDER.path(),
                                    body: {
                                      orderId: order.orderId,
                                      sendNotification: true,
                                    },
                                  }),
                                );

                                await Promise.allSettled(orders);
                                await refetch();
                              } catch (error) {
                                setState((s) => ({
                                  ...s,
                                  hasLoadingError: true,
                                }));
                                EventEmitter.dispatch(
                                  Events.EVENT_APP_MESSAGE,
                                  appMessageData({
                                    message: intl.formatMessage(
                                      SubscriptionTexts.rejectOrderError,
                                    ),
                                    secondaryMessage: String(error),
                                    icon: mdiAlertOctagon,
                                    color: colors.error,
                                    isDark: true,
                                  }),
                                );
                              }
                            },
                            confirmLabel: intl.formatMessage(
                              fundPrimaryMarketTexts.confirmPayment,
                            ),
                            confirmColor: colors.main,
                            content: (
                              <>
                                <div>
                                  {intl.formatMessage(
                                    fundPrimaryMarketTexts.confirmPaymentConfirmation,
                                    {
                                      length: toConfirm.length,
                                      amount: toConfirm.reduce(addQuantity, 0),
                                    },
                                  )}
                                </div>
                              </>
                            ),
                          }),
                        ),
                      );
                    }}
                    style={{ height: '32px', marginRight: '8px' }}
                  />
                )}
                {isAfterSettlementDate && (
                  <Button
                    label={intl.formatMessage(
                      fundPrimaryMarketTexts.settleOrders,
                    )}
                    type="submit"
                    style={{ height: '32px', marginRight: '8px' }}
                    onClick={async () => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              fundPrimaryMarketTexts.settleOrders,
                            ),
                            confirmAction: async () => {
                              try {
                                setProcessingStatus(
                                  toSettle,
                                  data.data,
                                  intl.formatMessage(WorkflowStates.settling),
                                );
                                const orderIds = toSettle.map((order) =>
                                  parseInt(order.orderId),
                                );
                                await DataCall({
                                  method: API_BATCH_SETTLE_PRIMARY_ORDER.method,
                                  path: API_BATCH_SETTLE_PRIMARY_ORDER.path(),
                                  body: {
                                    cycleId: toSettle[0].cycleId,
                                    orderIds,
                                    states: ['paid', 'subscribed'],
                                    limit: toSettle.length,
                                    sendNotification: true,
                                  },
                                });
                                await refetch();
                              } catch (error) {
                                setState((s) => ({
                                  ...s,
                                  hasLoadingError: true,
                                }));
                                EventEmitter.dispatch(
                                  Events.EVENT_APP_MESSAGE,
                                  appMessageData({
                                    message: intl.formatMessage(
                                      SubscriptionTexts.rejectOrderError,
                                    ),
                                    secondaryMessage: String(error),
                                    icon: mdiAlertOctagon,
                                    color: colors.error,
                                    isDark: true,
                                  }),
                                );
                              }
                            },
                            confirmLabel: intl.formatMessage(
                              fundPrimaryMarketTexts.settleOrders,
                            ),
                            confirmColor: colors.main,
                            content: (
                              <>
                                <div className="dialogMessage">
                                  <Icon icon={mdiInformation} color="#4D79FF" />
                                  <span>
                                    {intl.formatMessage(
                                      fundPrimaryMarketTexts.settleOrdersMessage,
                                    )}
                                  </span>
                                </div>
                                <div>
                                  {intl.formatMessage(
                                    fundPrimaryMarketTexts.settleOrdersConfirmation,
                                    {
                                      length: toSettle.length,
                                      amount: toSettle.reduce(addQuantity, 0),
                                    },
                                  )}
                                </div>
                              </>
                            ),
                          }),
                        ),
                      );
                    }}
                  />
                )}
                {
                  <Button
                    label={intl.formatMessage(
                      fundPrimaryMarketTexts.cancelOrders,
                    )}
                    secondary
                    style={{ height: '32px' }}
                    color="#B20000"
                    textColor="#B20000"
                    onClick={async () => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              fundPrimaryMarketTexts.cancelOrders,
                            ),
                            confirmAction: async () => {
                              try {
                                setProcessingStatus(
                                  selectedItems,
                                  data.data,
                                  intl.formatMessage(WorkflowStates.processing),
                                );

                                const orders = selectedItems.map((order) =>
                                  DataCall({
                                    method:
                                      API_REJECT_PRIMARY_TRADE_ORDER.method,
                                    path: API_REJECT_PRIMARY_TRADE_ORDER.path(),
                                    body: {
                                      orderId: order.orderId,
                                      sendNotification: true,
                                    },
                                  }),
                                );

                                await Promise.allSettled(orders);
                                await refetch();
                              } catch (error) {
                                setState((s) => ({
                                  ...s,
                                  hasLoadingError: true,
                                }));
                                EventEmitter.dispatch(
                                  Events.EVENT_APP_MESSAGE,
                                  appMessageData({
                                    message: intl.formatMessage(
                                      SubscriptionTexts.rejectOrderError,
                                    ),
                                    secondaryMessage: String(error),
                                    icon: mdiAlertOctagon,
                                    color: colors.error,
                                    isDark: true,
                                  }),
                                );
                              }
                            },
                            confirmLabel: intl.formatMessage(
                              fundPrimaryMarketTexts.cancelOrders,
                            ),
                            confirmColor: colors.errorDark,
                            content: (
                              <>
                                <div>
                                  {intl.formatMessage(
                                    fundPrimaryMarketTexts.cancelOrdersConfirmation,
                                  )}
                                </div>
                              </>
                            ),
                          }),
                        ),
                      );
                    }}
                  />
                }
              </>
            );
          }}
          columns={[
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsStatus,
              ),
              accessor: 'status',
              filter: tableFilterOptions,
              filterValues: [
                {
                  title: intl.formatMessage(fundPrimaryMarketTexts.outstanding),
                  value: 'subscribed',
                },
                {
                  title: intl.formatMessage(fundPrimaryMarketTexts.paid),
                  value: 'paid',
                },
                {
                  title: intl.formatMessage(fundPrimaryMarketTexts.settled),
                  value: 'executed',
                },
                {
                  title: intl.formatMessage(fundPrimaryMarketTexts.canceled),
                  value: 'rejected',
                },
              ],
              // eslint-disable-next-line
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
                fundOverviewTexts.recentTransactionsType,
              ),
              accessor: 'type',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsInvestor,
              ),
              accessor: 'investor',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsAmount,
              ),
              accessor: 'amount',
              disableSortBy: true,
              width: 80,
            },
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsQuantity,
              ),
              accessor: 'quantity',
              disableSortBy: true,
              width: 80,
            },
            {
              Header: 'ID',
              accessor: 'orderId',
              disableSortBy: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsDate,
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
              // eslint-disable-next-line
              Cell: ({ row: { original } }: any) => {
                return (
                  <Link
                    to={original.viewLink}
                    style={{
                      color: colors.main,
                    }}
                  >
                    {intl.formatMessage(CommonTexts.view)}
                  </Link>
                );
              },
            },
          ]}
        />
      </main>
    </div>
  );
};
