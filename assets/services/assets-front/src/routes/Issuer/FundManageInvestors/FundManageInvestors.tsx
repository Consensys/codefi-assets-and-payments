import React, { useCallback, useEffect, useState } from 'react';
import './FundMangeInvestorsStyles.scss';

import PageTitle from 'uiComponents/PageTitle';

import { useIntl } from 'react-intl';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError/PageError';
import { DataCall } from 'utils/dataLayer';
import {
  API_ALLOWLIST_TOKEN_RELATED_KYC,
  API_ASSET_INVESTORS_ALL_GET,
  API_FETCH_USERS,
  API_REMOVE_TOKEN_RELATED_KYC,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import { IToken } from '../AssetIssuance/templatesTypes';
import { useParams } from 'react-router-dom';
import {
  fundManageInvestorsMessages,
  fundInvestorsMessages,
  fundInvestorAssetsTexts,
} from 'texts/routes/issuer/fundInvestor';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { colors } from 'constants/styles';
import { tableFilterOptions } from 'uiComponents/Table';
import { IERC1400Balances, IUser, IUserTokenData, LinkStatus } from 'User';
import { CommonTexts } from 'texts/commun/commonTexts';
import { Link } from 'react-router-dom';
import {
  formatNumber,
  getAssetName,
  getClientName,
  getProductFromToken,
  getTokenCurrency,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { CLIENT_ROUTE_INVESTOR_PROFILE } from 'routesList';
import Button from 'uiComponents/Button';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import Tooltip from 'uiComponents/Tooltip/Tooltip';
import Icon from 'uiComponents/Icon';
import { mdiAlertOctagon, mdiInformation } from '@mdi/js';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { useDispatch } from 'react-redux';
import { setAppModal } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

enum InvestorStatus {
  HAS_ACCESS = 'HAS ACCESS',
  NO_ACCESS = 'NO ACCESS',
}

interface TableDataRow {
  investor: IUser;
  investorName: string;
  status: string;
  balance: string;
  quantity: string;
  id: string;
}

const FundManageInvestors: React.FC = () => {
  const intl = useIntl();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [token, setToken] = useState<IToken>();
  const [states, setStates] = useState<Array<string>>([
    InvestorStatus.HAS_ACCESS,
    InvestorStatus.NO_ACCESS,
  ]);
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<Array<TableDataRow>>();
  const dispatch = useDispatch();

  const allStatusFilterOptions = [
    {
      title: intl.formatMessage(fundManageInvestorsMessages.hasAccess),
      value: InvestorStatus.HAS_ACCESS,
    },
    {
      title: intl.formatMessage(fundManageInvestorsMessages.noAccess),
      value: InvestorStatus.NO_ACCESS,
    },
  ];

  const loadData = useCallback(
    async (hideLoading?: boolean) => {
      try {
        if (!hideLoading) {
          setIsLoading(true);
        }

        const { token }: { token: IToken } = await DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path((params as any).assetId),
          urlParams: {
            withBalances: true,
          },
        });

        const investors = await DataCall({
          method: API_ASSET_INVESTORS_ALL_GET.method,
          path: API_ASSET_INVESTORS_ALL_GET.path((params as any).assetId),
          urlParams: {
            offset,
            limit,
            withBalances: true,
          },
        });

        const {
          users,
          total: totalUsers,
        }: { users: Array<IUser>; total: number } = await DataCall({
          method: API_FETCH_USERS.method,
          path: API_FETCH_USERS.path(),
          urlParams: {
            offset,
            limit,
            withBalances: true,
            linkStates: JSON.stringify([LinkStatus.VALIDATED]),
          },
        });

        const noAccessInvestors = users.filter(
          (user) =>
            (user.link || {}).state === LinkStatus.VALIDATED &&
            investors.users
              .map((tokenInvestor: IUser) => tokenInvestor.id)
              .indexOf(user.id) === -1,
        );

        const { shareClasses } = await getProductFromToken(token);
        const dataInvestors = await investors.users.map((investor: IUser) => {
          const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

          const balances = tokenRelatedData.balances as IERC1400Balances;

          const shares = balances ? balances.total : 0;

          const amount = currencyFormat(
            shares * (shareClasses[0].nav.value || 0),
            getTokenCurrency(token),
          );
          const viewLink = CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
            investorId: investor.id,
          });

          return {
            id: investor.id,
            investor,
            investorName: getClientName(investor),
            status: InvestorStatus.HAS_ACCESS,
            balance: amount,
            quantity: formatNumber(shares),
            tokenId: token.id,
            selectedShareClass: shareClasses[0],
            viewLink,
          } as TableDataRow;
        });

        const dataNoAccessInvestors = await noAccessInvestors.map(
          (investor) => {
            return {
              id: investor.id,
              investor,
              investorName: getClientName(investor),
              status: InvestorStatus.NO_ACCESS,
              balance: '-',
              quantity: '-',
              tokenId: token.id,
              selectedShareClass: shareClasses[0],
              viewLink: CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
                investorId: investor.id,
              }),
            } as TableDataRow;
          },
        );

        const data = [...dataInvestors, ...dataNoAccessInvestors].filter((el) =>
          states.includes(el.status),
        );

        setData(data);
        setToken(token);
        setTotal(totalUsers);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        setHasLoadingError(true);
      }
    },
    [limit, offset, params, states],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading && !data) {
    return <PageLoader />;
  }

  if (hasLoadingError || !data || !token) {
    return <PageError />;
  }

  return (
    <div className="_routes_issuer_fundManageInvestors">
      <PageTitle
        title={intl.formatMessage(fundManageInvestorsMessages.manageInvestors)}
        withBreadcrumbs
        customBreadcrumbs={[
          { label: intl.formatMessage(CommonTexts.home) },
          { label: intl.formatMessage(CommonTexts.assets), to: '/assets' },
          {
            label: getAssetName(token),
            to: `/assets/${token.id}`,
          },
          {
            label: intl.formatMessage(CommonTexts.investors),
            to: `/assets/${token.id}/investors`,
          },
          {
            label: intl.formatMessage(
              fundManageInvestorsMessages.manageInvestors,
            ),
            to: `/assets/${token.id}/investors/manage-investors`,
          },
        ]}
      />
      <main>
        <TablePaginated
          tableSettingsId="fundManageInvestors"
          serverSidePagination={{
            totalRows: total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          isLoading={isLoading}
          defaultColumnsHidden={[]}
          data={data}
          selectable
          SelectedItemsActions={({ selectedItems }) => {
            const states = selectedItems.map(
              (selectedItem) => selectedItem.status,
            );
            const toGiveAccess = states.every(
              (status) => status === InvestorStatus.NO_ACCESS,
            );

            const toRemoveAccess = states.every(
              (status) => status === InvestorStatus.HAS_ACCESS,
            );
            const toGiveAndRemoveAccess =
              states.includes(InvestorStatus.NO_ACCESS) &&
              states.includes(InvestorStatus.HAS_ACCESS);

            const everyHasBalance = selectedItems.every(
              (selectedItem) => selectedItem.quantity !== '0',
            );

            const someHasBalance = selectedItems.some(
              (selectedItem) => selectedItem.quantity !== '0',
            );
            return (
              <>
                {(toGiveAccess || toGiveAndRemoveAccess) && (
                  <Button
                    className="giveAccessButton"
                    label={intl.formatMessage(
                      fundManageInvestorsMessages.giveAccess,
                    )}
                    type="submit"
                    onClick={async () => {
                      dispatch(
                        setAppModal(
                          appModalData({
                            title: intl.formatMessage(
                              fundManageInvestorsMessages.addInvestors,
                            ),
                            confirmAction: async () => {
                              try {
                                setIsLoading(true);
                                selectedItems.forEach(async (selectedItem) => {
                                  if (
                                    selectedItem.status ===
                                    InvestorStatus.NO_ACCESS
                                  )
                                    await DataCall({
                                      method:
                                        API_ALLOWLIST_TOKEN_RELATED_KYC.method,
                                      path: API_ALLOWLIST_TOKEN_RELATED_KYC.path(),
                                      body: {
                                        submitterId: selectedItem.id,
                                        tokenId: selectedItem.tokenId,
                                        assetClass:
                                          selectedItem.selectedShareClass.key,
                                        sendNotification: true,
                                      },
                                    });
                                });
                                await loadData();
                                setIsLoading(false);
                              } catch (error) {
                                setIsLoading(false);
                                setHasLoadingError(true);
                                EventEmitter.dispatch(
                                  Events.EVENT_APP_MESSAGE,
                                  appMessageData({
                                    message: intl.formatMessage(
                                      fundManageInvestorsMessages.unableToGiveAccess,
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
                              fundManageInvestorsMessages.giveAccess,
                            ),
                            confirmColor: colors.main,
                            content: (
                              <>
                                <div>
                                  {intl.formatMessage(
                                    fundManageInvestorsMessages.giveAccessConfirmation,
                                  )}
                                </div>
                              </>
                            ),
                          }),
                        ),
                      );
                    }}
                  ></Button>
                )}
                <Tooltip
                  title={
                    everyHasBalance
                      ? intl.formatMessage(
                          fundManageInvestorsMessages.removeInvestorsTooltip,
                        )
                      : ''
                  }
                >
                  <div>
                    {(toRemoveAccess || toGiveAndRemoveAccess) && (
                      <Button
                        className="removeAccessButton"
                        label={intl.formatMessage(
                          fundManageInvestorsMessages.removeAccess,
                        )}
                        secondary
                        color="#B20000"
                        textColor="#B20000"
                        disabled={everyHasBalance}
                        onClick={async () => {
                          dispatch(
                            setAppModal(
                              appModalData({
                                title: intl.formatMessage(
                                  fundManageInvestorsMessages.removeInvestors,
                                ),
                                confirmAction: async () => {
                                  try {
                                    setIsLoading(true);
                                    selectedItems.forEach(
                                      async (selectedItem) => {
                                        if (
                                          selectedItem.status ===
                                            InvestorStatus.HAS_ACCESS &&
                                          selectedItem.quantity === '0'
                                        )
                                          await DataCall({
                                            method:
                                              API_REMOVE_TOKEN_RELATED_KYC.method,
                                            path: API_REMOVE_TOKEN_RELATED_KYC.path(
                                              'reviewer',
                                            ),
                                            body: {
                                              submitterId: selectedItem.id,
                                              tokenId: selectedItem.tokenId,
                                              assetClass:
                                                selectedItem.selectedShareClass
                                                  .key,
                                              sendNotification: true,
                                            },
                                          });
                                      },
                                    );
                                    await loadData();
                                    setIsLoading(false);
                                  } catch (error) {
                                    setIsLoading(false);
                                    setHasLoadingError(true);
                                    EventEmitter.dispatch(
                                      Events.EVENT_APP_MESSAGE,
                                      appMessageData({
                                        message: intl.formatMessage(
                                          fundManageInvestorsMessages.unableToRemoveAccess,
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
                                  fundManageInvestorsMessages.removeAccess,
                                ),
                                confirmColor: colors.errorDark,
                                content: someHasBalance ? (
                                  <div className="removeInvestorDialog">
                                    <div className="dialogInfo">
                                      <Icon
                                        icon={mdiInformation}
                                        color="#CC5252"
                                      />
                                      <span>
                                        {intl.formatMessage(
                                          fundManageInvestorsMessages.removeInvestorInfo,
                                        )}
                                      </span>
                                    </div>
                                    <div>
                                      {intl.formatMessage(
                                        fundManageInvestorsMessages.removeAccessConfirmation,
                                      )}
                                    </div>
                                    <div>
                                      {intl.formatMessage(
                                        fundManageInvestorsMessages.removeInvestorWithBalance,
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="removeInvestorDialog">
                                    {intl.formatMessage(
                                      fundManageInvestorsMessages.removeAccessConfirmation,
                                    )}
                                  </div>
                                ),
                              }),
                            ),
                          );
                        }}
                      />
                    )}
                  </div>
                </Tooltip>
              </>
            );
          }}
          fetchData={(newParams) => {
            const newStateFilters = newParams.filters.map(
              (state) => state.value,
            );
            setOffset(newParams.pageIndex * newParams.pageSize);
            setStates(
              newStateFilters[0] && newStateFilters[0].length
                ? newStateFilters[0]
                : [InvestorStatus.HAS_ACCESS, InvestorStatus.NO_ACCESS],
            );
            setLimit(newParams.pageSize);
          }}
          translations={{
            emptyTitle: intl.formatMessage(
              fundInvestorsMessages.investorsListEmpty,
            ),
            emptyDescription: intl.formatMessage(
              fundInvestorsMessages.investorsListEmptyDesc,
            ),
          }}
          columns={[
            {
              Header: intl.formatMessage(fundInvestorsMessages.investors),
              accessor: 'investorName',
              disableSortBy: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.transactionsListHeaderStatus,
              ),
              accessor: 'status',
              disableSortBy: true,
              filter: tableFilterOptions,
              filterValues: allStatusFilterOptions,
              Cell: function statusItems({
                row: { original },
              }: {
                row: { original: any };
              }) {
                return (
                  <span
                    className={
                      original.status === InvestorStatus.NO_ACCESS
                        ? 'noAccessClass'
                        : 'hasAccessClass'
                    }
                  >
                    {original.status.toUpperCase()}
                  </span>
                );
              },
              noPadding: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(
                fundInvestorsMessages.investorsListHeaderBalanceAmount,
              ),
              accessor: 'balance',
              width: 100,
              disableSortBy: true,
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                original.balance,
            },
            {
              Header: intl.formatMessage(
                fundInvestorsMessages.investorsListHeaderBalanceQuantity,
              ),
              accessor: 'quantity',
              disableSortBy: true,
              width: 100,
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                original.quantity,
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
              Cell: function ActionsItems({ row: { original } }: any) {
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

export default FundManageInvestors;
