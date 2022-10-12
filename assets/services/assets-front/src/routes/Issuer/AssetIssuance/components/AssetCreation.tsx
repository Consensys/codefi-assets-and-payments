import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';
import { ITopSection, IAssetTemplate, ISection } from '../insuanceDataType';
import {
  API_FETCH_ASSET_DATA,
  API_FETCH_USERS,
  API_RETRIEVE_ASSET_BY_ID,
} from 'constants/apiRoutes';
import PageTitle from 'uiComponents/PageTitle';
import i18n from 'utils/i18n';
import { IToken, AssetType } from '../templatesTypes';
import { DataCall } from 'utils/dataLayer';
import { getNextTransactionStatus } from 'utils/commonUtils';

import AssetCreationForm from './AssetCreationForm';
import { IUser } from 'User';
import { TxStatus } from 'Transaction';
import { useIntl } from 'react-intl';
import Pill from 'uiComponents/Pill';
import { assetCardMessages } from 'texts/routes/issuer/assetManagement';
import { IPillInfo } from 'uiComponents/Pill/Pill';
import { AssetCreationFlow } from '../assetTypes';
import {
  convertTimeAndDateToTz,
  getTimeDateFormRelatedElement,
  getDateTimeFormElementPrefix,
  TimestampBreakdown,
  isTimeOrDateFormElement,
  TIME_ELEMENT_SUFFIX,
  DATE_ELEMENT_SUFFIX,
} from 'utils/dateTime';

interface IProps extends RouteComponentProps<{ assetId: string }> {}

