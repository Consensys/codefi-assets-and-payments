import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenKeys } from 'constants/queryKeys';
import { WrappedComponentProps, injectIntl, useIntl } from 'react-intl';
import './AssetIssuanceStyles.scss';
import { useSelector } from 'react-redux';
import {
  API_FETCH_ASSET_TEMPLATES,
  API_INITIALIZE_ASSET_DATA,
} from 'constants/apiRoutes';
import {
  AssetType,
  IIssuanceTemplate,
  IToken,
  IWorkflowInstance,
  OrderSide,
} from './templatesTypes';
import { IUser, UserType } from 'User';

import Button from 'uiComponents/Button';
import { CLIENT_ROUTE_ISSUER_ASSET_CREATION } from 'routesList';
import { Card } from 'uiComponents/Card';
import { DataCall } from 'utils/dataLayer';
import { ITenant } from 'types/Tenant';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import PageTitle from 'uiComponents/PageTitle';
import { TenantKeys } from 'constants/tenantKeys';
import { assetIssuanceMessages } from 'texts/routes/issuer/assetIssuance';
import { getAssetType } from 'utils/commonUtils';
import { getConfig } from 'utils/configUtils';
import { getSelectedChainId, getSelectedNetworkKey } from 'utils/configs';
import i18n from 'utils/i18n';
import {
  clientMetadataSelector,
  userSelector,
  userSpaceSelector,
} from 'features/user/user.store';

interface IProps extends WrappedComponentProps, RouteComponentProps {}

const PageContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const intl = useIntl();
  return (
    <div id="_routes_issuer_assetIssuance">
      <PageTitle
        title={intl.formatMessage(assetIssuanceMessages.title)}
        backLink={intl.formatMessage(assetIssuanceMessages.backlink)}
      />
      {children}
    </div>
  );
};
const AssetIssuance: React.FC<IProps> = () => {
  const [defaultChainId, setDefaultChainId] = useState('');
  const [defaultNetworkKey, setDefaultNetworkKey] = useState('');
  const user = useSelector(userSelector) as IUser;
  const space = useSelector(userSpaceSelector) as IWorkflowInstance;
  const clientMetadata = useSelector(
    clientMetadataSelector,
  ) as ITenant['clientMetadata'];
  const intl = useIntl();
  const history = useHistory();
  const queryClient = useQueryClient();

  const loadSelectedNetwork = () => {
    try {
      const config = getConfig();
      setDefaultChainId(getSelectedChainId(config));
      setDefaultNetworkKey(getSelectedNetworkKey(config));
    } catch (error) {}
  };

  useEffect(() => {
    loadSelectedNetwork();
  }, []);

  const loadAssetTemplates = async () => {
    try {
      const config = getConfig();
      const restrictedAssetTemplates = config.restrictedAssetTypes || [];
      const withDefaultTemplates = !config.ONLY_RETRIEVE_TENANT_ASSET_TEMPLATES;
      const { templates }: { templates: IIssuanceTemplate[] } = await DataCall({
        method: API_FETCH_ASSET_TEMPLATES.method,
        path: API_FETCH_ASSET_TEMPLATES.path(),
        urlParams: {
          withDefaultTemplates,
        },
      });
      let filteredTemplates;
      if (restrictedAssetTemplates.length > 0) {
        filteredTemplates = templates.filter(
          (template) => restrictedAssetTemplates.indexOf(template.type) > -1,
        );
      } else {
        filteredTemplates = templates;
      }
      return filteredTemplates;
    } catch (error) {
      throw error;
    }
  };
  const { data, isLoading, isError } = useQuery(
    [{ scope: 'templates' }],
    loadAssetTemplates,
    {
      keepPreviousData: true,
    },
  );

  const handleAssetTemplateSelection = async ({
    templateId,
    templateType,
  }: {
    templateId: string;
    templateType: AssetType;
  }): Promise<IToken> => {
    try {
      let issuerId;
      if (
        user.userType === UserType.UNDERWRITER ||
        user.userType === UserType.INVESTOR
      ) {
        issuerId = space?.entityId;
      }
      const body = {
        name: intl.formatMessage(assetIssuanceMessages.assetNoName),
        kycTemplateId: user.data.kycTemplateId,
        certificateActivated: true,
        assetTemplateId: templateId,
        issuerId:
          user.userType === UserType.UNDERWRITER ||
          user.userType === UserType.INVESTOR
            ? issuerId
            : undefined,
        bypassSecondaryTradeIssuerApproval:
          Boolean(
            clientMetadata?.[
              TenantKeys.CLIENT_METADATA_BYPASS_SECONDARY_TRADE_ISSUER_APPROVAL
            ],
          ) || templateType === AssetType.SYNDICATED_LOAN,
        automateForceBurn:
          templateType === AssetType.SYNDICATED_LOAN
            ? [OrderSide.BUY]
            : undefined,
        chainId: !defaultChainId ? undefined : defaultChainId, // TO BE DEPRECATED (replaced by 'defaultNetworkKey')
        networkKey: !defaultNetworkKey ? undefined : defaultNetworkKey,
        elementInstances: [],
      };
      const { token } = await DataCall({
        method: API_INITIALIZE_ASSET_DATA.method,
        path: API_INITIALIZE_ASSET_DATA.path(),
        body,
      });
      return token;
    } catch (error) {
      throw error;
    }
  };

  const {
    isLoading: loadingTemplateSelection,
    mutate,
    isError: errorTemplateSelection,
  } = useMutation(handleAssetTemplateSelection, {
    onSuccess: async (data) => {
      await queryClient.cancelQueries(
        tokenKeys.funds(0, 10, false, true, true),
      );
      queryClient.setQueryData<{ tokens: IToken[]; total: number } | undefined>(
        tokenKeys.funds(0, 10, false, true, true),
        (old) => {
          if (old) {
            return {
              ...old,
              tokens: [data, ...old.tokens],
            };
          }
          return old;
        },
      );
      history.push(CLIENT_ROUTE_ISSUER_ASSET_CREATION.pathBuilder(data.id));
    },
  });

  useEffect(() => {
    if (data && data.length === 1)
      mutate({ templateId: data[0].id, templateType: data[0].type });
    // eslint-disable-next-line
  }, [data]);

  if (isLoading || loadingTemplateSelection) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (isError || errorTemplateSelection) {
    return (
      <PageContainer>
        <PageError />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="assetTypeChoice">
        <div>
          <h2>
            {intl.formatMessage(assetIssuanceMessages.assetSelectionTitle)}
          </h2>
          <span>
            {intl.formatMessage(
              assetIssuanceMessages.assetSelectionDescription,
            )}
          </span>
        </div>
        {data && data.length > 0 ? (
          data.map((template) => (
            <Card key={template.name} className="assetTypeCard">
              <h2>
                {template.title
                  ? i18n(intl.locale, template.title)
                  : getAssetType(template.type)}
              </h2>
              <span>{i18n(intl.locale, template.description)}</span>
              <footer>
                <Button
                  onClick={() => {
                    mutate({
                      templateId: template.id,
                      templateType: template.type,
                    });
                  }}
                  size="small"
                  label={intl.formatMessage(
                    assetIssuanceMessages.assetSelectionCreateButton,
                    {
                      type: template.title
                        ? i18n(intl.locale, template.title)
                        : getAssetType(template.type, true).toLowerCase(),
                    },
                  )}
                />
              </footer>
            </Card>
          ))
        ) : (
          <Card className="assetTypeCard">
            <h2 className="error">
              {intl.formatMessage(
                assetIssuanceMessages.assetSelectionNoTemplates,
              )}
            </h2>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default injectIntl(AssetIssuance);
