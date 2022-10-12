import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { mdiAlertOctagon } from '@mdi/js';

import { IUser } from 'User';
import { AssetType, IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import { fundInvestorAssetsTexts } from 'texts/routes/issuer/fundInvestor';

import { DataCall } from 'utils/dataLayer';
import {
  getClientName,
  getTokenShareClassName,
  getTokenShareClassKey,
  getProductFromToken,
  getTokenBalance,
} from 'utils/commonUtils';
import { IPaginationProperties } from 'uiComponents/Pagination/paginationUtils';
import PageError from 'uiComponents/PageError';
import {
  API_FETCH_USER_BY_ROLE,
  API_ASSET_ALL_GET,
  API_ALLOWLIST_TOKEN_RELATED_KYC,
  API_RETRIEVE_FEE,
  API_REMOVE_TOKEN_RELATED_KYC,
} from 'constants/apiRoutes';

import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import { colors } from 'constants/styles';
import './FundInvestorAssetsFees.scss';
import { CLIENT_ROUTE_INVESTOR_ASSETS } from 'routesList';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { TableFetchDataType } from 'uiComponents/Table';
import { TablePaginated } from 'uiComponents/TablePaginated/TablePaginated';
import Loader from 'uiComponents/Loader';
import Address from 'uiComponents/Address';
import Checkbox from 'uiComponents/Checkbox';
import { useSelector } from 'react-redux';
import { userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IRow {
  key: string;
  asset: string;
  isInvestorInvitedForToken: boolean;
  doesInvestorHoldToken: boolean;
  assetType: AssetType;
  disableRowToggle: boolean;
  isSelected: boolean;
  wallet: string;
}

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{
      investorId: string;
    }> {}

interface IState extends IPaginationProperties {
  isLoading: boolean;
  hasLoadingError: boolean;
  investor?: IUser;
  tokens: IToken[];
  selectedRowKeys: string[];
  feesMap: Map<string, number>;
  shareClassMap: Map<string, string>;
  data: IRow[];
  updating: Record<string, boolean>;
  updated: Record<string, boolean>;
}

const FundInvestorAssetsFeesClass: React.FC<IProps> = ({ intl, match }) => {
  /* public state: IState = {
    isLoading: true,
    hasLoadingError: false,
    tokens: [],
    offset: 0,
    total: 0,
    limit: 10,
    actions: [],
    selectedRowKeys: [],
    feesMap: new Map(),
    shareClassMap: new Map(),
    data: [],
    updating: {},
    updated: {},
  };
  public componentDidMount() {
    loadData();
  } */

  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    tokens: [],
    offset: 0,
    total: 0,
    limit: 10,
    actions: [],
    selectedRowKeys: [],
    feesMap: new Map(),
    shareClassMap: new Map(),
    data: [],
    updating: {},
    updated: {},
  });

  const user = useSelector(userSelector) as IUser;

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));

      const { user: investor }: { user: IUser } = await DataCall({
        method: API_FETCH_USER_BY_ROLE.method,
        path: API_FETCH_USER_BY_ROLE.path(match.params.investorId),
      });

      let { tokens, total }: { tokens: Array<IToken>; total: number } =
        await DataCall({
          method: API_ASSET_ALL_GET.method,
          path: API_ASSET_ALL_GET.path(),
          urlParams: {
            offset: state.offset,
            limit: state.limit,
          },
        });
      tokens = tokens.filter((token) => token.hasOwnProperty('totalSupply'));
      total = tokens.length;

      // fill shareClassMap
      const shareClassMap = new Map();
      tokens.forEach((token) => {
        shareClassMap.set(token.id, getTokenShareClassKey(token));
      });

      // fill feesMap
      const feesMap = new Map();
      await Promise.all(
        tokens.map(async (token) => {
          const tokenId = token.id;
          try {
            const { fees } = await DataCall({
              method: API_RETRIEVE_FEE.method,
              path: API_RETRIEVE_FEE.path(tokenId),
              urlParams: {
                assetClass: shareClassMap.get(tokenId),
                investorId: investor.id,
              },
            });
            feesMap.set(tokenId, fees.acquiredEntryFees);
          } catch (error) {
            const { shareClasses } = getProductFromToken(token);
            const shareClass = shareClasses.find(
              (sc) => sc.name === shareClassMap.get(tokenId),
            );
            feesMap.set(tokenId, shareClass?.fees.acquiredEntryFees);
          }
        }),
      );

      const { tokens: investorTokens } = await DataCall({
        method: API_ASSET_ALL_GET.method,
        path: API_ASSET_ALL_GET.path(),
        urlParams: {
          offset: state.offset,
          limit: state.limit,
          investorId: investor.id,
          withBalances: true,
        },
      });

      const investorTokensIds = new Set(
        investorTokens.map((token: IToken) => token.id) as string[],
      );

      // drop tokens in `tokens` that are in `investorTokens`, then merge the arrays
      const notInvestorTokens = tokens.filter(
        (tkn) => !investorTokensIds.has(tkn.id),
      );
      const allTokens = investorTokens.concat(notInvestorTokens);

      // fill table data
      const data: IRow[] = [];
      allTokens.forEach((token: any) => {
        const { assetType } = getProductFromToken(token);
        const isInvestorInvitedForToken = investorTokensIds.has(token.id);
        data.push({
          key: token.id,
          asset: `${token.name} - ${getTokenShareClassName(token)}`,
          assetType,
          isInvestorInvitedForToken,
          doesInvestorHoldToken: isInvestorInvitedForToken
            ? getTokenBalance(token) > 0
            : false,
          disableRowToggle: isInvestorInvitedForToken
            ? getTokenBalance(token) > 0
            : false,
          isSelected: isInvestorInvitedForToken,
          wallet: token.data.walletUsed.address,
        });
      });

      const selectedRowKeys = data
        .filter((item) => item.isInvestorInvitedForToken)
        .map((item) => item.key);

      setState((s) => ({
        ...s,
        tokens,
        total,
        investor,
        feesMap,
        shareClassMap,
        isLoading: false,
        hasLoadingError: false,
        data,
        selectedRowKeys,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        hasLoadingError: true,
        isLoading: false,
      }));
    }
  }, [match.params.investorId, state.limit, state.offset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.isLoading || !user || !state.investor) {
    return (
      <div className="_routes_issuer_fundInvestorAssetsFees">
        <PageTitle title={intl.formatMessage(fundInvestorAssetsTexts.title)} />
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError || !user || !state.investor) {
    return (
      <div className="_routes_issuer_fundInvestorAssetsFees">
        <PageTitle title={intl.formatMessage(fundInvestorAssetsTexts.title)} />
        <PageError />
      </div>
    );
  }

  return (
    <div className="_routes_issuer_fundInvestorAssetsFees">
      <PageTitle
        backLink={{
          label: intl.formatMessage(fundInvestorAssetsTexts.back),
          to: CLIENT_ROUTE_INVESTOR_ASSETS.pathBuilder({
            investorId: state.investor.id,
          }),
        }}
        title={intl.formatMessage(fundInvestorAssetsTexts.title)}
        subTitle={intl.formatMessage(fundInvestorAssetsTexts.subTitle, {
          user: getClientName(state.investor as IUser),
        })}
      />

      <main>
        <div>
          {intl.formatMessage(fundInvestorAssetsTexts.selectAssetsMessage)}
        </div>
        <TablePaginated
          serverSidePagination={{
            totalRows: state.total,
            pageSize: state.limit,
            currentPage: state.offset / state.limit,
          }}
          tableSettingsId="fundInvestorsAssetsFees"
          isLoading={state.isLoading}
          defaultColumnsHidden={[]}
          data={state.data}
          translations={{
            emptyTitle: intl.formatMessage(fundInvestorAssetsTexts.noAssets),
            emptyDescription: intl.formatMessage(
              fundInvestorAssetsTexts.noAssetsDescription,
            ),
          }}
          fetchData={(data: TableFetchDataType) => {
            setState((s) => ({
              ...s,
              offset: data.pageSize * data.pageIndex,
              limit: data.pageSize,
            }));
            loadData();
          }}
          columns={[
            {
              id: 'selectionRow',
              Header: '',
              Cell: ({ row: { original } }: { row: { original: IRow } }) => {
                const disabled =
                  original.disableRowToggle || state.updating[original.key];
                const checked =
                  state.updated[original.key] ?? original.isSelected;
                if (state.updating[original.key]) {
                  return (
                    <Loader
                      color={colors.main}
                      width={43}
                      style={{ display: 'block' }}
                    />
                  );
                }
                return (
                  <Checkbox
                    checked={checked}
                    color={disabled ? 'gray' : undefined}
                    onToggle={async (e) => {
                      if (disabled) {
                        return;
                      }
                      let callParams;
                      const newUpdating = { ...state.updating };
                      newUpdating[original.key] = true;
                      setState((s) => ({ ...s, updating: { ...newUpdating } }));
                      if (e) {
                        console.log(e, original);
                        callParams = {
                          method: API_ALLOWLIST_TOKEN_RELATED_KYC.method,
                          path: API_ALLOWLIST_TOKEN_RELATED_KYC.path(),
                        };
                      } else {
                        callParams = {
                          method: API_REMOVE_TOKEN_RELATED_KYC.method,
                          path: API_REMOVE_TOKEN_RELATED_KYC.path(),
                        };
                      }
                      try {
                        await DataCall({
                          ...callParams,
                          body: {
                            assetClass: state.shareClassMap.get(original.key),
                            submitterId: state.investor?.id,
                            tokenId: original.key,
                            sendNotification: true,
                          },
                        });
                        const newUpdated = { ...state.updated };
                        newUpdated[original.key] = e;
                        setState((s) => ({
                          ...s,
                          updated: newUpdated,
                        }));
                      } catch (error) {
                        EventEmitter.dispatch(
                          Events.EVENT_APP_MESSAGE,
                          appMessageData({
                            /* eslint-disable-next-line */
                            message: intl.formatMessage(
                              fundInvestorAssetsTexts.assetManagementError,
                            ),
                            secondaryMessage: String(error),
                            icon: mdiAlertOctagon,
                            color: colors.error,
                            isDark: true,
                          }),
                        );
                      } finally {
                        const newUpdating = { ...state.updating };
                        newUpdating[original.key] = false;
                        setState((s) => ({
                          ...s,
                          updating: { ...newUpdating },
                        }));
                      }
                    }}
                    style={{
                      marginLeft: '12px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  />
                );
              },
              minWidth: 36,
              width: 36,
              sticky: 'left',
              disableResizing: true,
              noPadding: true,
            },
            {
              Header: intl.formatMessage(
                fundInvestorAssetsTexts.assetsTableHeaderAsset,
              ),
              accessor: 'asset',
            },

            {
              accessor: () => 'address',
              Header: 'Address',
              width: 185,
              Cell: ({ row: { original } }: { row: { original: IRow } }) =>
                original.wallet ? <Address address={original.wallet} /> : null,
            },
          ]}
        />
      </main>
    </div>
  );
};

export const FundInvestorAssetsFees = injectIntl(FundInvestorAssetsFeesClass);
