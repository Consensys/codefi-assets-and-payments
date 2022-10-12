import React, { useState } from 'react';

import PageTitle from 'uiComponents/PageTitle';

import './CorporateActionsStyles.scss';
import { useIntl } from 'react-intl';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError/PageError';
import { DataCall } from 'utils/dataLayer';
import {
  API_ASSET_INVESTORS_ALL_GET,
  API_LIST_ALL_EVENTS,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import { AssetType, IWorkflowInstance } from '../AssetIssuance/templatesTypes';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import {
  CLIENT_ROUTE_ASSETS,
  CLIENT_ROUTE_ASSET_CORPORATE_ACTION_DETAILS,
} from 'routesList';
import { useParams, withRouter } from 'react-router-dom';
import { corporateActionsTexts } from 'texts/routes/issuer/corporateActions';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import AddCorporateActionsDialog from './dialogs/AddCorporateActionsDialog';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import { CommonTexts } from 'texts/commun/commonTexts';
import { Link } from 'react-router-dom';
import { colors } from 'constants/styles';
import {
  capitalizeFirstLetter,
  getFundOverviewTabs,
  getProductFromToken,
  getTokenCurrency,
  getWorkflowInstanceStatusStyle,
  OVERVIEW_TABS,
} from 'utils/commonUtils';
import { tableFilterOptions } from 'uiComponents/Table';
import moment from 'moment';
import { currencyFormat } from 'utils/currencyFormat';
import { fundOverviewTexts } from 'texts/routes/issuer/funds';
import { getConfig } from 'utils/configUtils';
import UpdateNavDialog from '../FundInvestors/dialogs/UpdateNavDialog';
import { QueryFunctionContext, useQuery } from '@tanstack/react-query';
import { tokenKeys } from 'constants/queryKeys';
import { IUser, UserType } from 'User';
import { useDispatch } from 'react-redux';

import { EventState, styleSettled, StyleSettling } from 'utils/eventStateUtils';
import { setAppModal } from 'features/user/user.store';

const CorporateActions: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const params = useParams<{ assetId: string }>();
  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [states, setStates] = useState<string>('');
  const [types, setTypes] = useState<string>('');
  const [investorsWithPositiveBalances, setInvestorsWithPositiveBalances] =
    useState<IUser[]>([]);
  const config = getConfig();
  const hasUpdateNavFeature = config.ENABLE_NAV_UPDATE;
  const selectedTypeFilterOptions = [
    {
      title: intl.formatMessage(corporateActionsTexts.coupon),
      value: 'coupon',
    },
    {
      title: intl.formatMessage(corporateActionsTexts.redemption),
      value: 'redemption',
    },
  ];

  const selectedStatusFilterOptions = [
    {
      title: intl.formatMessage(corporateActionsTexts.scheduled),
      value: 'SCHEDULED',
    },
    {
      title: intl.formatMessage(corporateActionsTexts.settled),
      value: 'SETTLED',
    },
    {
      title: intl.formatMessage(corporateActionsTexts.canceled),
      value: 'CANCELED',
    },
  ];

  const loadData = async ({
    queryKey: [{ id, limit, offset, states, types }],
  }: QueryFunctionContext<ReturnType<typeof tokenKeys['lifecycleEvents']>>) => {
    try {
      const { token } = await DataCall({
        method: API_RETRIEVE_ASSET_BY_ID.method,
        path: API_RETRIEVE_ASSET_BY_ID.path(id),
      });
      const { shareClasses } = getProductFromToken(token);
      const {
        events,
        total,
      }: { events: Array<IWorkflowInstance>; total: number } = await DataCall({
        method: API_LIST_ALL_EVENTS.method,
        path: API_LIST_ALL_EVENTS.path(),
        urlParams: {
          tokenId: id,
          states,
          types,
          offset,
          limit,
        },
      });

      const newData = events?.map((event) => {
        return {
          ...event,
          statusStyle: getWorkflowInstanceStatusStyle(event, false),
          viewLink: CLIENT_ROUTE_ASSET_CORPORATE_ACTION_DETAILS.pathBuilder({
            assetId: id,
            eventId: event.id || 1,
          }),
        };
      });

      //Calling this method to filter investors and leave only investors who has invested
      //in this asset
      const { users }: { users: IUser[] } = await DataCall({
        method: API_ASSET_INVESTORS_ALL_GET.method,
        path: API_ASSET_INVESTORS_ALL_GET.path((params as any).assetId),
        urlParams: {
          withBalances: true,
        },
      });
      const investors: IUser[] = users.filter((singleUser: IUser) => {
        return (
          singleUser.userType === UserType.INVESTOR &&
          singleUser.tokenRelatedData?.balances?.total !== 0
        );
      });

      setInvestorsWithPositiveBalances(investors);

      return {
        total,
        newData,
        token,
        shareClasses,
      };
    } catch (error) {
      throw error;
    }
  };

  const { data, isLoading, isError, isFetching, isPreviousData, refetch } =
    useQuery(
      tokenKeys.lifecycleEvents(params.assetId, limit, offset, states, types),
      loadData,
      {
        keepPreviousData: true,
      },
    );

  const isBondType = (token: any): boolean => {
    return token.assetData.type === AssetType.FIXED_RATE_BOND;
  };

  const getStyleByStatus = (original: any) => {
    const status = getStatus(original);
    if (status === EventState.SCHEDULED.toUpperCase()) {
      return original.statusStyle;
    }
    if (status === EventState.SETTLING.toUpperCase()) {
      return StyleSettling;
    }
    return styleSettled;
  };
  const getStatus = (original: any) => {
    const eventInvestors = original.data.eventInvestors;

    const states: Array<string> = eventInvestors.map(
      (investor: any) => investor.eventState,
    );

    if (new Set(states).size === 1) {
      return original.state.toUpperCase();
    }
    if (investorsWithPositiveBalances.length !== 0) {
      return EventState.SETTLING.toUpperCase();
    }
    return EventState.SETTLED.toUpperCase();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !data) {
    return <PageError />;
  }

  return (
    <div id="_routes_issuer_corporateActions">
      <PageTitle
        title={data.token?.name}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabNavigation={getFundOverviewTabs(
          params.assetId,
          data.shareClasses.length > 1,
          data.token.assetData?.type as string,
          intl,
          OVERVIEW_TABS.LIFECYCLE_EVENTS,
        )}
        tabActions={
          hasUpdateNavFeature && !isBondType(data.token)
            ? [
                {
                  label: intl.formatMessage(fundOverviewTexts.updateSharePrice),
                  secondary: true,
                  action: () => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(
                            fundOverviewTexts.updateSharePrice,
                          ),
                          content: (
                            <UpdateNavDialog
                              token={data.token}
                              callback={refetch}
                            />
                          ),
                          closeIcon: true,
                          noPadding: true,
                        }),
                      ),
                    );
                  },
                },
                {
                  label: intl.formatMessage(
                    corporateActionsTexts.newCorporateAction,
                  ),
                  action: () => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(
                            corporateActionsTexts.newCorporateAction,
                          ),
                          content: (
                            <AddCorporateActionsDialog
                              token={data.token}
                              callback={refetch}
                            />
                          ),
                          closeIcon: true,
                          noPadding: true,
                        }),
                      ),
                    );
                  },
                },
              ]
            : [
                {
                  label: intl.formatMessage(
                    corporateActionsTexts.newCorporateAction,
                  ),
                  action: () => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(
                            corporateActionsTexts.newCorporateAction,
                          ),
                          content: (
                            <AddCorporateActionsDialog
                              token={data.token}
                              callback={refetch}
                            />
                          ),
                          closeIcon: true,
                          noPadding: true,
                        }),
                      ),
                    );
                  },
                },
              ]
        }
      />
      <main>
        <TablePaginated
          serverSidePagination={{
            totalRows: data.total,
            pageSize: limit,
            currentPage: offset / limit,
          }}
          tableSettingsId="fundCorporateActions"
          isLoading={isFetching && isPreviousData}
          defaultColumnsHidden={[]}
          data={data.newData}
          fetchData={(newParams) => {
            const newFilters: Record<string, string> = {};
            newParams.filters.forEach((el) => {
              newFilters[el.id] =
                el.value.length > 0 ? JSON.stringify(el.value) : '';
            });
            setOffset(newParams.pageIndex * newParams.pageSize);
            setStates((newFilters.status || '').toLowerCase());
            setTypes((newFilters.type || '').toUpperCase());
            setLimit(newParams.pageSize);
          }}
          translations={{
            emptyTitle: intl.formatMessage(
              corporateActionsTexts.emptyEventsTitle,
            ),
            emptyDescription: intl.formatMessage(
              corporateActionsTexts.emptyEventsMessage,
            ),
          }}
          columns={[
            {
              Header: intl.formatMessage(corporateActionsTexts.type),
              accessor: 'type',
              width: 100,
              disableSortBy: false,
              Cell: ({ row: { original } }: any) =>
                capitalizeFirstLetter(original.data.eventType),
              getCellExportValue: (row: any) =>
                capitalizeFirstLetter(row.original.data.eventType),
              filter: tableFilterOptions,
              filterValues: selectedTypeFilterOptions,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.status),
              accessor: 'status',
              filter: tableFilterOptions,
              filterValues: selectedStatusFilterOptions,
              Cell: function statusItems({
                row: { original },
              }: {
                row: { original: any };
              }) {
                return (
                  <span
                    style={{
                      padding: '2px 8px',
                      margin: '6px 16px',
                      fontSize: 12,
                      borderRadius: 4,
                      ...getStyleByStatus(original),
                    }}
                  >
                    {getStatus(original)}
                  </span>
                );
              },
              disableSortBy: false,
              noPadding: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.settlement),
              accessor: 'settlement',
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                moment(original.data.settlementDate).format('YYYY-MM-DD'),
              disableSortBy: true,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.investors),
              accessor: 'investor',
              disableSortBy: true,
              Cell: ({ row: { original } }: { row: { original: any } }) =>
                investorsWithPositiveBalances.length,
              width: 100,
            },
            {
              Header: intl.formatMessage(corporateActionsTexts.amount),
              accessor: 'amount',
              disableSortBy: true,
              width: 100,
              Cell: ({ row: { original } }: { row: { original: any } }) => {
                return original.data.amount > 0
                  ? `${currencyFormat(
                      original.data.amount,
                      getTokenCurrency(data.token),
                    )}`
                  : '-';
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

export default withRouter(CorporateActions);
