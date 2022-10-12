import React from 'react';
import { mdiAlertOctagon } from '@mdi/js';
import { useParams } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import { PaginatedDataListCard } from 'uiComponents/PaginatedDataListCard';
import { MiniChart } from 'uiComponents/MiniChart';
import { ValueVariationIndicator } from 'uiComponents/ValueVariationIndicator';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import Button from 'uiComponents/Button';
import TransferBondUnitsDialog from './dialogs/TransferDialog';
import CancelBondUnitsDialog from './dialogs/CancelDialog';
import IssueBondUnitsDialog from './dialogs/IssueDialog';
import './FundOverviewStyles.scss';

import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';

import {
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_ASSET_OVERVIEW_INFOS,
  CLIENT_ROUTE_ASSET_SHARECLASS,
  CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID,
} from 'routesList';
import {
  API_ASSET_INVESTORS_ALL_GET,
  API_LIST_ALL_ACTIONS,
  API_RETRIEVE_ASSET_AUMS_BY_ID,
  API_RETRIEVE_ASSET_PRICE,
} from 'constants/apiRoutes';
import {
  AssetType,
  IToken,
  IWorkflowInstance,
  WorkflowType,
} from '../AssetIssuance/templatesTypes';
import { IUser } from 'User';

import {
  formatDate,
  formatNumber,
  getActionOperationSign,
  getActionTypeLabel,
  getClientName,
  getFundOverviewTabs,
  getNextTransactionStatus,
  getProductFromToken,
  getToAddress,
  getTokenCurrency,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
  OVERVIEW_TABS,
} from 'utils/commonUtils';
import { DataCall } from 'utils/dataLayer';
import { currencyFormat } from 'utils/currencyFormat';

import { isTradeOrder } from 'constants/order';
import { CommonTexts } from 'texts/commun/commonTexts';
import { LoanOverview } from '../LoanOverview';
import { colors } from 'constants/styles';
import {
  fundInvestorAssetsTexts,
  fundInvestorsMessages,
} from 'texts/routes/issuer/fundInvestor';
import { fundOverviewTexts } from 'texts/routes/issuer/funds';
import { FundOverviewChart } from './FundOverviewChart';
import { Progress } from 'antd';
import moment from 'moment';
import Address from 'uiComponents/Address';
import { combineDateAndTime } from '../AssetIssuance/assetTypes';

import Dropdown from 'uiComponents/Dropdown';
import { menuItemsTexts } from 'texts/commun/menu';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { mdiMenuDown } from '@mdi/js';
import {
  QueryFunctionContext,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { tokenKeys } from 'constants/queryKeys';
import useToken from 'hooks/useToken';
import { useDispatch } from 'react-redux';
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
  from: string;
  to: string;
}

