import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import AssetCard from 'uiComponents/AssetCard';
import { fundsTexts } from 'texts/routes/issuer/funds';
import Button from 'uiComponents/Button';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import UndrawOnboarding from 'uiComponents/UndrawOnboarding';
import {
  CLIENT_ROUTE_ASSET_OVERVIEW,
  CLIENT_ROUTE_INVESTMENT_PRODUCT,
  CLIENT_ROUTE_ISSUER_ASSET_CREATION,
  CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
} from 'routesList';
import { Column, CellProps } from 'react-table';
import { IToken } from '../AssetIssuance/templatesTypes';

import Pagination from 'uiComponents/Pagination';
import {
  buildPaginationOptions,
  IPaginationProperties,
} from 'uiComponents/Pagination/paginationUtils';
import {
  computeAuM,
  getNextTransactionStatus,
  getTokenCurrency,
  getAssetName,
  getAssetSymbol,
} from 'utils/commonUtils';

import StyledFunds from './StyledFunds';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { useSelector } from 'react-redux';
import { CommonTexts } from 'texts/commun/commonTexts';
import { mdiDotsHorizontal, mdiViewGrid, mdiViewList } from '@mdi/js';
import { colors } from 'constants/styles';
import ViewSwitcher from 'uiComponents/ViewSwitcher';
import { Table } from 'uiComponents/Table';
import { hasRole } from 'utils/HasRole';
import { IUser, UserType } from 'User';
import { currencyFormat } from 'utils/currencyFormat';
import { TxStatus } from 'Transaction';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { CompactView } from '../../../assets/svgs/compactview';
import { InvestmentProductTexts } from '../../../texts/routes/investor/InvestmentProduct';
import clsx from 'clsx';
import Dropdown from 'uiComponents/Dropdown';
import { clientListMessages } from 'texts/routes/issuer/clientList';
import { Link } from 'react-router-dom';
import Address from 'uiComponents/Address';
import useTokens from 'hooks/useTokens';
import useRemoveToken from 'hooks/useRemoveToken';
import { tokenKeys } from 'constants/queryKeys';
import { AssetCreationFlow } from '../AssetIssuance/assetTypes';
import { userSelector } from 'features/user/user.store';

interface IProps extends WrappedComponentProps, RouteComponentProps {}

