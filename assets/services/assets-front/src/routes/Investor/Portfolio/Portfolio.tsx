import './Portfolio.scss';

import {
  AssetType,
  IToken,
  IWorkflowInstance,
  WorkflowType,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST,
  CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST,
  CLIENT_ROUTE_INVESTOR_DIRECT_SUBSCRIPTION_ORDER,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import { IUser, IUserTokenData } from 'User';
import { IntlShape, useIntl } from 'react-intl';
import {
  formatDate,
  formatNumber,
  getActionOperationSign,
  getActionTypeLabel,
  getLoanDataFromToken,
  getProductFromToken,
  getTokenCurrency,
  getTokenShareClassCurrentNav,
  getTokenShareClassKey,
  getTokenShareClassName,
  getUserTokenBalance,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import { isTradeOrder, totalOrderAmountReceived } from 'constants/order';

import { useSelector } from 'react-redux';
import { API_ASSET_ALL_GET } from 'constants/apiRoutes';
import { Balance } from './components/Balance';
import Button from 'uiComponents/Button';
import { CommonTexts } from 'texts/commun/commonTexts';
import { DataCall } from 'utils/dataLayer';
import { Link } from 'react-router-dom';
import isNil from 'lodash/isNil';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import { PortfolioTexts } from 'texts/routes/investor/PortfolioTexts';
import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { TableFetchDataType } from 'uiComponents/Table';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { TimeSeriesLargeGraph } from 'uiComponents/TimeSeriesLargeGraph';
import { colors } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { fundInvestorAssetsTexts } from 'texts/routes/issuer/fundInvestor';
import { getRepaymentBreakdown } from '../SyndicatedLoan/RepaymentRequest/repaymentUtils';
import { userSelector } from 'features/user/user.store';

interface AssetsData {
  name: string;
  tokenBalance: string;
  percentage: string;
  token: IToken;
  assetType: string;
  currentTokenInvestorAmount: number;
  currentTokenInvestorShares: number;
}

interface RecentTransactionsData {
  assetName: string;
  status: string;
  statusStyle: React.CSSProperties;
  type: string;
  quantity: string;
  amount: string;
  orderDate: Date;
  transaction: IWorkflowInstance;
}

const buildTabActions = (intl: IntlShape, tokens: IToken[]) => {
  const actions = [];
  let hasRedemption = false;
  let hasSell = false;

  for (const token of tokens) {
    const { assetType, shareClasses } = getProductFromToken(token);
    if (assetType === AssetType.SYNDICATED_LOAN) {
      continue;
    }

    hasRedemption =
      hasRedemption ||
      !isNil(shareClasses?.[0]?.initialRedemption) ||
      assetType === AssetType.CURRENCY;
    hasSell = hasSell || assetType !== AssetType.CURRENCY;

    if (hasRedemption && hasSell) {
      break;
    }
  }

  if (hasSell) {
    actions.push({
      label: intl.formatMessage(CommonTexts.sell),
      href: CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST,
    });
  }

  if (hasRedemption) {
    actions.push({
      label: intl.formatMessage(CommonTexts.redeem),
      href: CLIENT_ROUTE_INVESTMENT_PRODUCT_REDEEM_REQUEST,
    });
  }

  actions.push({
    label: intl.formatMessage(CommonTexts.subscribe),
    href: CLIENT_ROUTE_INVESTOR_DIRECT_SUBSCRIPTION_ORDER,
  });

  return actions;
};

interface IState {
  offset: number;
  total: number;
  limit: number;
  isLoading: boolean;
  hasLoadingError: boolean;
  tokens: Array<IToken>;
  assetData: Array<AssetsData>;
  orders: Array<IWorkflowInstance>;
  recentTransactions: Array<RecentTransactionsData>;
}

export const Portfolio: React.FC<RouteComponentProps> = ({
  match,
  history,
}) => {
  /*  public state: IState = {
    isLoading: true,
    hasLoadingError: false,
    tokens: [],
    orders: [],
    assetData: [],
    offset: 0,
    total: 0,
    limit: 10,
    recentTransactions: [],
  };

  public componentDidMount = async () => {
    loadData();
  }; */
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    tokens: [],
    orders: [],
    assetData: [],
    offset: 0,
    total: 0,
    limit: 10,
    recentTransactions: [],
  });
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      const {
        tokens,
      }: {
        tokens: Array<IToken>;
      } = await DataCall({
        method: API_ASSET_ALL_GET.method,
        path: API_ASSET_ALL_GET.path(),
        urlParams: {
          offset: state.offset,
          limit: state.limit,
          withBalances: true,
        },
      });

      const totalBalance = tokens.length > 0 ? getTotalBalance(tokens) : 0;
      const assetData: Array<AssetsData> = tokens
        .map((asset) => {
          const currentTokenInvestorShares = getUserTokenBalance(asset) || 0;
          const currentTokenInvestorAmount =
            currentTokenInvestorShares * getTokenShareClassCurrentNav(asset) ||
            0;
          const { assetType } = getProductFromToken(asset);
          return {
            name: `${asset.name} - ${getTokenShareClassName(asset)}`,
            currentTokenInvestorAmount,
            currentTokenInvestorShares,
            tokenBalance: formatNumber(currentTokenInvestorShares),
            percentage:
              totalBalance > 0
                ? `${(
                    (currentTokenInvestorAmount / totalBalance) *
                    100
                  ).toFixed(0)}%`
                : '-',
            token: asset,
            assetType,
          };
        })
        .filter((assetData) => assetData.currentTokenInvestorShares !== 0);

      const recentTransactions: Array<RecentTransactionsData> = tokens
        .reduce(
          (actions: Array<IWorkflowInstance>, token: IToken) => [
            ...actions,
            ...(((token.userRelatedData as IUserTokenData)
              ?.tokenActions as Array<IWorkflowInstance>) || []),
          ],
          [],
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((transaction) => {
          const matchingToken = tokens.find(
            (token) => token.id === transaction.entityId,
          ) as IToken;

          const { assetType } = getProductFromToken(matchingToken);
          const isSecondary =
            (assetType === AssetType.PHYSICAL_ASSET &&
              !isTradeOrder(transaction.name)) ||
            assetType === AssetType.SYNDICATED_LOAN;

          const quantity =
            !isTradeOrder(transaction.name) &&
            transaction.name !== 'forceBurn' &&
            assetType === AssetType.SYNDICATED_LOAN
              ? 1
              : transaction.quantity;
          let amount = transaction.price;

          if (
            assetType === AssetType.SYNDICATED_LOAN &&
            transaction.data.tradeOrderType === 'Repayment'
          ) {
            const matchedToken = state.tokens.find(
              ({ id: tokenId }) => tokenId === transaction.entityId,
            );
            if (matchedToken) {
              const { facilities } = getLoanDataFromToken(matchedToken);
              amount = getRepaymentBreakdown(
                matchedToken,
                facilities[0],
                transaction,
              ).totalRepaymentAmount;
            }
          }

          return {
            assetName: isSecondary
              ? matchingToken.name
              : `${matchingToken.name} - ${transaction.assetClassKey}`,
            statusStyle: getWorkflowInstanceStatusStyle(
              transaction,
              isSecondary,
            ),
            status: getWorkflowInstanceStatus(
              intl,
              transaction,
              isSecondary,
              assetType,
            ),
            type: getActionTypeLabel(intl, transaction, isSecondary, assetType),
            quantity:
              assetType === AssetType.SYNDICATED_LOAN
                ? '-'
                : `${getActionOperationSign(
                    transaction,
                    quantity,
                  )}${formatNumber(quantity > 0 ? quantity : -1 * quantity)}`,
            amount: `${getActionOperationSign(
              transaction,
              amount,
            )}${currencyFormat(
              amount > 0 ? amount : -1 * amount,
              getTokenCurrency(matchingToken),
            )}`,
            orderDate: transaction.date,
            transaction,
          };
        });

      setState((s) => ({
        ...s,
        tokens,
        assetData,
        orders: tokens
          .reduce(
            (actions: Array<IWorkflowInstance>, token: IToken) => [
              ...actions,
              ...(((token.userRelatedData as IUserTokenData)
                ?.tokenActions as Array<IWorkflowInstance>) || []),
            ],
            [],
          )
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        recentTransactions,
        total: assetData.length,
        isLoading: false,
        hasLoadingError: false,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        hasLoadingError: true,
        isLoading: false,
      }));
    }
    // eslint-disable-next-line
  }, [intl, state.offset, state.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTotalBalance = (tokens: IToken[]): number => {
    return tokens
      .map(
        (tkn) =>
          getUserTokenBalance(tkn) * getTokenShareClassCurrentNav(tkn) || 0,
      )
      .reduce((a, b) => a + b, 0);
  };

  if (state.hasLoadingError) {
    return <PageError />;
  }

  const totalBalance =
    state.tokens.length > 0 ? getTotalBalance(state.tokens) : 0;
  const isOnlySLDashboard = state.tokens.every(
    (asset) => asset.assetData?.type === AssetType.SYNDICATED_LOAN,
  );
  return (
    <div id="_route_investor_portfolio">
      <PageTitle
        title={intl.formatMessage(PortfolioTexts.portfolioTitle)}
        tabActions={buildTabActions(intl, state.tokens)}
      />
      {state.isLoading && <PageLoader />}
      {!state.isLoading && (
        <main>
          {!isOnlySLDashboard && (
            <div className="top">
              <Balance
                balance={{
                  total: totalBalance,
                  currency:
                    state.tokens.length > 0
                      ? getTokenCurrency(state.tokens[0])
                      : undefined,
                  dateOfFirstInvestment:
                    state.orders.length > 0
                      ? new Date(
                          state.orders[state.orders.length - 1].date,
                        ).getTime()
                      : undefined,
                }}
              />
              <TimeSeriesLargeGraph className="graph" />
            </div>
          )}
          <TablePaginated
            serverSidePagination={{
              totalRows: state.total,
              pageSize: state.limit,
              currentPage: state.offset / state.limit,
            }}
            // hidePagination
            tableSettingsId="portfolio"
            TableTitle={intl.formatMessage(CommonTexts.assets)}
            isLoading={state.isLoading}
            defaultColumnsHidden={[]}
            columns={[
              {
                Header: intl.formatMessage(CommonTexts.asset),
                accessor: 'name',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(
                  isOnlySLDashboard
                    ? fundInvestorAssetsTexts.assetsTableHeaderTokenBalance
                    : fundInvestorAssetsTexts.assetsTableHeaderBalanceShares,
                ),
                accessor: 'tokenBalance',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(
                  isOnlySLDashboard
                    ? fundInvestorAssetsTexts.assetsTableHeaderBalance
                    : fundInvestorAssetsTexts.assetsTableHeaderBalanceAmount,
                ),
                Cell: ({ row: { original } }: any) =>
                  original.assetType === AssetType.SYNDICATED_LOAN
                    ? currencyFormat(
                        totalOrderAmountReceived(original.token, user.id),
                        getTokenCurrency(original.token),
                      )
                    : currencyFormat(
                        original.currentTokenInvestorAmount,
                        getTokenCurrency(original.token),
                      ),
                getCellExportValue: ({ original }: any) =>
                  original.assetType === AssetType.SYNDICATED_LOAN
                    ? currencyFormat(
                        totalOrderAmountReceived(original.token, user.id),
                        getTokenCurrency(original.token),
                      )
                    : currencyFormat(
                        original.currentTokenInvestorAmount,
                        getTokenCurrency(original.token),
                      ),
                accessor: 'balance',
                disableSortBy: true,
              },
              ...(isOnlySLDashboard
                ? []
                : [
                    {
                      Header: intl.formatMessage(
                        PortfolioTexts.portfolioPercentage,
                      ),
                      accessor: 'percentage',
                      disableSortBy: true,
                    },
                  ]),
              {
                Header: '',
                reorderName: intl.formatMessage(CommonTexts.actions),
                accessor: 'actions',
                disableResizing: true,
                disableSortBy: true,
                noPadding: true,
                disableExport: true,
                Cell: ({ row: { original } }: any) => (
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'flex-end',
                      marginRight: '16px',
                    }}
                  >
                    <>
                      <Button
                        size="small"
                        tertiary
                        style={{ height: '32px' }}
                        label={intl.formatMessage(CommonTexts.view)}
                        onClick={() =>
                          history.push(
                            CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
                              assetId: original.token.id,
                            }),
                          )
                        }
                      />
                      {
                        <>
                          {[
                            AssetType.SYNDICATED_LOAN,
                            AssetType.CURRENCY,
                          ].indexOf(original.assetType) > -1 ? (
                            <></>
                          ) : (
                            <Button
                              size="small"
                              style={{ height: '32px' }}
                              label={intl.formatMessage(CommonTexts.sell)}
                              onClick={() =>
                                history.push(
                                  `${CLIENT_ROUTE_INVESTMENT_PRODUCT_SELL_REQUEST}?assetId=${
                                    original.token.id
                                  }&classKey=${getTokenShareClassKey(
                                    original.token,
                                  )}`,
                                )
                              }
                            />
                          )}
                        </>
                      }
                    </>
                  </div>
                ),
              },
            ]}
            data={state.assetData}
            fetchData={(data: TableFetchDataType) => {
              setState((s) => ({
                ...s,
                offset: data.pageSize * data.pageIndex,
                limit: data.pageSize,
              }));
              loadData();
            }}
            translations={{
              emptyTitle: intl.formatMessage(CommonTexts.noAssets),
              emptyDescription: intl.formatMessage(
                PortfolioTexts.noAssetMessage,
              ),
            }}
          />
          <TablePaginated
            tableSettingsId="portfolioRecentTransactions"
            TableTitle={intl.formatMessage(CommonTexts.recentTransactions)}
            isLoading={state.isLoading}
            defaultColumnsHidden={[]}
            columns={[
              {
                Header: intl.formatMessage(CommonTexts.asset),
                accessor: 'assetName',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(CommonTexts.status),
                accessor: 'status',
                Cell: ({
                  row: { original },
                }: {
                  row: { original: RecentTransactionsData };
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
                Header: intl.formatMessage(CommonTexts.type),
                accessor: 'type',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(CommonTexts.quantity),
                accessor: 'quantity',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(CommonTexts.amount),
                accessor: 'amount',
                disableSortBy: true,
              },
              {
                Header: intl.formatMessage(CommonTexts.orderDate),
                accessor: 'orderDate',
                disableSortBy: true,
                Cell: ({
                  row: { original },
                }: {
                  row: { original: RecentTransactionsData };
                }) => formatDate(new Date(original.orderDate)),
                getCellExportValue: ({ original }: any) =>
                  formatDate(new Date(original.orderDate)),
              },
              {
                Header: '',
                reorderName: 'Actions',
                accessor: 'actions',
                disableResizing: true,
                disableSortBy: true,
                noPadding: true,
                disableExport: true,
                Cell: ({ row: { original } }: any) => (
                  <div>
                    {original.transaction.type === WorkflowType.ORDER && (
                      <Link
                        to={CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
                          orderId: `${original.transaction.id}`,
                        })}
                        style={{
                          color: colors.main,
                        }}
                      >
                        {intl.formatMessage(CommonTexts.viewOrder)}
                      </Link>
                    )}
                  </div>
                ),
              },
            ]}
            translations={{
              emptyTitle: intl.formatMessage(CommonTexts.noTransactions),
              emptyDescription: intl.formatMessage(
                PortfolioTexts.noTransactionsMessage,
              ),
            }}
            data={state.recentTransactions}
          />
        </main>
      )}
    </div>
  );
};
