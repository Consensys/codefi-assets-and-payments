import React, { useCallback, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';
import PageLoader from 'uiComponents/PageLoader';
import PageError from 'uiComponents/PageError';

import { CLIENT_ROUTE_KYC_REVIEW } from 'routesList';

import './FundInvestorDetails.scss';
import { Card } from 'uiComponents/Card';
import Icon from 'uiComponents/Icon';
import { mdiEmail } from '@mdi/js';
import Pill from 'uiComponents/Pill';
import { DataCall } from 'utils/dataLayer';
import { formatDate, getClientName } from 'utils/commonUtils';
import {
  API_FETCH_CLIENT_KYC_DATA_BY_ROLE,
  API_UNVALIDATE_CLIENT_KYC,
  API_FETCH_USER_BY_ROLE,
} from 'constants/apiRoutes';
import { colors } from 'constants/styles';

import { IUser, UserType } from 'User';
import { prospectsMessages } from 'texts/routes/issuer/investorsManagement';
import { useSelector } from 'react-redux';
import { buildTabs } from '../FundInvestorAssets/utils/buildAssetData';
import Button from 'uiComponents/Button';
import {
  IWorkflowInstance,
  KycDataResponse,
  KycValidations,
} from '../AssetIssuance/templatesTypes';
import { IKycReview } from 'types/KYCReview';
import { ReviewStatus } from 'routes/Issuer/AssetIssuance/elementsTypes';
import { useIntl } from 'react-intl';
import { fundInvestorDetailsTexts } from 'texts/routes/issuer/fundInvestor';
import { userSelector, userSpaceSelector } from 'features/user/user.store';

interface IProps
  extends RouteComponentProps<{
    issuerId: string;
    investorId: string;
  }> {}

interface IState {
  isLoading: boolean;
  hasLoadingError: boolean;
  user: IUser;
  investor?: IUser;
  kycReview?: IKycReview;
  kycValidations?: KycValidations;
}

const FundInvestorDetails: React.FC<IProps> = ({ match }) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const space = useSelector(userSpaceSelector) as IWorkflowInstance;
  const [state, setState] = useState<IState>({
    isLoading: true,
    hasLoadingError: false,
    user,
  });

  const loadData = useCallback(async () => {
    try {
      setState((s) => ({
        ...s,
        isLoading: true,
      }));

      const {
        params: { investorId },
      } = match;

      const issuerId = space?.entityId;
      const role = state.user.userType;
      const { user: investor }: { user: IUser } = await DataCall({
        method: API_FETCH_USER_BY_ROLE.method,
        path: API_FETCH_USER_BY_ROLE.path(investorId, role),
        urlParams: {
          issuerId,
        },
      });

      const kycDataResponse: KycDataResponse = await DataCall({
        method: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.method,
        path: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.path(role),
        urlParams: {
          userId: state.user.id,
          issuerId,
          submitterId: match.params.investorId,
        },
      });

      const kycReview: IKycReview = kycDataResponse.kycData.templateReview;
      const kycValidations: KycValidations = kycDataResponse.kycValidations;

      if (!investor) {
        setState((s) => ({
          ...s,
          isLoading: false,
          hasLoadingError: true,
        }));
      } else {
        setState((s) => ({
          ...s,
          investor,
          kycReview,
          kycValidations,
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
  }, [match, space?.entityId, state.user.id, state.user.userType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const role = state.user.userType;

  if (state.isLoading) {
    return (
      <div className="_route_issuer_fundInvestorDetails">
        <PageLoader />
      </div>
    );
  }

  if (state.hasLoadingError || !state.investor) {
    return (
      <div className="_route_issuer_fundInvestorDetails">
        <PageError />
      </div>
    );
  }

  return (
    <div className="_route_issuer_fundInvestorDetails">
      <PageTitle
        title={getClientName(state.investor)}
        tabNavigation={buildTabs({
          active: 'details',
          investorId: state.investor.id,
          role,
        })}
      />

      <main>
        <div className="informations">
          <Card className="kyc">
            <header>
              {intl.formatMessage(fundInvestorDetailsTexts.KYCInformation)}
              {state.kycValidations?.elements?.[0] === true &&
                state.kycValidations?.template?.[0] === true && (
                  <Link
                    to={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                      investorId: state.investor.id,
                    })}
                    style={{
                      color: colors.main,
                    }}
                  >
                    {intl.formatMessage(
                      fundInvestorDetailsTexts.viewKYCInformation,
                    )}
                  </Link>
                )}
            </header>

            {false && (
              <Button
                onClick={async () => {
                  await DataCall({
                    method: API_UNVALIDATE_CLIENT_KYC.method,
                    path: API_UNVALIDATE_CLIENT_KYC.path(
                      role === UserType.VERIFIER
                        ? role.toLowerCase()
                        : undefined,
                    ),
                    body: {
                      issuerId: state.user.id,
                      submitterId: state.investor?.id,
                      sendNotification: true,
                    },
                  });
                  loadData();
                }}
              >
                {intl.formatMessage(fundInvestorDetailsTexts.unvalidate)}
              </Button>
            )}

            <ul>
              <li>
                <span>
                  {intl.formatMessage(fundInvestorDetailsTexts.KYCStatus)}
                </span>
                <span>
                  {state.kycReview &&
                    (() => {
                      switch (state.kycReview.status) {
                        case ReviewStatus.SUBMITTED:
                          return (
                            <Pill
                              color="accent2"
                              label={intl.formatMessage(
                                prospectsMessages.reviewInProgress,
                              )}
                            />
                          );
                        case ReviewStatus.IN_REVIEW:
                          return (
                            <Pill
                              color="accent3"
                              label={intl.formatMessage(
                                prospectsMessages.toBeReviewed,
                              )}
                            />
                          );
                        case ReviewStatus.VALIDATED:
                          return (
                            <Pill
                              color="accent4"
                              label={intl.formatMessage(
                                prospectsMessages.validated,
                              )}
                            />
                          );
                        case ReviewStatus.REJECTED:
                          return (
                            <Pill
                              color="error"
                              label={intl.formatMessage(
                                prospectsMessages.rejected,
                              )}
                            />
                          );
                        default:
                          return state.kycReview.status || '-';
                      }
                    })()}
                </span>
              </li>
              <li>
                <span>
                  {intl.formatMessage(fundInvestorDetailsTexts.onboardedOn)}
                </span>
                <span>
                  {state.kycReview?.createdAt
                    ? formatDate(new Date(state.kycReview.createdAt))
                    : '-'}
                </span>
              </li>
              {(() => {
                if (
                  state.kycValidations?.elements?.[0] === true &&
                  state.kycValidations?.template?.[0] === true
                ) {
                  return (
                    <li>
                      <span>
                        {intl.formatMessage(
                          fundInvestorDetailsTexts.KYCRenewalDate,
                        )}
                      </span>
                      <span>
                        {state.kycReview?.validityDate
                          ? formatDate(new Date(state.kycReview.validityDate))
                          : '-'}
                      </span>
                    </li>
                  );
                }
              })()}
            </ul>
          </Card>

          <Card className="representative">
            <header>
              {intl.formatMessage(fundInvestorDetailsTexts.contactInformation)}
            </header>
            <div className="name">{`${state.investor.firstName} ${state.investor.lastName}`}</div>
            <ul>
              <li>
                <Icon icon={mdiEmail} color="#C2C4CC" width={18} />
                <Link
                  to={{
                    pathname: `@mailto:${state.investor.email}`,
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {state.investor.email}
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FundInvestorDetails;