let timeout: number;
const Funds: React.FC<IProps> = ({ intl }: IProps) => {
  const user = useSelector(userSelector) as IUser;
  const [state, setState] = useState<Omit<IPaginationProperties, 'total'>>({
    offset: 0,
    limit: 10,
    actions: [],
  });
  const mutate = useRemoveToken(
    tokenKeys.funds(state.offset, state.limit, false, true, true),
  );

  useEffect(() => {
    return () => clearTimeout(timeout);
  }, [state.offset]);

  const { isLoading, isError, data, isFetching, isPreviousData, refetch } =
    useTokens(tokenKeys.funds(state.offset, state.limit, false, true, true));

  const actions = React.useMemo(() => {
    const { actions } = buildPaginationOptions(
      data?.total || 0,
      state.limit,
      (offset: number) => setState((s) => ({ ...s, offset })),
    );
    return actions;
  }, [data, state.limit]);
  const checkPendingStatus = (tokens: Array<IToken>) => {
    for (const token of tokens) {
      const nextTransactionStatus = getNextTransactionStatus(token.data);
      if (nextTransactionStatus === 'pending') {
        timeout = window.setTimeout(() => {
          refetch();
        }, 3000);
        return;
      }
    }
  };
  useEffect(() => {
    if (data?.tokens) {
      checkPendingStatus(data.tokens);
    }
    // eslint-disable-next-line
  }, [data?.tokens]);

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
    const isTransactionDeployed =
      token.data.worflowInstanceState === TxStatus.DEPLOYED;
    const isPreInitialized =
      token.data.worflowInstanceState === TxStatus.PREINITIALIZED &&
      !isTransactionDeployed;
    const isSubmitted =
      token.data.worflowInstanceState === TxStatus.SUBMITTED &&
      !isTransactionDeployed &&
      !isTransactionPendingOrProcessing;
    const isRejected =
      token.data.worflowInstanceState === TxStatus.REJECTED &&
      !isTransactionDeployed &&
      !isTransactionPendingOrProcessing;

    const isDraft =
      !token.defaultDeployment &&
      !isTransactionRevertedOrFailed &&
      !isTransactionPendingOrProcessing &&
      !isPreInitialized &&
      !isSubmitted &&
      !isRejected;

    let viewLink;
    if (
      (token.data.assetCreationFlow === AssetCreationFlow.TRI_PARTY ||
        AssetCreationFlow.BI_PARTY) &&
      !isTransactionDeployed
    ) {
      viewLink = CLIENT_ROUTE_ISSUER_ASSET_CREATION.pathBuilder(token.id);
    } else {
      if (hasRole(user, [UserType.INVESTOR, UserType.UNDERWRITER]))
        viewLink = CLIENT_ROUTE_INVESTMENT_PRODUCT.pathBuilder({
          assetId: token.id,
        });
      else
        viewLink = CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
          assetId: token.id,
        });
    }

    if (isDraft) {
      options.push(
        {
          label: intl.formatMessage(assetCardMessages.continueAssetCreation),
          href: CLIENT_ROUTE_ISSUER_ASSET_CREATION.pathBuilder(token.id),
        },
        {
          label: intl.formatMessage(assetCardMessages.removeAsset),
          onClick: () => mutate(token),
        },
      );
    } else {
      return (
        <Link
          style={{
            color: colors.main,
          }}
          to={viewLink}
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
  const columns: Column<IToken>[] = [
    {
      accessor: (asset) => getAssetName(asset),
      Header: intl.formatMessage(CommonTexts.asset),
    },
    {
      accessor: (asset) => getAssetSymbol(asset),
      Header: intl.formatMessage(assetCardMessages.symbol),
    },
    {
      accessor: () => 'address',
      Header: 'Address',
      width: 185,
      Cell: function addressCell(item: CellProps<IToken, string>) {
        return item.row.original.defaultDeployment ? (
          <Address address={item.row.original.defaultDeployment as string} />
        ) : null;
      },
    },
    {
      accessor: () => 'status',
      Header: intl.formatMessage(assetCardMessages.status),
      minWidth: 170,
      // eslint-disable-next-line
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
        const isTransactionDeployed =
          item.row.original.data.worflowInstanceState === TxStatus.DEPLOYED;
        const isPreInitialized =
          item.row.original.data.worflowInstanceState ===
            TxStatus.PREINITIALIZED && !isTransactionDeployed;
        const isSubmitted =
          item.row.original.data.worflowInstanceState === TxStatus.SUBMITTED &&
          !isTransactionDeployed &&
          !isTransactionPendingOrProcessing;
        const isRejected =
          item.row.original.data.worflowInstanceState === TxStatus.REJECTED &&
          !isTransactionDeployed &&
          !isTransactionPendingOrProcessing;
        const isDraft =
          !item.row.original.defaultDeployment &&
          !isTransactionRevertedOrFailed &&
          !isTransactionPendingOrProcessing &&
          !isPreInitialized &&
          !isSubmitted &&
          !isRejected;
        const isDeprecated = !!item.row.original.data.deprecatedChainId;
        return (
          <span
            className={clsx(
              'status',
              isDraft
                ? 'draft'
                : {
                    deployed: isTransactionDeployed,
                    pending:
                      !isTransactionRevertedOrFailed &&
                      isTransactionPendingOrProcessing &&
                      !isDeprecated &&
                      !isTransactionDeployed,
                    preInitialized: isPreInitialized,
                    submitted: isSubmitted,
                    rejected: isRejected,
                    reverted: isTransactionRevertedOrFailed && !isDeprecated,
                    deprecated: isDeprecated,
                  },
            )}
          >
            {isDeprecated
              ? // eslint-disable-next-line react/prop-types
                intl.formatMessage(assetCardMessages.deprecated)
              : isPreInitialized
              ? // eslint-disable-next-line react/prop-types
                intl.formatMessage(assetCardMessages.preInitialized)
              : isSubmitted
              ? // eslint-disable-next-line react/prop-types
                intl.formatMessage(assetCardMessages.submitted)
              : isRejected
              ? // eslint-disable-next-line react/prop-types
                intl.formatMessage(assetCardMessages.rejected)
              : isTransactionDeployed
              ? // eslint-disable-next-line react/prop-types
                intl.formatMessage(assetCardMessages.deployed)
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
      Header: intl.formatMessage(CommonTexts.totalValue),
    },
    {
      accessor: 'id',
      Header: '',
      width: 40,
      Cell: (data) => renderAction(data.row.original),
    },
  ];

  if (isLoading || (isFetching && isPreviousData)) {
    return (
      <StyledFunds>
        <PageTitle
          tabActions={
            user.userType !== UserType.ADMIN
              ? [
                  {
                    label: intl.formatMessage(fundsTexts.createAssetButton),
                    href: CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
                    size: 'big',
                  },
                ]
              : undefined
          }
          title={intl.formatMessage(fundsTexts.title)}
        />
        <PageLoader />
      </StyledFunds>
    );
  }

  if (isError) {
    return (
      <StyledFunds>
        <PageTitle
          title={intl.formatMessage(fundsTexts.title)}
          tabActions={
            user.userType !== UserType.ADMIN
              ? [
                  {
                    label: intl.formatMessage(fundsTexts.createAssetButton),
                    href: CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
                    size: 'big',
                  },
                ]
              : undefined
          }
        />
        <PageError />
      </StyledFunds>
    );
  }

  return (
    <StyledFunds>
      <PageTitle
        title={intl.formatMessage(fundsTexts.title)}
        tabActions={
          user.userType !== UserType.ADMIN
            ? [
                {
                  label: intl.formatMessage(fundsTexts.createAssetButton),
                  href: CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE,
                  size: 'big',
                },
              ]
            : undefined
        }
      />

      {data && data.tokens.length === 0 && (
        <div className="emptyState">
          <UndrawOnboarding />
          <h2>{intl.formatMessage(fundsTexts.noAssetsTitle)}</h2>
          <p>{intl.formatMessage(fundsTexts.noAssetsDesc)}</p>
          <Button
            label={intl.formatMessage(fundsTexts.createAssetButton)}
            href={CLIENT_ROUTE_ISSUER_ASSET_ISSUANCE}
          />
        </div>
      )}

      {data && data.tokens.length > 0 && (
        <div className="funds-wrapper">
          <ViewSwitcher
            viewKey="issuerFunds"
            views={[
              {
                name: intl.formatMessage(CommonTexts.card),
                icon: mdiViewGrid,
                component: (
                  <>
                    <div className="fundsContainer">
                      {data?.tokens.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          removeToken={mutate}
                        />
                      ))}
                    </div>
                  </>
                ),
              },
              {
                name: intl.formatMessage(CommonTexts.compact),
                icon: CompactView,
                component: (
                  <>
                    <div className="fundsContainer">
                      {data?.tokens.map((asset) => (
                        <AssetCard
                          compact
                          key={asset.id}
                          asset={asset}
                          removeToken={mutate}
                        />
                      ))}
                    </div>
                  </>
                ),
              },
              {
                name: intl.formatMessage(CommonTexts.table),
                icon: mdiViewList,
                component: (
                  <>
                    <div>
                      <Table
                        hidePagination
                        columns={columns}
                        data={data.tokens}
                      />
                    </div>
                  </>
                ),
              },
            ]}
          />
          {data.total > state.limit && (
            <footer
              style={{ marginTop: 0, borderTop: 'none' }}
              className="footer"
            >
              <span>
                {intl.formatMessage(fundsTexts.showingNumberOfAssets, {
                  visible: data.tokens.length,
                  total: data.total,
                })}
              </span>
              <Pagination
                currentPage={state.offset / state.limit}
                actions={actions}
              />
            </footer>
          )}
        </div>
      )}
    </StyledFunds>
  );
};

export default injectIntl(Funds);
