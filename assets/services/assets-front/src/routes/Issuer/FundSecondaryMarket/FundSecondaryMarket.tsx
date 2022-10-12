import useToken from 'hooks/useToken';
import useActions from 'hooks/useActions';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import {
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_TRADES_ACCEPT,
  CLIENT_ROUTE_TRADES_CREATE,
  CLIENT_ROUTE_TRADES_DETAILS,
  CLIENT_ROUTE_TRADES_SETTLE,
} from 'routesList';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { fundOverviewTexts } from 'texts/routes/issuer/funds';
import PageTitle from 'uiComponents/PageTitle';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import {
  formatDate,
  getFundOverviewTabs,
  OVERVIEW_TABS,
  getProductFromToken,
  getWorkflowInstanceStatus,
  getWorkflowInstanceStatusStyle,
} from 'utils/commonUtils';
import PageWrapper from '../../../uiComponents/PageWrapper/PageWrapper';
import { Column, CellProps } from 'react-table';
import { IWorkflowInstance } from '../AssetIssuance/templatesTypes';
import Address from 'uiComponents/Address';
import { CommonTexts } from '../../../texts/commun/commonTexts';
import { Link } from 'react-router-dom';
import { colors } from 'constants/styles';
import { clientListMessages } from 'texts/routes/issuer/clientList';
import { tradesTexts } from 'texts/routes/issuer/trades';
import { Divider } from 'antd';
import { WorkflowStates } from 'texts/routes/common/workflow';

export const FundSecondaryMarket = () => {
  const intl = useIntl();
  const params = useParams<{ assetId: string }>();
  const { token, tokenLoading, tokenError } = useToken({
    id: params.assetId,
    withBalances: true,
  });
  const {
    actions,
    actionsLoading,
    actionsTotal,
    setPagination,
    limit,
    offset,
    isFetching,
    isPreviousData,
    actionsError,
  } = useActions({
    tokenId: params.assetId,
    functionNames: JSON.stringify([
      'holdTradeOrderDelivery',
      'forceCreatePaidTradeOrder',
      'settleAtomicTradeOrder',
    ]),
  });
  const product = useMemo(() => {
    if (token) return getProductFromToken(token);
    return undefined;
  }, [token]);

  const columns: Column<IWorkflowInstance>[] = useMemo(
    () => [
      {
        Header: intl.formatMessage(CommonTexts.status),
        accessor: (acc) =>
          product
            ? getWorkflowInstanceStatus(intl, acc, true, product.assetType)
            : '',
        // eslint-disable-next-line
        Cell: (item: CellProps<IWorkflowInstance, string>) => (
          <span
            style={{
              padding: '2px 8px',
              margin: '6px 16px',
              fontSize: 12,
              borderRadius: 4,
              ...getWorkflowInstanceStatusStyle(item.row.original, true),
            }}
          >
            {item.value}
          </span>
        ),
      },
      {
        Header: intl.formatMessage(fundOverviewTexts.recentTransactionsType),
        accessor: () => 'Trade',
      },
      {
        Header: 'From',
        // eslint-disable-next-line
        accessor: (val) =>
          val.metadata?.user?.defaultWallet ? (
            <Address address={val.metadata?.user?.defaultWallet} />
          ) : null,
      },
      {
        Header: 'To',
        // eslint-disable-next-line
        accessor: (val) =>
          val.metadata?.recipient?.defaultWallet ? (
            <Address address={val.metadata?.recipient?.defaultWallet} />
          ) : null,
      },
      {
        Header: intl.formatMessage(tradesTexts.deliveryQuantity),
        accessor: (acc) => acc.quantity,
      },
      {
        Header: intl.formatMessage(tradesTexts.paymentQuantity),
        accessor: (acc) => acc.price,
      },
      {
        Header: intl.formatMessage(fundOverviewTexts.recentTransactionsDate),
        accessor: (acc) => formatDate(new Date(acc.date)),
      },
      {
        Header: ' ',
        accessor: (acc) => acc.id,
        // eslint-disable-next-line
        Cell: (item: CellProps<IWorkflowInstance, string>) => (
          <>
            <Link
              style={{
                color: colors.main,
              }}
              to={CLIENT_ROUTE_TRADES_DETAILS.pathBuilder({
                tradeId: item.value + '',
              })}
            >
              {intl.formatMessage(clientListMessages.view)}
            </Link>
            {getWorkflowInstanceStatus(
              intl,
              item.row.original,
              true,
              product?.assetType,
            ) !== intl.formatMessage(WorkflowStates.settled) && (
              <>
                <Divider type="vertical" />
                <Link
                  style={{
                    color: colors.main,
                  }}
                  to={CLIENT_ROUTE_TRADES_SETTLE.pathBuilder({
                    orderId: String(item.value),
                  })}
                >
                  {intl.formatMessage(tradesTexts.settleLink)}
                </Link>
              </>
            )}
          </>
        ),
      },
    ],
    [intl, product],
  );

  return (
    <PageWrapper
      isLoading={tokenLoading || actionsLoading}
      isError={tokenError || actionsError || !token || !actions}
    >
      <PageTitle
        title={token?.name as string}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabNavigation={getFundOverviewTabs(
          params.assetId,
          !!product?.shareClasses?.length,
          token?.assetData?.type as string,
          intl,
          OVERVIEW_TABS.SECONDARY_MARKET,
        )}
        tabActions={[
          {
            label: intl.formatMessage(fundOverviewTexts.createTrade),
            secondary: false,
            href: CLIENT_ROUTE_TRADES_CREATE,
          },
          {
            label: intl.formatMessage(fundOverviewTexts.acceptTrade),
            secondary: true,
            href: CLIENT_ROUTE_TRADES_ACCEPT,
          },
        ]}
      />
      <main>
        <TablePaginated
          tableSettingsId="secondaryMarket"
          isLoading={isFetching && isPreviousData}
          columns={columns}
          data={actions}
          serverSidePagination={{
            totalRows: actionsTotal,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          fetchData={(data) => {
            setPagination(data.pageSize, data.pageSize * data.pageIndex);
          }}
        />
      </main>
    </PageWrapper>
  );
};
