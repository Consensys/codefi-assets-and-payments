import React, { useEffect } from 'react';
import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import {
  CLIENT_ROUTE_INVESTOR_PROFILE,
  CLIENT_ROUTE_ASSET_SHARECLASSES,
} from 'routesList';

import './FundShareClass.scss';
import { TimeSeriesLargeGraph } from 'uiComponents/TimeSeriesLargeGraph';
import { ValueVariationIndicator } from 'uiComponents/ValueVariationIndicator';
import { PaginatedDataListCard } from 'uiComponents/PaginatedDataListCard';
import { RouteComponentProps } from 'react-router-dom';
import { IToken, IWorkflowInstance } from '../AssetIssuance/templatesTypes';
import { DataCall } from 'utils/dataLayer';
import {
  API_RETRIEVE_ASSET_BY_ID,
  API_LIST_ALL_ACTIONS,
  API_ASSET_INVESTORS_ALL_GET,
} from 'constants/apiRoutes';
import { IUser, IUserTokenData, IERC1400Balances } from 'User';
import Button from 'uiComponents/Button';
import Icon from 'uiComponents/Icon';
import { mdiAccountSupervisor } from '@mdi/js';
import { useDispatch } from 'react-redux';
import { appModalData } from 'uiComponents/AppModal/AppModal';
import AddInvestorsDialog from '../FundInvestors/dialogs/AddInvestorsDialog';
import TransferBalanceDialog from '../FundInvestors/dialogs/TransferBalanceDialog';
import UpdateBalanceDialog from '../FundInvestors/dialogs/UpdateBalanceDialog';
import {
  formatDate,
  getProductFromToken,
  getClientName,
} from 'utils/commonUtils';
import { currencyFormat } from 'utils/currencyFormat';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { commonActionsTexts } from 'texts/commun/actions';
import { fundOverviewTexts, fundsTexts } from 'texts/routes/issuer/funds';
import { ClassData } from '../AssetIssuance/assetTypes';
import { useState } from 'react';
import { setAppModal } from 'features/user/user.store';
import { useCallback } from 'react';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{
      assetId: string;
      shareClassId: string;
    }> {}

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  token?: IToken;
  shareClass?: ClassData;
  actions: Array<IWorkflowInstance>;
}

