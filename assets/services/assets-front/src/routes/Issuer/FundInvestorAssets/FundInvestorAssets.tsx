import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { mdiAlertOctagon } from '@mdi/js';
import { useSelector, useDispatch } from 'react-redux';
import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import Button from 'uiComponents/Button';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import TransferBalanceDialog from '../FundInvestors/dialogs/TransferBalanceDialog';
import UpdateBalanceDialog from '../FundInvestors/dialogs/UpdateBalanceDialog';

import { Card } from 'uiComponents/Card';
import {
  getActionTypeLabel,
  getProductFromToken,
  getTokenCurrency,
  getTokenShareClassCurrentNav,
  getTokenShareClassName,
  getClientName,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
  formatDate,
  formatNumber,
  getActionOperationSign,
  getNextTransactionStatus,
} from 'utils/commonUtils';
import { IERC1400Balances, IUser, IUserTokenData } from 'User';
import { DataCall } from 'utils/dataLayer';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
} from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  API_ASSET_ALL_GET,
  API_ASSET_INVESTORS_ALL_GET,
  API_FETCH_USER_BY_ROLE,
} from 'constants/apiRoutes';
import { currencyFormat } from 'utils/currencyFormat';
import { IPaginationProperties } from 'uiComponents/Pagination/paginationUtils';

import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';

import './FundInvestorAssets.scss';
import { buildTabs } from './utils/buildAssetData';
import { fundInvestorAssetsTexts } from 'texts/routes/issuer/fundInvestor';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';

