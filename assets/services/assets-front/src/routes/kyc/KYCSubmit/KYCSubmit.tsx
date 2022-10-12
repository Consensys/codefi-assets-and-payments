import React, { useEffect, useState, useCallback } from 'react';
import { Redirect, RouteComponentProps, Switch } from 'react-router-dom';
import { Route } from 'react-router-dom';

import { DataCall } from 'utils/dataLayer';

import {
  CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE,
  CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE,
} from 'routesList';
import {
  API_FETCH_CLIENT_KYC_DATA_BY_ROLE,
  API_GET_ISSUER_RELATED_KYC_STATUS,
} from 'constants/apiRoutes';

import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import { IKYCTemplate } from 'types/KYCTemplate';
import { IKYCSection } from 'types/KYCSection';
import { IProgress } from 'types/Progress';

import OnBoardingProcess from './components/OnBoardingProcess';
import FirstConnection from './components/FirstConnection';
import KYCProgress from './components/KYCProgress';
import { IUser, UserNature, LinkStatus } from 'User';
import { useSelector } from 'react-redux';

import { computeKycProgress } from 'utils/commonUtils';
import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { useIntl } from 'react-intl';
import { mdiAlertOctagon } from '@mdi/js';
import { colors } from 'constants/styles';
import { CommonTexts } from 'texts/commun/commonTexts';
import { userSelector } from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';

interface IProps extends RouteComponentProps<{ issuerId: string }> {}

const KYCSubmit: React.FC<IProps> = ({
  match: {
    params: { issuerId },
  },
}: IProps) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const [template, setTemplate] = useState<IKYCTemplate>();
  const [loading, setLoading] = useState<boolean>(true);
  const [hasLoadingError, setHasLoadingError] = useState<boolean>(false);
  const [kycStatus, setKycStatus] = useState<string>(LinkStatus.INVITED);

  const fetchLink = useCallback(async () => {
    try {
      const { link } = await DataCall({
        method: API_GET_ISSUER_RELATED_KYC_STATUS.method,
        path: API_GET_ISSUER_RELATED_KYC_STATUS.path(),
        urlParams: {
          issuerId,
          submitterId: user.id,
        },
      });
      if (link) {
        setKycStatus(link.state);
      }
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(CommonTexts.error),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    }
    // eslint-disable-next-line
  }, []);

  const fetchKycData = useCallback(async () => {
    try {
      await fetchLink();
      const kycDataResponse = await DataCall({
        method: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.method,
        path: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.path(),
        urlParams: {
          issuerId,
        },
      });
      const kycData: IKYCTemplate = kycDataResponse.kycData.elementReviews;
      setTemplate(kycData);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setHasLoadingError(true);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchKycData();
  }, [fetchKycData]);

  if (loading || !user) return <PageLoader />;

  if (!template || hasLoadingError) return <PageError />;

  const userTopSection = template.topSections.find(
    ({ key }) =>
      key ===
      (user.userNature === UserNature.LEGAL
        ? 'legalPersonSection'
        : 'naturalPersonSection'),
  );

  if (!userTopSection) {
    return <PageError errorMessage="Invalid template topSection keys" />;
  }

  const sections: Array<IKYCSection> = userTopSection.sections;

  return (
    <Switch>
      <Route
        exact
        path={CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.path}
        render={(props) => {
          const kycCompletion: Array<IProgress> = computeKycProgress(sections);

          const firstConnection =
            kycCompletion.filter((e) => e.started).length === 0;

          if (firstConnection) {
            return (
              <FirstConnection
                template={template}
                {...props}
                match={{ ...props.match, params: { issuerId } }}
              />
            );
          }

          return (
            <KYCProgress
              {...props}
              kycStatus={kycStatus}
              kycCompletion={kycCompletion}
              template={template}
              user={user}
              match={{ ...props.match, params: { issuerId } }}
            />
          );
        }}
      />
      {kycStatus === LinkStatus.INVITED && (
        <Route
          exact
          path={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.path}
          render={(props) => (
            <OnBoardingProcess
              {...props}
              sections={sections}
              template={template}
              fetchLink={fetchLink}
              match={{
                ...props.match,
                params: { issuerId, step: props.match.params.step as string },
              }}
            />
          )}
        />
      )}

      <Route
        render={() => (
          <Redirect
            to={CLIENT_ROUTE_SUBMIT_KYC_BY_ROLE.pathBuilder({
              issuerId,
            })}
          />
        )}
      />
    </Switch>
  );
};

export default KYCSubmit;