const FundShareClassBase: React.FC<IProps> = ({ intl, match }) => {
  const dispatch = useDispatch();
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    actions: [],
  });

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));
      const { token } = await DataCall({
        method: API_RETRIEVE_ASSET_BY_ID.method,
        path: API_RETRIEVE_ASSET_BY_ID.path(match.params.assetId),
        urlParams: {
          withBalances: true,
          assetClass: match.params.shareClassId,
        },
      });

      const { users: investors }: { users: IUser[] } = await DataCall({
        method: API_ASSET_INVESTORS_ALL_GET.method,
        path: API_ASSET_INVESTORS_ALL_GET.path(match.params.assetId),
        urlParams: {
          withBalances: true,
          assetClass: match.params.shareClassId,
        },
      });
      token.investors = investors;

      const { shareClasses } = getProductFromToken(token);

      const { actions }: { actions: Array<IWorkflowInstance> } = await DataCall(
        {
          method: API_LIST_ALL_ACTIONS.method,
          path: API_LIST_ALL_ACTIONS.path(),
          urlParams: {
            offset: 0,
            limit: 10,
            tokenId: match.params.assetId,
          },
        },
      );

      setState((s) => ({
        ...s,
        token,
        shareClass: shareClasses[0],
        actions: actions.filter(
          (action) => action.assetClassKey === match.params.shareClassId,
        ),
        isLoading: false,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  }, [match.params.assetId, match.params.shareClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    params: { assetId },
  } = match;

  if (state.hasLoadingError) {
    return <PageError />;
  }

  if (state.isLoading || !state.token || !state.shareClass) {
    return <PageLoader />;
  }

  return (
    <div className="_route_issuer_shareClass">
      <PageTitle
        title={state.token.name}
        backLink={{
          label: intl.formatMessage(fundsTexts.allShareClasses),
          to: CLIENT_ROUTE_ASSET_SHARECLASSES.pathBuilder({
            assetId,
          }),
        }}
      />

      <main>
        <div className="topData">
          <TimeSeriesLargeGraph
            title={intl.formatMessage(fundsTexts.navPrice)}
            baseline={
              <span style={{ display: 'flex' }}>
                <span
                  style={{
                    marginRight: '10px',
                    fontSize: '20px',
                    fontWeight: 600,
                  }}
                >
                  {currencyFormat(0)}
                </span>
                <ValueVariationIndicator
                  variation={'neutral'}
                  variationLabel={'45%'}
                />
              </span>
            }
            className="graph"
          />
        </div>

        <PaginatedDataListCard
          title={intl.formatMessage(fundsTexts.transactions)}
          colHeaders={[
            intl.formatMessage(fundOverviewTexts.investor),
            intl.formatMessage(fundOverviewTexts.recentTransactionsType),
            intl.formatMessage(fundOverviewTexts.recentTransactionsDate),
            intl.formatMessage(fundOverviewTexts.amountQuantity),
          ]}
          rows={state.actions.map((action) => {
            const matchInvestor = state.token?.investors?.find(
              (user: any) => user.id === action.userId,
            );

            return [
              matchInvestor ? getClientName(matchInvestor) : '-',
              action.name,
              formatDate(new Date(action.date)),
              action.price
                ? currencyFormat(action.price)
                : `${action.quantity} shares`,
            ];
          })}
        />

        <PaginatedDataListCard
          title={intl.formatMessage(fundInvestorsMessages.investors)}
          colHeaders={[
            intl.formatMessage(
              fundInvestorsMessages.investorsListHeaderInvestor,
            ),
            intl.formatMessage(fundInvestorsMessages.shareClass),
            intl.formatMessage(
              fundInvestorsMessages.investorsListHeaderBalanceQuantity,
            ),
            intl.formatMessage(
              fundInvestorsMessages.investorsListHeaderBalanceAmount,
            ),
          ]}
          actionComponent={
            <Button
              label={intl.formatMessage(
                fundInvestorsMessages.investorsListAddInvestors,
              )}
              size="small"
              onClick={() => {
                dispatch(
                  setAppModal(
                    appModalData({
                      title: intl.formatMessage(
                        fundInvestorsMessages.investorsListAddInvestors,
                      ),
                      content: (
                        <AddInvestorsDialog
                          token={state.token as IToken}
                          investors={[]}
                          callback={loadData}
                        />
                      ),
                      closeIcon: true,
                      noPadding: true,
                    }),
                  ),
                );
              }}
            />
          }
          emptyStateComponent={
            <div className="emptyState">
              <Icon
                icon={mdiAccountSupervisor}
                width={80}
                color="#6699FF"
                style={{
                  background: 'rgb(140, 188, 255, 0.25)',
                  borderRadius: '40px',
                  padding: '10px',
                }}
              />
              <h2>
                {intl.formatMessage(fundInvestorsMessages.investorsListEmpty)}
              </h2>
              <p>
                {intl.formatMessage(
                  fundInvestorsMessages.investorsListEmptyDesc,
                )}
              </p>
            </div>
          }
          rows={(state.token.investors || []).map((investor) => {
            return [
              getClientName(investor),
              state.shareClass?.name || state.shareClass?.key,
              (
                (investor.tokenRelatedData as IUserTokenData)
                  .balances as IERC1400Balances
              ).total,
              '-',
              <div
                className="hidden"
                key={investor.id}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Button
                  tertiary
                  label={intl.formatMessage(commonActionsTexts.view)}
                  size="small"
                  href={CLIENT_ROUTE_INVESTOR_PROFILE.pathBuilder({
                    investorId: investor.id,
                  })}
                />
                <Button
                  tertiary
                  label={intl.formatMessage(commonActionsTexts.transfer)}
                  onClick={() => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(
                            commonActionsTexts.transfer,
                          ),
                          content: (
                            <TransferBalanceDialog
                              token={state.token as IToken}
                              investor={investor}
                              investors={[]}
                              callback={() => {
                                loadData();
                              }}
                            />
                          ),
                          closeIcon: true,
                          noPadding: true,
                        }),
                      ),
                    );
                  }}
                  size="small"
                />
                <Button
                  tertiary
                  label={intl.formatMessage(commonActionsTexts.update)}
                  onClick={() => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(
                            commonActionsTexts.updateBalance,
                          ),
                          content: (
                            <UpdateBalanceDialog
                              token={state.token as IToken}
                              investor={investor}
                              callback={() => {
                                loadData();
                              }}
                            />
                          ),
                          closeIcon: true,
                          noPadding: true,
                        }),
                      ),
                    );
                  }}
                  size="small"
                />
              </div>,
            ];
          })}
        />
      </main>
    </div>
  );
};

export const FundShareClass = injectIntl(FundShareClassBase);
