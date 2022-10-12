import React, { useEffect, useState } from 'react';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import { CLIENT_ROUTE_ASSET_OVERVIEW } from 'routesList';
import { RouteComponentProps } from 'react-router-dom';
import { DataCall } from 'utils/dataLayer';
import {
  API_FETCH_ASSET_DATA,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import {
  IAssetTemplate,
  ITopSection,
  ISection,
} from '../AssetIssuance/insuanceDataType';
import AssetCreationForm from '../AssetIssuance/components/AssetCreationForm';
import { getNextTransactionStatus } from 'utils/commonUtils';

import { AssetType, IToken } from '../AssetIssuance/templatesTypes';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { fundInfoMessages } from 'texts/routes/issuer/assetManagement';
import { TxStatus } from 'Transaction';
import { AssetCreationFlow } from '../AssetIssuance/assetTypes';
import { useCallback } from 'react';

interface IProps
  extends WrappedComponentProps,
    RouteComponentProps<{ assetId: string }> {}

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  token?: IToken;
  template?: IAssetTemplate;
  generalSection?: ITopSection;
}

const FundInfosComponent: React.FC<IProps> = ({ intl, match }) => {
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

      const { assetData: template }: { assetData: IAssetTemplate } =
        await DataCall({
          method: API_FETCH_ASSET_DATA.method,
          path: API_FETCH_ASSET_DATA.path(),
          urlParams: {
            templateId: token.assetTemplateId,
            tokenId: match.params.assetId,
          },
        });

      const firstTopSection = template?.topSections?.[0];

      if (!firstTopSection) {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasLoadingError: true,
        }));
        return;
      }

      if (template.type === AssetType.CURRENCY) {
        const allSections = template?.topSections.reduce(
          (acc: ISection[], curr) => [...acc, ...curr.sections],
          [],
        );
        setState((s) => ({
          ...s,
          token,
          template,
          generalSection: { ...firstTopSection, sections: allSections },
          isLoading: false,
        }));
      } else {
        setState((s) => ({
          ...s,
          token,
          template,
          generalSection: firstTopSection,
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        hasLoadingError: true,
      }));
    }
  }, [match.params.assetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    params: { assetId },
  } = match;

  if (state.isLoading) {
    return <PageLoader />;
  }

  if (
    state.hasLoadingError ||
    !state.token ||
    !state.template ||
    !state.generalSection
  ) {
    return <PageError />;
  }

  const nextTransactionStatus = getNextTransactionStatus(state.token.data);
  const isDeployed =
    !!state.token.defaultDeployment &&
    nextTransactionStatus !== TxStatus.PENDING &&
    nextTransactionStatus !== TxStatus.PROCESSING &&
    nextTransactionStatus !== TxStatus.REVERTED &&
    nextTransactionStatus !== TxStatus.FAILED;

  const isMultipartiteFlow =
    state.token.data.assetCreationFlow === AssetCreationFlow.TRI_PARTY ||
    state.token.data.assetCreationFlow === AssetCreationFlow.BI_PARTY;
  const workflowInstanceState = state.token.data.worflowInstanceState;

  return (
    <div>
      <PageTitle
        title={state.token.name}
        backLink={{
          label: intl.formatMessage(fundInfoMessages.title),
          to: CLIENT_ROUTE_ASSET_OVERVIEW.pathBuilder({
            assetId,
          }),
        }}
      />

      <AssetCreationForm
        token={state.token}
        template={state.template}
        users={[]}
        generalSection={state.generalSection}
        isDeployed={isDeployed}
        isMultipartiteFlow={isMultipartiteFlow}
        workflowInstanceState={workflowInstanceState}
        combineSections={state.template.type === AssetType.CURRENCY}
      />
    </div>
  );
};

export const FundInfos = injectIntl(FundInfosComponent);