import { TableFetchDataType } from 'uiComponents/Table';
import { CommonTexts } from 'texts/commun/commonTexts';
import Loader from 'uiComponents/Loader';
import { CLIENT_ROUTE_ASSET_INVESTOR_ASSETS_FEES } from 'routesList';
import Address from 'uiComponents/Address';
import { setAppModal, userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{
      investorId: string;
    }> {}

interface AssetsRowData {
  assetName: string;
  shares: string;
  amount: string;
  token: IToken;
  id: string;
  pendingTransactions: boolean;
  wallet: string;
}

interface RecentTransactionsData {
  investorName: string;
  status: string;
  statusStyle: React.CSSProperties;
  type: string;
  quantity: string;
  amount: string;
  orderDate: Date;
}

interface IState extends IPaginationProperties {
  isLoading: boolean;
  hasLoadingError: boolean;
  // selectedAssetId: string;
  investor?: IUser;
  tokens: IToken[];
  tokenData: Array<AssetsRowData>;
  tokenActions: Array<IWorkflowInstance>;
  recentTransactions: Array<RecentTransactionsData>;
  rowsUpdating: Array<string>;
  loadTimer: number | null;
}

const FundInvestorAssetsClass: React.FC<IProps> = ({ intl, match }) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector) as IUser;
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    tokenActions: [],
    tokens: [],
    tokenData: [],
    offset: 0,
    total: 0,
    limit: 10,
    actions: [],
    recentTransactions: [],
    rowsUpdating: [],
    loadTimer: null,
    // selectedAssetId: "all",
  });

  const getInvestorWithTokenData = useCallback(
    (investor: IUser, token: IToken): IUser => {
      return (token.investors?.find((inv) => inv.id === investor.id) ||
        {}) as IUser;
    },
    [],
  );

  const getInvestorTokenBalance = useCallback(
    (investor: IUser, token: IToken): number => {
      const investorWithTokenData = getInvestorWithTokenData(investor, token);
      return (
        (investorWithTokenData.tokenRelatedData as IUserTokenData)
          .balances as IERC1400Balances
      ).total;
    },
    [getInvestorWithTokenData],
  );

  const getTotalBalance = (investor: IUser, tokens: IToken[]): number => {
    return tokens
      ?.map(
        (tkn) =>
          getInvestorTokenBalance(investor, tkn) *
          getTokenShareClassCurrentNav(tkn),
      )
      .reduce((a, b) => a + b, 0);
  };

  const isPendingTokenAction = (tokenAction: IWorkflowInstance): boolean => {
    const nextTransactionStatus = getNextTransactionStatus(tokenAction.data);

    return nextTransactionStatus === 'pending';
  };

  const loadData = useCallback(
    async (hideLoading?: boolean) => {
      const checkPendingTransactions = (
        pendingMap: Record<string, boolean>,
      ) => {
        if (Object.keys(pendingMap).length > 0) {
          setState((s) => ({
            ...s,
            loadTimer: window.setTimeout(() => loadData(true), 3000),
          }));
        }
      };

      try {
        if (!hideLoading) {
          setState((s) => ({
            ...s,
            isLoading: true,
          }));
        }
        const { user: investor }: { user: IUser } = await DataCall({
          method: API_FETCH_USER_BY_ROLE.method,
          path: API_FETCH_USER_BY_ROLE.path(match.params.investorId),
        });

        const { tokens, total }: { tokens: IToken[]; total: number } =
          await DataCall({
            method: API_ASSET_ALL_GET.method,
            path: API_ASSET_ALL_GET.path(),
            urlParams: {
              offset: state.offset,
              limit: state.limit,
              investorId: match.params.investorId,
              withBalances: true,
            },
          });

        const tokenActions = tokens.reduce(
          (acc: Array<IWorkflowInstance>, token: IToken) => [
            ...acc,
            ...((
              ((token.investors as Array<IUser>)[0] as IUser)
                .tokenRelatedData as IUserTokenData
            ).tokenActions as Array<IWorkflowInstance>),
          ],
          [],
        );

        const pendingActionsTokenIds: Record<string, boolean> = {};

        const transactionsData: Array<RecentTransactionsData> =
          tokenActions.map((transaction) => {
            const matchingToken = tokens.find(
              (token) => token.id === transaction.entityId,
            ) as IToken;
            const { assetType } = getProductFromToken(matchingToken);
            const isSecondary = assetType === AssetType.PHYSICAL_ASSET;

            const quantity = transaction.quantity;
            const amount = transaction.price;

            const tokenCurrency = getTokenCurrency(matchingToken);
            if (isPendingTokenAction(transaction)) {
              pendingActionsTokenIds[matchingToken.id] = true;
            }
            return {
              investorName: getClientName(investor),
              statusStyle: getWorkflowInstanceStatusStyle(
                transaction,
                isSecondary,
              ),
              status: getWorkflowInstanceStatus(intl, transaction, isSecondary),
              type: getActionTypeLabel(intl, transaction, isSecondary),
              quantity: `${getActionOperationSign(
                transaction,
                quantity,
              )}${formatNumber(quantity > 0 ? quantity : -1 * quantity)}`,
              amount: `${getActionOperationSign(
                transaction,
                amount,
              )}${currencyFormat(
                amount > 0 ? amount : -1 * amount,
                tokenCurrency,
              )}`,
              orderDate: transaction.date,
            };
          });

        checkPendingTransactions(pendingActionsTokenIds);

        const tokenData: Array<AssetsRowData> = (tokens || []).map(
          (tkn: IToken) => ({
            assetName: `${tkn.name} - Class ${getTokenShareClassName(tkn)}`,
            shares: formatNumber(getInvestorTokenBalance(investor, tkn)),
            amount: currencyFormat(
              getInvestorTokenBalance(investor, tkn) *
                getTokenShareClassCurrentNav(tkn) || 0,
              getTokenCurrency((tokens || [])[0]),
            ),
            token: tkn,
            pendingTransactions: !!pendingActionsTokenIds[tkn.id],
            id: tkn.id,
            wallet: tkn.defaultDeployment || '',
          }),
        );

        setState((s) => ({
          ...s,
          investor,
          tokens,
          total,
          tokenActions,
          isLoading: false,
          tokenData,
          recentTransactions: transactionsData,
          rowsUpdating: [],
        }));
      } catch (error) {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasLoadingError: true,
          rowsUpdating: [],
        }));
      }
    },
    [
      getInvestorTokenBalance,
      intl,
      match.params.investorId,
      state.limit,
      state.offset,
    ],
  );

  useEffect(() => {
    loadData();

    return () => {
      state.loadTimer && clearTimeout(state.loadTimer);
    };
  }, [loadData, state.loadTimer]);

  const {
    isLoading,
    hasLoadingError,
    investor,
    tokens,
    tokenData,
    total,
    limit,
    offset,
    recentTransactions,
    rowsUpdating,
  } = state;

  const role = user.userType;

  if (isLoading) {
    return (
      <div className="_route_issuer_fundInvestorAssets">
        <PageLoader />
      </div>
    );
  }

  if (hasLoadingError || !investor) {
    return (
      <div className="_route_issuer_fundInvestorAssets">
        <PageError />
      </div>
    );
  }

  return (
    <div className="_route_issuer_fundInvestorAssets">
      <PageTitle
        title={getClientName(investor)}
        tabNavigation={buildTabs({
          active: 'assets',
          investorId: investor.id,
          role,
        })}
        tabActions={[
          {
            label: intl.formatMessage(fundInvestorAssetsTexts.title),
            href: CLIENT_ROUTE_ASSET_INVESTOR_ASSETS_FEES.pathBuilder({
              investorId: investor.id,
            }),
          },
        ]}
      />

      <main>
        <div className="numericData">
          <Card className="baseInfos">
            <header>
              <span>
                {intl.formatMessage(fundInvestorAssetsTexts.totalBalance)}
              </span>
              <div>
                {(() => {
                  if ((tokens || []).length > 0) {
                    return currencyFormat(
                      getTotalBalance(investor, tokens || []) || 0,
                      getTokenCurrency((tokens || [])[0]),
                    );
                  } else {
                    return '0';
                  }
                })()}
              </div>
            </header>

            <ul>
              {[
                [
                  intl.formatMessage(
                    fundInvestorAssetsTexts.dateOfFirstInvestment,
                  ),
                  '-',
                ],
              ].map((el) => (
                <li key={el[0] as string}>
                  <span>{el[0]}</span>
                  <span>{el[1]}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <TablePaginated
          serverSidePagination={{
            totalRows: total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          tableSettingsId="portfolio"
          TableTitle={intl.formatMessage(fundInvestorAssetsTexts.assets)}
          isLoading={isLoading}
          defaultColumnsHidden={[]}
          columns={[
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.assetsTableHeaderAsset,
              ),
              accessor: 'assetName',
              disableSortBy: true,
            },

            {
              accessor: () => 'address',
              Header: 'Address',
              width: 185,
              Cell: ({
                row: { original },
              }: {
                row: { original: AssetsRowData };
              }) =>
                original.wallet ? <Address address={original.wallet} /> : null,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.assetsTableHeaderBalanceShares,
              ),
              accessor: 'shares',
              disableSortBy: true,
              Cell: ({
                row: { original },
              }: {
                row: { original: AssetsRowData };
              }) => {
                if (
                  original.pendingTransactions ||
                  rowsUpdating.includes(original.id)
                ) {
                  return (
                    <Loader
                      color={colors.main}
                      width={43}
                      style={{ display: 'block', padding: '0 16px' }}
                    />
                  );
                }
                return (
                  <div style={{ padding: '14px 16px' }}>{original.shares}</div>
                );
              },
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.assetsTableHeaderBalanceAmount,
              ),
              accessor: 'amount',
              disableSortBy: true,
              Cell: ({
                row: { original },
              }: {
                row: { original: AssetsRowData };
              }) => {
                if (
                  original.pendingTransactions ||
                  rowsUpdating.includes(original.id)
                ) {
                  return (
                    <Loader
                      color={colors.main}
                      width={43}
                      style={{ display: 'block', padding: '0 16px' }}
                    />
                  );
                }
                return (
                  <div style={{ padding: '14px 16px' }}>{original.amount}</div>
                );
              },
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
                const updating =
                  original.pendingTransactions ||
                  rowsUpdating.includes(original.id);
                return (
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'flex-end',
                      marginRight: '16px',
                    }}
                  >
                    <Button
                      disabled={updating}
                      label={intl.formatMessage(
                        fundInvestorAssetsTexts.transfer,
                      )}
                      size="small"
                      tertiary
                      onClick={async () => {
                        try {
                          const { users: investors }: { users: IUser[] } =
                            await DataCall({
                              method: API_ASSET_INVESTORS_ALL_GET.method,
                              path: API_ASSET_INVESTORS_ALL_GET.path(
                                original.token.id,
                              ),
                              urlParams: {
                                withBalances: true,
                              },
                            });
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  fundInvestorAssetsTexts.transfer,
                                ),
                                content: (
                                  <TransferBalanceDialog
                                    token={original.token}
                                    investors={investors.filter(
                                      (investor) =>
                                        investor.id !== match.params.investorId,
                                    )}
                                    investor={getInvestorWithTokenData(
                                      investor,
                                      original.token,
                                    )}
                                    callback={(
                                      _affectedInvestors,
                                      affectedAssets,
                                    ) => {
                                      setState((s) => ({
                                        ...s,
                                        rowsUpdating: affectedAssets,
                                      }));
                                      loadData(true);
                                    }}
                                  />
                                ),
                                closeIcon: true,
                                noPadding: true,
                              }),
                            ),
                          );
                        } catch (error) {
                          EventEmitter.dispatch(
                            Events.EVENT_APP_MESSAGE,
                            appMessageData({
                              message: intl.formatMessage(
                                fundInvestorAssetsTexts.error,
                              ),
                              secondaryMessage: String(error),
                              icon: mdiAlertOctagon,
                              color: colors.error,
                              isDark: true,
                            }),
                          );
                        }
                      }}
                    />
                    <Button
                      disabled={updating}
                      label={intl.formatMessage(
                        fundInvestorAssetsTexts.updateBalanceLabel,
                      )}
                      size="small"
                      tertiary
                      onClick={() => {
                        dispatch(
                          setAppModal(
                            appModalData({
                              title: intl.formatMessage(
                                fundInvestorAssetsTexts.updateBalanceConfirm,
                              ),
                              content: (
                                <UpdateBalanceDialog
                                  token={original.token}
                                  investor={getInvestorWithTokenData(
                                    investor,
                                    original.token,
                                  )}
                                  callback={(
                                    _affectedInvestors,
                                    affectedAssets,
                                  ) => {
                                    setState((s) => ({
                                      ...s,
                                      rowsUpdating: affectedAssets,
                                    }));
                                    loadData(true);
                                  }}
                                />
                              ),
                              closeIcon: true,
                              noPadding: true,
                            }),
                          ),
                        );
                      }}
                    />
                  </div>
                );
              },
            },
          ]}
          data={tokenData}
          fetchData={(data: TableFetchDataType) => {
            setState((s) => ({
              ...s,
              offset: data.pageSize * data.pageIndex,
              limit: data.pageSize,
            }));
            loadData();
          }}
        />

        <TablePaginated
          tableSettingsId="portfolioRecentTransactions"
          TableTitle={intl.formatMessage(
            fundInvestorAssetsTexts.transactionsListTitle,
          )}
          isLoading={isLoading}
          defaultColumnsHidden={[]}
          columns={[
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderInvestor,
              ),
              accessor: 'investorName',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderStatus,
              ),
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
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderType,
              ),
              accessor: 'type',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderQuantity,
              ),
              accessor: 'quantity',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderAmount,
              ),
              accessor: 'amount',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderDate,
              ),
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
          ]}
          translations={{
            emptyTitle: intl.formatMessage(
              fundInvestorAssetsTexts.transactionsListEmpty,
            ),
            emptyDescription: intl.formatMessage(
              fundInvestorAssetsTexts.transactionsListEmptyDesc,
            ),
          }}
          data={recentTransactions}
        />
      </main>
    </div>
  );
};

export const FundInvestorAssets = injectIntl(FundInvestorAssetsClass);
