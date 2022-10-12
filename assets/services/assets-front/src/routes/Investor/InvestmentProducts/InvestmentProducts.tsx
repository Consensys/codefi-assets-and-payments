import { AssetType, IToken } from 'routes/Issuer/AssetIssuance/templatesTypes';
import {
  IPaginationProperties,
  buildPaginationOptions,
} from 'uiComponents/Pagination/paginationUtils';
import { API_ASSET_ALL_GET, API_DELETE_ASSET } from 'constants/apiRoutes';
import AssetCard from 'uiComponents/AssetCard';
import { DataCall } from 'utils/dataLayer';
import {
  InvestmentProductsTexts,
  InvestmentProductTexts,
} from 'texts/routes/investor/InvestmentProduct';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import Pagination from 'uiComponents/Pagination';
import React, { useState } from 'react';
import StyledInvestmentProducts from './StyledInvestmentProducts';
import UndrawOnboarding from 'uiComponents/UndrawOnboarding';
import { CompactView } from '../../../assets/svgs/compactview';
import { Column, CellProps } from 'react-table';
import ViewSwitcher from 'uiComponents/ViewSwitcher';
import {
  mdiAlertOctagon,
  mdiDotsHorizontal,
  mdiViewGrid,
  mdiViewList,
} from '@mdi/js';
import {
  computeAuM,
  getNextTransactionStatus,
  getTokenCurrency,
} from 'utils/commonUtils';
import { TxStatus } from 'Transaction';
import clsx from 'clsx';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { currencyFormat } from 'utils/currencyFormat';
import { hasRole } from 'utils/HasRole';
import { IUser, UserType } from 'User';
import {
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ISSUER_ASSET_CREATION,
} from 'routesList';
import { useSelector } from 'react-redux';
import { CommonTexts } from 'texts/commun/commonTexts';
import Dropdown from 'uiComponents/Dropdown';
import { clientListMessages } from 'texts/routes/issuer/clientList';
import { colors } from 'constants/styles';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { Link } from 'react-router-dom';
import { AssetData } from 'routes/Issuer/AssetIssuance/assetTypes';
import { Table } from 'uiComponents/Table';
import { useIntl } from 'react-intl';
import { useEffect } from 'react';
import { userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { useCallback } from 'react';

const NO_FILTER = '_all';

interface IState extends IPaginationProperties {
  isLoading: boolean;
  hasLoadingError: boolean;
  currentFilter: AssetType | string;
  tokens: Array<IToken>;
  assetTypes: Array<AssetType>;
}

export const InvestmentProducts: React.FC = () => {
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    currentFilter: NO_FILTER,
    tokens: [],
    assetTypes: [],
    offset: 0,
    total: 0,
    limit: 10,
    actions: [],
  });
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;

  const loadData = useCallback(async () => {
    //we need to get the user type and if the user is an investor
    //get only deployed loans
    //The deployed argument will be taking into account in assets-api only if ENABLE_TOKEN_DISCOVERY = true in the tenant config
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));
      const { tokens, total }: { tokens: Array<IToken>; total: number } =
        await DataCall({
          method: API_ASSET_ALL_GET.method,
          path: API_ASSET_ALL_GET.path(),
          urlParams: {
            offset: state.offset,
            limit: state.limit,
            withBalances: false,
            withCycles: true,
            ...(user.userType === UserType.INVESTOR && { deployed: true }), //add deployed true only if we are in investment product tab and the user is investor
          },
        });
      const { actions } = buildPaginationOptions(
        total,
        state.limit,
        (offset: number) => setState((s) => ({ ...s, offset })),
      );
      setState((s) => ({
        ...s,
        tokens: tokens.reduce((acc, token) => {
          if (!acc.find((accToken) => accToken.id === token.id)) {
            acc = [...acc, token];
          }
          return acc;
        }, [] as IToken[]),
        assetTypes: Array.from(
          new Set(
            tokens
              .map((token) => (token.assetData as AssetData)?.type)
              .filter((t) => !!t),
          ),
        ),
        total,
        actions,
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
  }, [state.limit, state.offset, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  let filteredAssets: Array<IToken> = state.tokens;
  const getStatus = (status: string) => {
    switch (status) {
      case TxStatus.PENDING:
      case TxStatus.PROCESSING:
        return intl.formatMessage(assetCardMessages.pending);
      case TxStatus.VALIDATED:
        return intl.formatMessage(assetCardMessages.deployed);
      case TxStatus.REVERTED:
        return intl.formatMessage(assetCardMessages.deploymentFailed);
      case TxStatus.FAILED:
        return intl.formatMessage(assetCardMessages.deploymentFailed);
      default:
        return intl.formatMessage(assetCardMessages.draft);
    }
  };
  const renderAction = (token: IToken) => {
    if (!token.assetData) {
      return <div></div>;
    }

    const options = [];
    const nextTransactionStatus = getNextTransactionStatus(token.data);
    const isTransactionPendingOrProcessing =
      nextTransactionStatus === TxStatus.PENDING ||
      nextTransactionStatus === TxStatus.PROCESSING;
    const isTransactionRevertedOrFailed =
      nextTransactionStatus === TxStatus.REVERTED ||
      nextTransactionStatus === TxStatus.FAILED;
    const isDraft =
      !token.defaultDeployment &&
      !isTransactionRevertedOrFailed &&
      !isTransactionPendingOrProcessing;
    if (isDraft) {
      options.push(
        {
          label: intl.formatMessage(assetCardMessages.continueAssetCreation),
          href: CLIENT_ROUTE_ISSUER_ASSET_CREATION.pathBuilder(token.id),
        },
        {
          label: intl.formatMessage(assetCardMessages.removeAsset),
          onClick: async () => {
            try {
              await DataCall({
                method: API_DELETE_ASSET.method,
                path: API_DELETE_ASSET.path(token.id),
              });
              loadData();
            } catch (error) {
              EventEmitter.dispatch(
                Events.EVENT_APP_MESSAGE,
                appMessageData({
                  message: intl.formatMessage(
                    assetCardMessages.removeAssetError,
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
      );
    } else {
      return (
        <Link
          style={{
            color: colors.main,
          }}
          to={
            hasRole(user, [UserType.INVESTOR, UserType.UNDERWRITER])
              ? CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
                  assetId: token.id,
                })
              : CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
                  assetId: token.id,
                })
          }
        >
          {intl.formatMessage(clientListMessages.view)}
        </Link>
      );
    }
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-end',
        }}
      >
        <Dropdown
          size="small"
          iconLeft={mdiDotsHorizontal}
          data={token}
          options={options}
        />
      </div>
    );
  };
  const columns: Column<IToken>[] = [
    {
      accessor: 'name',
      Header: intl.formatMessage(CommonTexts.asset),
    },
    {
      accessor: 'symbol',
      Header: intl.formatMessage(assetCardMessages.symbol),
    },
    {
      accessor: () => 'status',
      Header: intl.formatMessage(assetCardMessages.status),
      minWidth: 170,
      Cell: (item: CellProps<IToken, string>) => {
        const nextTransactionStatus = getNextTransactionStatus(
          item.row.original.data,
        );
        const isTransactionPendingOrProcessing =
          nextTransactionStatus === TxStatus.PENDING ||
          nextTransactionStatus === TxStatus.PROCESSING;
        const isTransactionRevertedOrFailed =
          nextTransactionStatus === TxStatus.REVERTED ||
          nextTransactionStatus === TxStatus.FAILED;
        const isDraft =
          !item.row.original.defaultDeployment &&
          !isTransactionRevertedOrFailed &&
          !isTransactionPendingOrProcessing;
        const isDeprecated = !!item.row.original.data.deprecatedChainId;
        return (
          <span
            className={clsx(
              'status',
              isDraft
                ? 'draft'
                : {
                    pending:
                      !isTransactionRevertedOrFailed &&
                      isTransactionPendingOrProcessing &&
                      !isDeprecated,
                    deployed:
                      !isTransactionRevertedOrFailed &&
                      !isTransactionPendingOrProcessing &&
                      !isDeprecated,
                    reverted: isTransactionRevertedOrFailed && !isDeprecated,
                    deprecated: isDeprecated,
                  },
            )}
          >
            {isDeprecated
              ? intl.formatMessage(assetCardMessages.deprecated)
              : getStatus(nextTransactionStatus)}
          </span>
        );
      },
    },
    {
      accessor: (asset) => getTokenCurrency(asset),
      Header: intl.formatMessage(InvestmentProductTexts.currency),
    },

    {
      accessor: (asset) =>
        currencyFormat(computeAuM(asset), getTokenCurrency(asset)),
      Header: intl.formatMessage(CommonTexts.asset),
    },
    {
      accessor: 'id',
      Header: '',
      width: 40,
      Cell: (data) => renderAction(data.row.original),
    },
  ];
  if (state.currentFilter !== NO_FILTER) {
    filteredAssets = state.tokens.filter(
      (asset: IToken) =>
        (asset.assetData as AssetData)?.type === state.currentFilter,
    );
  }

  if (state.hasLoadingError) {
    return <PageError />;
  }

  return (
    <StyledInvestmentProducts>
      <PageTitle
        title={intl.formatMessage(
          InvestmentProductsTexts.investmentProductsTitle,
        )}
      />

      {state.isLoading && <PageLoader />}

      {!state.isLoading && (
        <>
          {state.tokens.length === 0 && (
            <div className="emptyState">
              <UndrawOnboarding />
              <h2>
                {intl.formatMessage(
                  InvestmentProductsTexts.investmentProductsTitle,
                )}
              </h2>
              <p>
                {intl.formatMessage(
                  InvestmentProductsTexts.investmentProductsTitleDesc,
                )}
              </p>
            </div>
          )}

          {state.tokens.length > 0 && (
            <>
              <ViewSwitcher
                viewKey="assetsView"
                views={[
                  {
                    name: intl.formatMessage(CommonTexts.card),
                    icon: mdiViewGrid,
                    component: (
                      <>
                        <main>
                          {filteredAssets.map((asset, index) => (
                            <AssetCard key={index} asset={asset} />
                          ))}
                        </main>
                        {state.total > state.limit && (
                          <footer>
                            <span>
                              {intl.formatMessage(
                                InvestmentProductsTexts.numberOfAssetsShowing,
                                {
                                  items:
                                    state.limit < state.total
                                      ? state.limit
                                      : state.total,
                                  total: state.total,
                                },
                              )}
                            </span>
                            <Pagination
                              currentPage={state.offset / state.limit}
                              actions={state.actions}
                            />
                          </footer>
                        )}
                      </>
                    ),
                  },
                  {
                    name: intl.formatMessage(CommonTexts.compact),
                    icon: CompactView,
                    component: (
                      <>
                        <main>
                          {filteredAssets.map((asset, index) => (
                            <AssetCard compact key={index} asset={asset} />
                          ))}
                        </main>
                        {state.total > state.limit && (
                          <footer>
                            <span>
                              {intl.formatMessage(
                                InvestmentProductsTexts.numberOfAssetsShowing,
                                {
                                  items:
                                    state.limit < state.total
                                      ? state.limit
                                      : state.total,
                                  total: state.total,
                                },
                              )}
                            </span>
                            <Pagination
                              currentPage={state.offset / state.limit}
                              actions={state.actions}
                            />
                          </footer>
                        )}
                      </>
                    ),
                  },
                  {
                    name: intl.formatMessage(CommonTexts.table),
                    icon: mdiViewList,
                    component: (
                      <>
                        <div style={{ padding: '24px 48px' }}>
                          <Table
                            hidePagination
                            columns={columns}
                            data={filteredAssets}
                          />
                        </div>
                        {state.total > state.limit && (
                          <footer style={{ marginTop: 0, borderTop: 'none' }}>
                            <span>
                              {intl.formatMessage(
                                InvestmentProductsTexts.numberOfAssetsShowing,
                                {
                                  items:
                                    state.limit < state.total
                                      ? state.limit
                                      : state.total,
                                  total: state.total,
                                },
                              )}
                            </span>
                            <Pagination
                              currentPage={state.offset / state.limit}
                              actions={state.actions}
                            />
                          </footer>
                        )}
                      </>
                    ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}
    </StyledInvestmentProducts>
  );
};