export const FundOverview: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const queryClient = useQueryClient();
  const params = useParams<{ assetId: string }>();
  const isBondType = (token: any): boolean => {
    return token?.assetData?.type === AssetType.FIXED_RATE_BOND;
  };
  const { token, tokenLoading } = useToken({
    id: params.assetId,
    withBalances: true,
  });
  const loadData = async ({
    queryKey: [{ token }],
  }: QueryFunctionContext<ReturnType<typeof tokenKeys['overview']>>) => {
    try {
      const { users: investors }: { users: IUser[] } = await DataCall({
        method: API_ASSET_INVESTORS_ALL_GET.method,
        path: API_ASSET_INVESTORS_ALL_GET.path(params.assetId),
        urlParams: {
          withBalances: true,
        },
      });
      token.investors = investors;

      const { shareClasses, assetType } = getProductFromToken(token);
      const isFixedRateBond = assetType === AssetType.FIXED_RATE_BOND;
      const isSyndicatedLoan = assetType === AssetType.SYNDICATED_LOAN;

      const isSecondary = assetType === AssetType.PHYSICAL_ASSET;

      const { actions }: { actions: Array<IWorkflowInstance> } = await DataCall(
        {
          method: API_LIST_ALL_ACTIONS.method,
          path: API_LIST_ALL_ACTIONS.path(),
          urlParams: {
            offset: 0,
            limit: assetType === AssetType.SYNDICATED_LOAN ? 30 : 10,
            tokenId: params.assetId,
          },
        },
      );

      const tableData = actions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((transaction) => {
          const matchInvestor = token.investors?.find(
            (user: IUser) => user.id === transaction.userId,
          );

          const quantity = transaction.quantity;

          const amount = transaction.price;

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
              assetType,
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
            orderDate: formatDate(new Date(transaction.date)),
            viewLink: CLIENT_ROUTE_ORDER_MANAGEMENT_BY_ID.pathBuilder({
              orderId: `${transaction.id}`,
            }),
            linkVisible: transaction.workflowType === WorkflowType.ORDER,
            from: transaction.wallet,
            to: getToAddress(transaction),
          };
        });
      const aums = (
        await DataCall({
          method: API_RETRIEVE_ASSET_AUMS_BY_ID.method,
          path: API_RETRIEVE_ASSET_AUMS_BY_ID.path(params.assetId),
        })
      ).aums;

      const amountInvested = await DataCall({
        method: API_RETRIEVE_ASSET_PRICE.method,
        path: API_RETRIEVE_ASSET_PRICE.path(params.assetId),
      });

      const topInvestors = investors
        .map((investor) => {
          const price = investor?.tokenRelatedData?.tokenActions
            ?.filter((action) => action.name === 'validatePrimaryTradeOrder')
            .map((validatedAction) => validatedAction.price)
            .reduce((acc, current) => acc + current, 0);

          const quantity = investor?.tokenRelatedData?.tokenActions
            ?.filter((action) => action.name === 'validatePrimaryTradeOrder')
            .map((validatedAction) => validatedAction.quantity)
            .reduce((acc, current) => acc + current, 0);

          const amount = currencyFormat(price || 0, getTokenCurrency(token));
          return {
            investor: investor.data.clientName || '-',
            amount,
            quantity: quantity || 0,
            shareOfTotal: `${
              ((price || 0) / amountInvested.price) * 100 || 0
            }%`,
          };
        })
        .filter((investor) => investor.quantity !== 0);
      topInvestors.sort((a, b) => b.quantity - a.quantity).splice(5);

      return {
        token,
        shareClasses,
        actions,
        isLoading: false,
        data: tableData,
        topInvestors,
        amountInvested,
        chartData: aums,
        isFixedRateBond,
        isSyndicatedLoan,
      };
    } catch (error) {
      throw error;
    }
  };

  const { data, isLoading, isError, refetch } = useQuery(
    tokenKeys.overview(token as IToken),
    loadData,
    {
      enabled: !!token,
      keepPreviousData: true,
      onSuccess: (data) => {
        checkPendingTokenActions(data?.actions || []);
      },
    },
  );

  const checkPendingTokenActions = (actions: Array<IWorkflowInstance>) => {
    const isPending = hasPendingTokenAction(actions || []);
    if (isPending) {
      queryClient.invalidateQueries(tokenKeys.overview(token as IToken));
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

  if (isLoading || tokenLoading) {
    return <PageLoader />;
  }

  if (isError || !token || !data) {
    return <PageError />;
  }

  const assetType = token?.assetData?.type;

  if (assetType === AssetType.SYNDICATED_LOAN) {
    return <LoanOverview token={token} actions={data.actions} />;
  }

  const getOverviewTitle = () => (
    <div style={{ color: '#000a28', fontWeight: 600, fontSize: '14px' }}>
      {isBondType(token)
        ? intl.formatMessage(fundOverviewTexts.totalRaised)
        : intl.formatMessage(fundOverviewTexts.assetsUnderManagement)}
      <span style={{ display: 'flex' }}>
        <span
          style={{
            marginRight: '10px',
            fontSize: '20px',
            fontWeight: 600,
            color: '#475166',
          }}>
          {currencyFormat(
            data.chartData.length > 0
              ? data.chartData[data.chartData.length - 1].price
              : 0,
            getTokenCurrency(token),
          )}
        </span>
      </span>
    </div>
  );

  return (
    <div className="_route_issuer_fundOverview">
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
          OVERVIEW_TABS.OVERVIEW,
        )}
        customTabActions={[
          // eslint-disable-next-line react/jsx-key
          <Button
            key="tab-action-button"
            className="issue-shares-button"
            onClick={async () => {
              try {
                const { users: investors }: { users: IUser[] } = await DataCall(
                  {
                    method: API_ASSET_INVESTORS_ALL_GET.method,
                    path: API_ASSET_INVESTORS_ALL_GET.path(token.id),
                    urlParams: {
                      withBalances: true,
                    },
                  },
                );
                dispatch(
                  setAppModal(
                    appModalData({
                      title: data.isSyndicatedLoan
                        ? intl.formatMessage(
                            fundInvestorsMessages.investorsListActionsIssueLoanUnitsModal,
                          )
                        : data.isFixedRateBond
                        ? intl.formatMessage(
                            fundInvestorsMessages.investorsListActionsIssueBondUnitsModal,
                          )
                        : intl.formatMessage(
                            fundInvestorsMessages.investorsListActionsIssueSharesModal,
                          ),
                      content: (
                        <IssueBondUnitsDialog
                          token={token}
                          investors={investors}
                          callback={(affectedInvestors, affectedAssets) => {
                            refetch();
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
                    message: intl.formatMessage(fundInvestorAssetsTexts.error),
                    secondaryMessage: String(error),
                    icon: mdiAlertOctagon,
                    color: colors.error,
                    isDark: true,
                  }),
                );
              }
            }}
            size="small">
            {data.isSyndicatedLoan || data.isFixedRateBond
              ? intl.formatMessage(menuItemsTexts.issueUnits)
              : intl.formatMessage(menuItemsTexts.issueShares)}
          </Button>,
          // eslint-disabl e-next-line react/jsx-key
          <div className="dropdownMenu" key="tab-action-dropdown">
            <Dropdown
              colored
              iconLeft={mdiMenuDown}
              options={[
                {
                  label:
                    data.isSyndicatedLoan || data.isFixedRateBond
                      ? intl.formatMessage(menuItemsTexts.transferUnits)
                      : intl.formatMessage(menuItemsTexts.transferShares),
                  color: '#475166',
                  onClick: async () => {
                    try {
                      const { users: investors }: { users: IUser[] } =
                        await DataCall({
                          method: API_ASSET_INVESTORS_ALL_GET.method,
                          path: API_ASSET_INVESTORS_ALL_GET.path(token.id),
                          urlParams: {
                            withBalances: true,
                          },
                        });
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: data.isSyndicatedLoan
                              ? intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsTransferLoanUnitsModal,
                                )
                              : data.isFixedRateBond
                              ? intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsTransferBondUnitsModal,
                                )
                              : intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsTransferSharesModal,
                                ),
                            content: (
                              <TransferBondUnitsDialog
                                token={token}
                                investors={investors}
                                callback={(
                                  affectedAssets,
                                  affectedInvestors,
                                ) => {
                                  refetch();
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
                  },
                },
                {
                  label:
                    data.isSyndicatedLoan || data.isFixedRateBond
                      ? intl.formatMessage(menuItemsTexts.cancelUnits)
                      : intl.formatMessage(menuItemsTexts.cancelShares),
                  color: '#475166',
                  onClick: async () => {
                    try {
                      const { users: investors }: { users: IUser[] } =
                        await DataCall({
                          method: API_ASSET_INVESTORS_ALL_GET.method,
                          path: API_ASSET_INVESTORS_ALL_GET.path(token.id),
                          urlParams: {
                            withBalances: true,
                          },
                        });
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: data.isSyndicatedLoan
                              ? intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsCancelLoanUnitsModal,
                                )
                              : data.isFixedRateBond
                              ? intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsCancelBondUnitsModal,
                                )
                              : intl.formatMessage(
                                  fundInvestorsMessages.investorsListActionsCancelSharesModal,
                                ),
                            content: (
                              <CancelBondUnitsDialog
                                token={token}
                                investors={investors}
                                callback={(
                                  affectedInvestors,
                                  affectedAssets,
                                ) => {
                                  refetch();
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
                  },
                },
              ]}
            />
          </div>,
        ]}
        tabActions={[
          {
            label: intl.formatMessage(fundOverviewTexts.viewAssetInformation),
            secondary: true,
            href: CLIENT_ROUTE_ASSET_OVERVIEW_INFOS.pathBuilder({
              assetId: params.assetId,
            }),
          },
        ]}
      />
      <main>
        {!isLoading && token && (
          <>
            {isBondType(token) && (
              <div>
                <div className="progressBar">
                  <p>{intl.formatMessage(fundOverviewTexts.totalRaised)}</p>
                  <h1>{`${currencyFormat(
                    data.amountInvested.price,
                    getTokenCurrency(token),
                  )}`}</h1>
                  <Progress
                    type="line"
                    percent={
                      (data.amountInvested.price /
                        data.shareClasses[0].rules
                          ?.maxGlobalSubscriptionAmount) *
                      100
                    }
                    showInfo={false}
                    strokeColor="#1a5afe"
                    strokeWidth={10}
                    width={70}
                  />
                  <p>
                    {(data.amountInvested.price /
                      data.shareClasses[0].rules?.maxGlobalSubscriptionAmount) *
                      100}{' '}
                    % {intl.formatMessage(fundOverviewTexts.funded)}
                  </p>
                </div>
                <div className="keyInfoCutOff">
                  <div className="keyInfo">
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(fundOverviewTexts.minNominalAmount)}
                      </div>
                      <div className="infoValue">
                        {`${currencyFormat(
                          data.shareClasses[0].rules
                            ?.minGlobalSubscriptionAmount || 0,
                          getTokenCurrency(token),
                        )}`}
                      </div>
                    </div>
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(fundOverviewTexts.maxNominalAmount)}
                      </div>
                      <div className="infoValue">
                        {`${currencyFormat(
                          data.shareClasses[0].rules
                            ?.maxGlobalSubscriptionAmount || 0,
                          getTokenCurrency(token),
                        )}`}
                      </div>
                    </div>
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(fundOverviewTexts.Borrower)}
                      </div>
                      <div className="infoValue">
                        {token?.data?.borrowerInformation?.name
                          ? token?.data?.borrowerInformation?.name
                          : token?.assetData?.asset?.borrowerDetails?.name}
                      </div>
                    </div>
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(fundOverviewTexts.couponRate)}
                      </div>
                      <div className="infoValue">
                        {data.shareClasses[0].couponRate
                          ? data.shareClasses[0].couponRate.rateValue + '%'
                          : '-'}
                      </div>
                    </div>
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(
                          fundOverviewTexts.subscriptionCutOff,
                        )}
                      </div>
                      <div className="infoValue">
                        {moment(
                          combineDateAndTime(
                            data.shareClasses[0].initialSubscription.cutoffDate,
                            data.shareClasses[0].initialSubscription.cutoffHour,
                          ),
                        ).format('YYYY-MM-DD HH:mm')}{' '}
                      </div>
                    </div>
                    <div className="infoBox">
                      <div className="infoTitle">
                        {intl.formatMessage(fundOverviewTexts.issuance)}
                      </div>
                      <div className="infoValue">
                        {moment(
                          combineDateAndTime(
                            data.shareClasses[0].initialSubscription
                              .settlementDate,
                            data.shareClasses[0].initialSubscription
                              .settlementHour,
                          ),
                        ).format('YYYY-MM-DD HH:mm')}{' '}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isBondType(token) && (
              <FundOverviewChart
                chartData={data.chartData}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                token={token!}
                title={getOverviewTitle()}
              />
            )}
            {data.shareClasses?.length > 1 && (
              <PaginatedDataListCard
                title={intl.formatMessage(fundInvestorsMessages.shareClasses)}
                // topLink={{ label: "View all Share Classes", href: "#" }}
                colHeaders={[
                  intl.formatMessage(
                    fundOverviewTexts.shareClassHeadersShareClass,
                  ),
                  intl.formatMessage(fundOverviewTexts.shareClassHeadersNAV),
                  intl.formatMessage(
                    fundOverviewTexts.shareClassHeadersChangeYTD,
                  ),
                  intl.formatMessage(fundOverviewTexts.shareClassHeadersChart),
                  intl.formatMessage(
                    fundOverviewTexts.shareClassHeadersAssetPercentage,
                  ),
                  '',
                ]}
                rows={data.shareClasses.map((shareClass, index) => [
                  shareClass.name || shareClass.key,
                  currencyFormat(
                    shareClass.nav.value || 0,
                    getTokenCurrency(token),
                  ),
                  <ValueVariationIndicator
                    key={`variation-${index}`}
                    variation={'up'}
                    variationLabel={`36%`}
                  />,
                  <MiniChart
                    data={[25, 27, 31, 43, 49]}
                    key={`minichart-${index}`}
                  />,
                  `100%`,
                  <div
                    key={`action-${index}`}
                    className="hidden"
                    style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      tertiary
                      label="view"
                      size="small"
                      href={CLIENT_ROUTE_ASSET_SHARECLASS.pathBuilder({
                        assetId: params.assetId,
                        shareClassId: shareClass.key,
                      })}
                    />
                  </div>,
                ])}
              />
            )}
          </>
        )}
        <TablePaginated
          tableSettingsId="fundOverview"
          isLoading={isLoading}
          defaultColumnsHidden={[]}
          TableTitle={intl.formatMessage(
            fundOverviewTexts.recentTransactionsTitle,
          )}
          hidePagination
          data={data.data}
          columns={[
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsInvestor,
              ),
              accessor: 'investor',
              disableSortBy: true,
            },
            {
              accessor: () => 'address',
              Header: 'From',
              width: 185,
              // eslint-disable-next-line
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) =>
                original.from ? <Address address={original.from} /> : null,
            },
            {
              accessor: () => 'address',
              Header: 'To',
              width: 185,
              // eslint-disable-next-line
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) => (original.to ? <Address address={original.to} /> : null),
            },
            {
              Header: intl.formatMessage(
                fundOverviewTexts.recentTransactionsStatus,
              ),
              accessor: 'status',
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
                  }}>
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
                fundOverviewTexts.recentTransactionsQuantity,
              ),
              accessor: 'quantity',
              disableSortBy: true,
              width: 80,
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
                if (!original.linkVisible) {
                  return '';
                }
                return (
                  <Link
                    to={original.viewLink}
                    style={{
                      color: colors.main,
                    }}>
                    {intl.formatMessage(CommonTexts.viewOrder)}
                  </Link>
                );
              },
            },
          ]}
        />
        {isBondType(token) && (
          <TablePaginated
            tableSettingsId="fundOverview"
            isLoading={isLoading}
            defaultColumnsHidden={[]}
            TableTitle={intl.formatMessage(fundOverviewTexts.topInvestors)}
            hidePagination
            data={data.topInvestors || []}
            columns={[
              {
                Header: intl.formatMessage(
                  fundOverviewTexts.recentTransactionsInvestor,
                ),
                accessor: 'investor',
                disableSortBy: true,
                width: 140,
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
                Header: intl.formatMessage(
                  fundOverviewTexts.recentTransactionsAmount,
                ),
                accessor: 'amount',
                disableSortBy: true,
                width: 80,
              },
              {
                Header: intl.formatMessage(fundOverviewTexts.shareOfTotal),
                accessor: 'shareOfTotal',
                disableSortBy: true,
                width: 100,
              },
            ]}
          />
        )}
      </main>
    </div>
  );
};
