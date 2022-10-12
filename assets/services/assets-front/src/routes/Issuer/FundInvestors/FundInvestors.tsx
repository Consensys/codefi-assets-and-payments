import React, { useState } from 'react';
import { TableFetchDataType } from 'uiComponents/Table';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import {
  CLIENT_ROUTE_INVESTOR_PROFILE,
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_ASSET_MANAGE_INVESTORS,
} from 'routesList';
import Loader from 'uiComponents/Loader';
import Button from 'uiComponents/Button';
import {
  IToken,
  IWorkflowInstance,
  AssetType,
} from '../AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';
import {
  API_RETRIEVE_ASSET_BY_ID,
  API_ASSET_INVESTORS_ALL_GET,
} from 'constants/apiRoutes';
import { IUser, IUserTokenData, IERC1400Balances } from 'User';
import {
  getTokenCurrency,
  getNextTransactionStatus,
  getProductFromToken,
  formatNumber,
  getClientName,
  getFundOverviewTabs,
  OVERVIEW_TABS,
} from 'utils/commonUtils';
import { colors } from 'constants/styles';
import { currencyFormat } from 'utils/currencyFormat';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { CommonTexts } from 'texts/commun/commonTexts';
import Address from 'uiComponents/Address';
import {
  QueryFunctionContext,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { tokenKeys } from 'constants/queryKeys';

import './FundInvestors.scss';

interface TableDataRow {
  investor: IUser;
  investorName: string;
  balanceShares: string;
  balanceAmount: string;
  pending: boolean;
  id: string;
  wallet: string;
}

export const FundInvestors: React.FC = () => {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const params = useParams<{ assetId: string }>();
  const loadData = async ({
    queryKey: [{ id, limit, offset }],
  }: QueryFunctionContext<ReturnType<typeof tokenKeys['investors']>>) => {
    try {
      const { token }: { token: IToken } = await DataCall({
        method: API_RETRIEVE_ASSET_BY_ID.method,
        path: API_RETRIEVE_ASSET_BY_ID.path(id),
        urlParams: {
          withBalances: true,
        },
      });

      const { users: investors, total }: { users: IUser[]; total: number } =
        await DataCall({
          method: API_ASSET_INVESTORS_ALL_GET.method,
          path: API_ASSET_INVESTORS_ALL_GET.path(id),
          urlParams: {
            offset,
            limit,
            withBalances: true,
          },
        });

      const { shareClasses, assetType } = getProductFromToken(token);

      const data = investors.map((investor) => {
        const tokenActions = (investor.tokenRelatedData as IUserTokenData)
          .tokenActions;

        const isPending = hasPendingTokenAction(tokenActions || []);

        const tokenRelatedData = investor.tokenRelatedData as IUserTokenData;

        const balances = tokenRelatedData.balances as IERC1400Balances;

        const shares = balances ? balances.total : 0;

        const nav =
          assetType === AssetType.CURRENCY
            ? 1
            : shareClasses[0].nav?.value || 0;

        const amount = currencyFormat(
          shares * nav,

          getTokenCurrency(token),
        );

        return {
          id: investor.id,
          investor,
          investorName: getClientName(investor),
          balanceShares: formatNumber(shares),
          balanceAmount: amount,
          pending: isPending,
          wallet: investor.defaultWallet,
        } as TableDataRow;
      });
      return {
        token,
        shareClasses,
        investors,
        total,
        isLoading: false,
        data: [...data],
        rowsUpdating: [],
      };
    } catch (error) {
      throw error;
    }
  };

  const { data, isLoading, isError, isFetching, isPreviousData } = useQuery(
    tokenKeys.investors(params.assetId, limit, offset),
    loadData,
    {
      keepPreviousData: true,
      onSuccess: (data) => {
        checkPendingTokenActions(data.investors);
      },
    },
  );

  const checkPendingTokenActions = (investors: Array<IUser>) => {
    for (const investor of investors) {
      const tokenActions = (investor.tokenRelatedData as IUserTokenData)
        .tokenActions;
      const isPending = hasPendingTokenAction(tokenActions || []);
      if (isPending) {
        queryClient.invalidateQueries(
          tokenKeys.investors(params.assetId, limit, offset),
        );
        break;
      }
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

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return <PageError />;
  }

  return (
    <div className="_route_issuer_fundInvestors">
      <PageTitle
        title={data.token.name}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabNavigation={getFundOverviewTabs(
          params.assetId,
          data.shareClasses.length > 1,
          data.token.assetData?.type as string,
          intl,
          OVERVIEW_TABS.INVESTORS,
        )}
        tabActions={[
          {
            label: intl.formatMessage(
              fundInvestorsMessages.investorsListManageInvestors,
            ),
            href: CLIENT_ROUTE_ASSET_MANAGE_INVESTORS.pathBuilder({
              assetId: params.assetId,
            }),
          },
        ]}
      />
      <main>
        <TablePaginated
          serverSidePagination={{
            totalRows: data.total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          tableSettingsId="fundInvestors"
          isLoading={isFetching && isPreviousData}
          defaultColumnsHidden={[]}
          TableTitle={intl.formatMessage(
            fundInvestorsMessages.investorsListTitle,
          )}
          data={data.data}
          translations={{
            emptyTitle: intl.formatMessage(
              fundInvestorsMessages.investorsListEmpty,
            ),
            emptyDescription: intl.formatMessage(
              fundInvestorsMessages.investorsListEmptyDesc,
            ),
          }}
          fetchData={(data: TableFetchDataType) => {
            setLimit(data.pageSize);
            setOffset(data.pageSize * data.pageIndex);
          }}
          columns={[
            {
              Header: intl.formatMessage(
                fundInvestorsMessages.investorsListHeaderInvestor,
              ),
              accessor: 'investorName',
              disableSortBy: true,
              Cell: ({ row: { original } }: any) =>
                getClientName(original.investor),
              getCellExportValue: ({ original }: any) =>
                getClientName(original.investor),
            },
            {
              accessor: () => 'address',
              Header: 'Address',
              width: 185,
              // eslint-disable-next-line
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) =>
                original.wallet ? <Address address={original.wallet} /> : null,
            },
            {
              Header: intl.formatMessage(
                fundInvestorsMessages.investorsListHeaderBalanceAmount,
              ),
              accessor: 'balanceAmount',
              disableSortBy: true,
              noPadding: true,
              // eslint-disable-next-line
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) => {
                if (
                  original.pending ||
                  (data.rowsUpdating as string[]).includes(original.id)
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
                  <div style={{ padding: '14px 16px' }}>
                    {original.balanceAmount}
                  </div>
                );
              },
            },
            {
              Header: intl.formatMessage(
                fundInvestorsMessages.investorsListHeaderBalanceQuantity,
              ),
              accessor: 'balanceShares',
              disableSortBy: true,
              noPadding: true,
              // eslint-disable-next-line
              Cell: ({
                row: { original },
              }: {
                row: { original: TableDataRow };
              }) => {
                if (
                  original.pending ||
                  (data.rowsUpdating as string[]).includes(original.id)
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
                  <div style={{ padding: '14px 16px' }}>
                    {original.balanceShares}
                  </div>
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
              disableExport: true,
              noPadding: true,
              width: 250,
              // eslint-disable-next-line
              Cell: ({
                row: {
                  original: { investor, pending, id },
                },
              }: any) => {
                const updating =
                  pending || (data.rowsUpdating as string[]).includes(id);

                return (
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Button
                      disabled={updating}
                      tertiary
                      label={intl.formatMessage(
                        fundInvestorsMessages.investorsListActionsView,
                      )}
                      size="small"
                      href={CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
                        investorId: investor.id,
                      })}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </main>
    </div>
  );
};
