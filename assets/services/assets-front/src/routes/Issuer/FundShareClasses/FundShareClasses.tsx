import React, { useEffect } from 'react';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import { ShareClassCard } from 'uiComponents/ShareClassCard';
import { CLIENT_ROUTE_ASSETS } from 'routesList';

import { RouteComponentProps } from 'react-router-dom';
import { API_RETRIEVE_ASSET_BY_ID } from 'constants/apiRoutes';
import { DataCall } from 'utils/dataLayer';
import { IToken } from '../AssetIssuance/templatesTypes';
import {
  getFundOverviewTabs,
  getProductFromToken,
  OVERVIEW_TABS,
} from 'utils/commonUtils';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { fundInvestorsMessages } from 'texts/routes/issuer/fundInvestor';
import { useState } from 'react';
import { useCallback } from 'react';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{ assetId: string }> {}

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  token?: IToken;
  data?: JSONObject;
}

const FundShareClassesClass: React.FC<IProps> = ({ intl, match }) => {
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
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
          withBalances: false,
        },
      });
      setState((s) => ({
        ...s,
        token,
        isLoading: false,
      }));
    } catch (error) {
      setState({
        isLoading: false,
        hasLoadingError: true,
      });
    }
  }, [match.params.assetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    params: { assetId },
  } = match;

  if (state.hasLoadingError) {
    return <PageError />;
  }

  if (state.isLoading || !state.token) {
    return <PageLoader />;
  }

  return (
    <div>
      <PageTitle
        title={state.token.name}
        backLink={{
          label: intl.formatMessage(fundInvestorsMessages.allAssets),
          to: CLIENT_ROUTE_ASSETS,
        }}
        tabNavigation={getFundOverviewTabs(
          assetId,
          true,
          state.token.assetData?.type as string,
          intl,
          OVERVIEW_TABS.OVERVIEW,
        )}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', padding: '32px 40px' }}>
        {getProductFromToken(state.token).shareClasses.map((shareClass) => (
          <ShareClassCard
            key={shareClass.key}
            assetClassData={shareClass}
            token={state.token as IToken}
            reloadData={loadData}
          />
        ))}
      </div>
    </div>
  );
};

export const FundShareClasses = injectIntl(FundShareClassesClass);