const AssetCreation: React.FC<IProps> = ({
  match: {
    params: { assetId },
  },
}: IProps) => {
  const intl = useIntl();
  const [template, setTemplate] = useState<IAssetTemplate>();
  const [token, setToken] = useState<IToken>();
  const [users, setUsers] = useState<Array<IUser>>([]);
  const [generalSection, setGeneralSection] = useState<ITopSection>();
  const [isLoadingTemplateData, setIsLoadingTemplateData] = useState(false);
  const [combineSections, setCombineSections] = useState(false);
  const [hasLoadingTemplateDataError, setHasLoadingTemplateDataError] =
    useState(false);

  const convertTemplateDateTimeToUserTZ = useCallback(
    (assetData: IAssetTemplate) => {
      const DateTimeKeyMap: Map<string, TimestampBreakdown> = new Map();

      for (const topSection of assetData.topSections) {
        for (const section of topSection.sections) {
          for (const item of section.elements) {
            let value = item.data;
            if (isTimeOrDateFormElement(item) && item.data.length) {
              const isTimeElement = item.key.endsWith(TIME_ELEMENT_SUFFIX);
              const keyPrefix = getDateTimeFormElementPrefix(item.key);
              const relatedElement = getTimeDateFormRelatedElement(
                section,
                keyPrefix,
                isTimeElement ? TIME_ELEMENT_SUFFIX : DATE_ELEMENT_SUFFIX,
              );

              if (relatedElement) {
                let mappedDateTime = DateTimeKeyMap.get(keyPrefix);

                const dateElement = isTimeElement ? relatedElement : item;
                const timeElement = isTimeElement ? item : relatedElement;

                if (!mappedDateTime) {
                  mappedDateTime = convertTimeAndDateToTz({
                    time: timeElement.data[0],
                    date: dateElement.data[0],
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  });

                  DateTimeKeyMap.set(keyPrefix, mappedDateTime);
                }

                value = isTimeElement
                  ? [mappedDateTime.time]
                  : [mappedDateTime.date];
              }

              item.data = value;
            }
          }
        }
      }
    },
    [],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingTemplateData(true);

        const tokenPromise: Promise<{ token: IToken }> = DataCall({
          method: API_RETRIEVE_ASSET_BY_ID.method,
          path: API_RETRIEVE_ASSET_BY_ID.path(assetId),
          urlParams: {
            withBalances: false,
            withAssetData: true,
          },
        });

        const usersPromise: Promise<{ users: Array<IUser> }> = DataCall({
          method: API_FETCH_USERS.method,
          path: API_FETCH_USERS.path(),
          urlParams: {
            offset: 0,
            limit: 50,
          },
        });

        const [{ token }, { users }] = await Promise.all([
          tokenPromise,
          usersPromise,
        ]);

        setToken(token);
        setUsers(users);

        const { assetData }: { assetData: IAssetTemplate } = await DataCall({
          method: API_FETCH_ASSET_DATA.method,
          path: API_FETCH_ASSET_DATA.path(),
          urlParams: {
            templateId: token.assetTemplateId,
            tokenId: assetId,
          },
        });

        convertTemplateDateTimeToUserTZ(assetData);

        const firstTopSection = assetData?.topSections?.[0];

        if (!firstTopSection) {
          setIsLoadingTemplateData(false);
          setHasLoadingTemplateDataError(true);
          return;
        }

        setIsLoadingTemplateData(false);
        setHasLoadingTemplateDataError(false);
        setTemplate(assetData);
        if (assetData.type === AssetType.CURRENCY) {
          setCombineSections(true);
          const allSections = assetData?.topSections.reduce(
            (acc: ISection[], curr) => [...acc, ...curr.sections],
            [],
          );
          setGeneralSection({ ...firstTopSection, sections: allSections });
        } else {
          setGeneralSection(firstTopSection);
        }
      } catch (error) {
        setIsLoadingTemplateData(false);
        setHasLoadingTemplateDataError(true);
      }
    };

    loadData();
  }, [assetId, convertTemplateDateTimeToUserTZ]);

  if (isLoadingTemplateData || !template || !generalSection || !token) {
    return <PageLoader />;
  }

  if (hasLoadingTemplateDataError) {
    return <PageError />;
  }

  const workflowState = new Map<TxStatus, IPillInfo>([
    [
      TxStatus.REJECTED,
      {
        color: 'error',
        label: intl.formatMessage(assetCardMessages.rejected).toUpperCase(),
      },
    ],
    [
      TxStatus.PREINITIALIZED,
      {
        color: 'accent1',
        label: intl
          .formatMessage(assetCardMessages.preInitialized)
          .toUpperCase(),
      },
    ],
    [
      TxStatus.SUBMITTED,
      {
        color: 'accent3',
        label: intl.formatMessage(assetCardMessages.submitted).toUpperCase(),
      },
    ],
  ]);

  const nextTransactionStatus = getNextTransactionStatus(token.data);
  const isDeployed =
    !!token.defaultDeployment &&
    nextTransactionStatus !== TxStatus.PENDING &&
    nextTransactionStatus !== TxStatus.PROCESSING &&
    nextTransactionStatus !== TxStatus.REVERTED &&
    nextTransactionStatus !== TxStatus.FAILED;

  const isMultipartiteFlow =
    token.data.assetCreationFlow === AssetCreationFlow.TRI_PARTY ||
    token.data.assetCreationFlow === AssetCreationFlow.BI_PARTY;
  const workflowInstanceState = token.data.worflowInstanceState;

  const state = !(
    workflowInstanceState === TxStatus.PREINITIALIZED &&
    token.data.assetCreationFlow === AssetCreationFlow.BI_PARTY
  )
    ? workflowState.get(workflowInstanceState as TxStatus)
    : undefined;

  return (
    <div id="_routes_issuer_assetIssuance">
      <PageTitle
        title={
          token?.assetData?.asset?.name || i18n(intl.locale, template.label)
        }
        subTitle={state && <Pill color={state?.color} label={state?.label} />}
      ></PageTitle>

      <AssetCreationForm
        token={token}
        template={template}
        users={users}
        generalSection={generalSection}
        isDeployed={isDeployed}
        isMultipartiteFlow={isMultipartiteFlow}
        workflowInstanceState={workflowInstanceState}
        combineSections={combineSections}
      />
    </div>
  );
};

export default AssetCreation;
