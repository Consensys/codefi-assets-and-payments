import React, { useEffect, useState } from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';
import { mdiAlertOctagon, mdiArrowLeft } from '@mdi/js';

import { DataCall } from 'utils/dataLayer';
import { kycReviewTexts } from 'texts/routes/issuer/kycReview';
import { commonActionsTexts } from 'texts/commun/actions';
import { clientManagementMessages } from 'texts/routes/issuer/investorsManagement';

import {
  CLIENT_ROUTE_CLIENT_MANAGEMENT,
  CLIENT_ROUTE_KYC_REVIEW,
} from 'routesList';

import {
  API_FETCH_CLIENT_KYC_DATA_BY_ROLE,
  API_UNVALIDATE_CLIENT_KYC,
  API_REJECT_CLIENT_KYC,
  API_SAVE_KYC_REVIEW,
  API_VALIDATE_CLIENT_KYC,
  API_FETCH_USER_BY_ROLE,
} from 'constants/apiRoutes';

import ProgressMenu from 'uiComponents/ProgressMenu';
import PageTitle from 'uiComponents/PageTitle';
import PageError from 'uiComponents/PageError';
import PageLoader from 'uiComponents/PageLoader';
import Button from 'uiComponents/Button';

import { IKYCTemplate } from 'types/KYCTemplate';
import { IKYCTopSection } from 'types/KYCTopSection';
import { IKYCSection } from 'types/KYCSection';
import { IProgress } from 'types/Progress';

import KYCSectionReview from './components/KYCSectionReview';
import KYCFullReview from './components/KYCFullReview';
import KYCRenewal from './components/KYCRenewal';

import { appMessageData } from 'uiComponents/AppMessages/AppMessage';
import { colors } from 'constants/styles';
import { addYearsToDate, getClientName } from 'utils/commonUtils';
import {
  ElementStatus,
  ReviewStatus,
} from '../../Issuer/AssetIssuance/elementsTypes';
import { IUser, UserNature, UserType } from 'User';
import { IWorkflowInstance } from '../../Issuer/AssetIssuance/templatesTypes';
import { getConfig } from 'utils/configUtils';
import { appModalData } from 'uiComponents/AppModal/AppModal';

import './KYCReviewStyles.scss';
import Input from 'uiComponents/Input';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { KYCReviewTexts } from 'texts/routes/kyc/KYCReview';
import { useSelector, useDispatch } from 'react-redux';
import {
  setAppModal,
  userSelector,
  userSpaceSelector,
} from 'features/user/user.store';
import { EventEmitter, Events } from 'features/events/EventEmitter';
import { useCallback } from 'react';

export const KYC_RENEWAL_ROUTE = 'renewal';
export const KYC_FULL_REVIEW_ROUTE = 'review';

export interface IKYCValidation {
  reviewId: string;
  status: ReviewStatus;
  comment?: string;
  validityDate?: Date;
}

interface IState {
  user: IUser;
  topSection?: IKYCTopSection;
  hasLoadingError: boolean;
  investor?: IUser;
  isLoading: boolean;
  isSaving: boolean;
  isKycValidated: boolean;
}

type IProps = RouteComponentProps<{
  investorId: string;
  step: string;
}> &
  WrappedComponentProps;
const KYCReview: React.FC<IProps> = ({ intl, match, history }) => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector) as IUser;
  const space = useSelector(userSpaceSelector) as IWorkflowInstance;
  const [state, setState] = useState<IState>({
    user,
    hasLoadingError: false,
    isLoading: true,
    isSaving: false,
    isKycValidated: false,
  });

  const loadKYCData = useCallback(
    async (reload = true): Promise<void> => {
      if (reload) {
        setState((s) => ({
          ...s,
          isLoading: true,
        }));
      }

      try {
        const {
          params: { investorId },
        } = match;
        const issuerId = space?.entityId;
        const role = state.user.userType;
        const kycDataResponse = await DataCall({
          method: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.method,
          path: API_FETCH_CLIENT_KYC_DATA_BY_ROLE.path(role),
          urlParams: {
            issuerId,
            submitterId: investorId,
          },
        });
        const kycData: IKYCTemplate = kycDataResponse.kycData.elementReviews;
        const kycReview = kycDataResponse.kycData.templateReview;

        const isKycValidated = kycReview?.status === 'VALIDATED';

        const { user: investor }: { user: IUser } = await DataCall({
          method: API_FETCH_USER_BY_ROLE.method,
          path: API_FETCH_USER_BY_ROLE.path(investorId, role),
          urlParams: {
            issuerId,
          },
        });

        const investorTopSection = (kycData as IKYCTemplate).topSections.find(
          ({ key }) =>
            key ===
            (investor.userNature === UserNature.LEGAL
              ? 'legalPersonSection'
              : 'naturalPersonSection'),
        );

        if (reload) {
          setState((s) => ({
            ...s,
            isLoading: false,
            topSection: investorTopSection,
            investor,
            isKycValidated,
          }));
        } else {
          setState((s) => ({
            ...s,
            topSection: investorTopSection,
            investor,
            isKycValidated,
          }));
        }
      } catch (error) {
        setState((s) => ({
          ...s,
          hasLoadingError: true,
          isLoading: false,
        }));
      }
    },
    [match, space?.entityId, state.user.userType],
  );

  useEffect(() => {
    loadKYCData();
  }, [loadKYCData]);

  const saveKYCReviews = async (
    reviews: Array<IKYCValidation>,
  ): Promise<void> => {
    try {
      setState((s) => ({ ...s, isSaving: true }));
      const issuerId = space?.entityId;
      const sections = state.topSection?.sections || [];
      for (const section of sections) {
        for (const element of section.elements) {
          for (const review of reviews) {
            if (
              element.elementInstance &&
              element.elementInstance.reviewId === review.reviewId
            ) {
              element.elementInstance = {
                ...element.elementInstance,
                ...review,
              };
            }
          }
        }
      }

      await DataCall({
        method: API_SAVE_KYC_REVIEW.method,
        path: API_SAVE_KYC_REVIEW.path(),
        body: {
          issuerId,
          reviews,
        },
      });
    } catch (error) {
      EventEmitter.dispatch(
        Events.EVENT_APP_MESSAGE,
        appMessageData({
          message: intl.formatMessage(KYCReviewTexts.KYCActionError),
          secondaryMessage: String(error),
          icon: mdiAlertOctagon,
          color: colors.error,
          isDark: true,
        }),
      );
    } finally {
      setState((s) => ({ ...s, isSaving: false }));
    }
  };

  const { investorId, step } = match.params;
  const role = state.user.userType;
  const issuerId = space?.entityId;
  const config = getConfig();
  if (state.isLoading) return <PageLoader />;

  if (!state.topSection || state.hasLoadingError) return <PageError />;

  const sections: Array<IKYCSection> = state.topSection.sections;

  const kycCompletion: Array<IProgress> = sections.map(
    ({ key, label, elements }) => {
      const rejectedElements = elements.filter(
        ({ elementInstance }) =>
          (elementInstance || {}).status === ReviewStatus.REJECTED,
      );
      const validatedElements = elements.filter(
        ({ name, elementInstance, element }) => {
          const status = element.status;
          if (status === ElementStatus.mandatory) {
            return (elementInstance || {}).status !== ReviewStatus.SUBMITTED;
          }
          if (status === ElementStatus.conditional) {
            const parentElement = elements.find(({ element }) => {
              return (
                (element.inputs || []).length > 0 &&
                element.inputs.find(
                  ({ relatedElements }) =>
                    (relatedElements || []).indexOf(name) > -1,
                )
              );
            });

            return (
              parentElement &&
              parentElement.elementInstance &&
              parseInt(parentElement.elementInstance.value[0]) ===
                parentElement.element.inputs.findIndex(
                  ({ relatedElements }) =>
                    relatedElements && relatedElements.indexOf(name) > -1,
                ) &&
              (elementInstance || {}).status !== ReviewStatus.SUBMITTED
            );
          }
          return false;
        },
      );
      const mandatoryElements = elements.filter(({ name, element }) => {
        const status = element.status;
        if (status === ElementStatus.mandatory) {
          return true;
        }
        if (status === ElementStatus.conditional) {
          const parentElement = elements.find(({ element }) => {
            return (
              (element.inputs || []).length > 0 &&
              element.inputs.find(
                ({ relatedElements }) =>
                  (relatedElements || []).indexOf(name) > -1,
              )
            );
          });

          return (
            parentElement &&
            parentElement.elementInstance &&
            parseInt(parentElement.elementInstance.value[0]) ===
              parentElement.element.inputs.findIndex(
                ({ relatedElements }) =>
                  relatedElements && relatedElements.indexOf(name) > -1,
              )
          );
        }
        return false;
      });
      return {
        key,
        label,
        started: validatedElements.length > 0,
        complete: mandatoryElements.length <= validatedElements.length,
        progress: `${validatedElements.length}/${mandatoryElements.length}`,
        rejected: rejectedElements.length > 0,
      };
    },
  );

  const routes = [
    ...sections.map((section) => section.key),
    KYC_FULL_REVIEW_ROUTE,
  ];
  if (
    config.ENABLE_KYC_RISK_PROFLE_CLIENT_CATEGORY_SELECTION &&
    !state.isKycValidated
  ) {
    routes.push(KYC_RENEWAL_ROUTE);
  }
  const currentStepIndex = routes.findIndex((key) => key === step);

  const hasRejectedElements =
    kycCompletion.filter(({ rejected }) => !!rejected).length > 0;

  return (
    <div id="_routes_issuer_KYCReview">
      <PageTitle
        title={intl.formatMessage(kycReviewTexts.title)}
        backLink={{
          label: intl.formatMessage(clientManagementMessages.title),
          to: CLIENT_ROUTE_CLIENT_MANAGEMENT,
        }}
        subTitle={
          <>
            <b>{intl.formatMessage(kycReviewTexts.prospect)}:</b>{' '}
            {getClientName(state.investor as IUser)}
          </>
        }
        tabActions={
          state.isKycValidated
            ? []
            : [
                {
                  label: intl.formatMessage(KYCReviewTexts.rejectInvestor),
                  color: colors.errorDark,
                  action: () => {
                    dispatch(
                      setAppModal(
                        appModalData({
                          title: intl.formatMessage(KYCReviewTexts.reject),
                          confirmAction: async ({ comment }) => {
                            try {
                              setState((s) => ({ ...s, isLoading: true }));
                              await DataCall({
                                method: API_REJECT_CLIENT_KYC.method,
                                path: API_REJECT_CLIENT_KYC.path(
                                  role === UserType.VERIFIER
                                    ? role.toLowerCase()
                                    : undefined,
                                ),
                                body: {
                                  issuerId,
                                  submitterId: investorId,
                                  sendNotification: true,
                                  comment: comment.value,
                                },
                              });
                              history.push(CLIENT_ROUTE_CLIENT_MANAGEMENT);
                            } catch (error) {
                              EventEmitter.dispatch(
                                Events.EVENT_APP_MESSAGE,
                                appMessageData({
                                  message: intl.formatMessage(
                                    KYCReviewTexts.rejectOnboardingError,
                                  ),
                                  secondaryMessage: String(error),
                                  icon: mdiAlertOctagon,
                                  color: colors.error,
                                  isDark: true,
                                }),
                              );
                            } finally {
                              setState((s) => ({ ...s, isLoading: false }));
                            }
                          },
                          confirmLabel: intl.formatMessage(
                            KYCReviewTexts.rejectOnboardingConfirmLabel,
                          ),
                          confirmColor: colors.errorDark,
                          content: (
                            <div style={{ maxWidth: 500, maxHeight: 250 }}>
                              <p style={{ marginBottom: '20px' }}>
                                {intl.formatMessage(
                                  KYCReviewTexts.rejectOnboardingDesc,
                                )}
                              </p>
                              <Input
                                type="textarea"
                                label={intl.formatMessage(
                                  KYCReviewTexts.rejectOnboardingInputLabel,
                                )}
                                required
                                name="comment"
                                placeholder={intl.formatMessage(
                                  KYCReviewTexts.rejectOnboardingInputPlaceholder,
                                )}
                                sublabel={intl.formatMessage(
                                  KYCReviewTexts.rejectOnboardingInputSublabel,
                                )}
                              />
                            </div>
                          ),
                        }),
                      ),
                    );
                  },
                },
              ]
        }
      />

      <div className="kycReviewContainer">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (currentStepIndex < routes.length - 1) {
              const step =
                currentStepIndex < routes.length - 1
                  ? routes[currentStepIndex + 1]
                  : '';
              const path = CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                investorId,
                step,
              });
              history.push(path);
            } else {
              try {
                if (hasRejectedElements) {
                  await DataCall({
                    method: API_UNVALIDATE_CLIENT_KYC.method,
                    path: API_UNVALIDATE_CLIENT_KYC.path(role),
                    body: {
                      issuerId,
                      submitterId: investorId,
                      sendNotification: true,
                    },
                  });
                  history.push(CLIENT_ROUTE_CLIENT_MANAGEMENT);
                } else {
                  const htmlElements: { [key: string]: HTMLInputElement } = e
                    .currentTarget.elements as unknown as {
                    [key: string]: HTMLInputElement;
                  };

                  dispatch(
                    setAppModal(
                      appModalData({
                        title: intl.formatMessage(
                          state.investor?.userType === UserType.INVESTOR
                            ? KYCReviewTexts.onboardInvestor
                            : KYCReviewTexts.onboardUser,
                        ),
                        confirmAction: async () => {
                          try {
                            setState((s) => ({ ...s, isLoading: true }));
                            const validations = (
                              state.topSection?.sections || []
                            ).reduce(
                              (
                                validations: Array<IKYCValidation>,
                                section: IKYCSection,
                              ) => [
                                ...validations,
                                ...section.elements
                                  .filter(
                                    (element) => !!element.elementInstance,
                                  )
                                  .map((element) => {
                                    const elementInstance =
                                      element.elementInstance;
                                    return {
                                      reviewId: elementInstance.reviewId,
                                      status: elementInstance.status,
                                      comment:
                                        elementInstance.comment || undefined,
                                      validityDate:
                                        elementInstance.validityDate ||
                                        undefined,
                                    };
                                  }),
                              ],
                              [],
                            );
                            const { investorId } = match.params;
                            const role = state.user.userType;
                            const validityDate =
                              (htmlElements.validityDate || {}).value || '';
                            await DataCall({
                              method: API_VALIDATE_CLIENT_KYC.method,
                              path: API_VALIDATE_CLIENT_KYC.path(role),
                              body: {
                                issuerId,
                                validations,
                                submitterId: investorId,
                                clientCategory: (htmlElements.category || {})
                                  .value,
                                riskProfile: (htmlElements.riskProfile || {})
                                  .value,
                                validityDate:
                                  validityDate !== ''
                                    ? addYearsToDate(
                                        new Date(),
                                        parseInt(validityDate),
                                      )
                                    : undefined,
                                sendNotification: true,
                              },
                            });

                            setState((s) => ({
                              ...s,
                              isLoading: false,
                            }));
                            history.push(CLIENT_ROUTE_CLIENT_MANAGEMENT);
                          } catch (error) {
                            setState((s) => ({
                              ...s,
                              isLoading: false,
                              hasLoadingError: true,
                            }));
                            EventEmitter.dispatch(
                              Events.EVENT_APP_MESSAGE,
                              appMessageData({
                                message: intl.formatMessage(
                                  KYCReviewTexts.onboardError,
                                ),
                                secondaryMessage: String(error),
                                icon: mdiAlertOctagon,
                                color: colors.error,
                                isDark: true,
                              }),
                            );
                          }
                        },
                        confirmLabel: intl.formatMessage(
                          state.investor?.userType === UserType.INVESTOR
                            ? KYCReviewTexts.onboardInvestor
                            : KYCReviewTexts.onboardUser,
                        ),
                        confirmColor: colors.main,
                        content: (
                          <div style={{ maxWidth: 700 }}>
                            <b>
                              {intl.formatMessage(KYCReviewTexts.attention)}
                            </b>
                            {intl.formatMessage(
                              state.investor?.userType === UserType.INVESTOR
                                ? KYCReviewTexts.confirmInvestorOnboardingMessage
                                : KYCReviewTexts.confirmUserOnboardingMessage,
                              { user: getClientName(state.investor as IUser) },
                            )}
                          </div>
                        ),
                      }),
                    ),
                  );
                }
              } catch (error) {
                console.log(error);
              }
            }
          }}
        >
          <Switch>
            {sections.map((section) => (
              <Route
                key={section.key}
                exact
                path={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                  investorId,
                  step: section.key,
                })}
                render={(props) => {
                  return (
                    <KYCSectionReview
                      {...props}
                      issuerId={issuerId}
                      investorId={investorId}
                      isSaving={state.isSaving}
                      section={section}
                      saveKYCReviews={saveKYCReviews}
                      isKycValidated={state.isKycValidated}
                    />
                  );
                }}
              />
            ))}
            <Route
              key={KYC_FULL_REVIEW_ROUTE}
              exact
              path={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                investorId,
                step: KYC_FULL_REVIEW_ROUTE,
              })}
              render={(props) => (
                <KYCFullReview
                  {...props}
                  issuerId={issuerId}
                  investorId={investorId}
                  sections={sections}
                  isKycValidated={state.isKycValidated}
                />
              )}
            />
            <Route
              key={KYC_RENEWAL_ROUTE}
              exact
              path={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                investorId,
                step: KYC_RENEWAL_ROUTE,
              })}
              render={(props) => (
                <KYCRenewal
                  {...props}
                  sections={sections}
                  hasRejectedElements={hasRejectedElements}
                  investor={state.investor as IUser}
                />
              )}
            />
            <Route
              render={() => {
                const step =
                  (kycCompletion.find(({ complete }) => !complete) || {}).key ||
                  sections[0].key;
                const path = CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                  investorId,
                  step,
                });
                return <Redirect to={path} />;
              }}
            />
          </Switch>

          <footer>
            <Button
              label={intl.formatMessage(commonActionsTexts.back)}
              size="small"
              tertiary
              iconLeft={mdiArrowLeft}
              disabled={currentStepIndex === 0}
              href={CLIENT_ROUTE_KYC_REVIEW.pathBuilder({
                investorId,
                step: currentStepIndex > 0 ? routes[currentStepIndex - 1] : '',
              })}
            />
            {currentStepIndex === routes.length - 1 &&
              !state.isKycValidated && (
                <Button
                  color={
                    !hasRejectedElements
                      ? colors.successDark
                      : colors.warningDark
                  }
                  type="submit"
                  label={
                    hasRejectedElements
                      ? intl.formatMessage(
                          KYCReviewTexts.requestUpdatedInformation,
                        )
                      : intl.formatMessage(
                          state.investor?.userType === UserType.INVESTOR
                            ? KYCReviewTexts.onboardInvestor
                            : KYCReviewTexts.onboardUser,
                        )
                  }
                  size="small"
                />
              )}
            {currentStepIndex < routes.length - 1 && (
              <Button
                color={colors.main}
                disabled={
                  currentStepIndex < kycCompletion.length &&
                  !(kycCompletion[currentStepIndex] || {}).complete
                }
                type="submit"
                label={intl.formatMessage(commonActionsTexts.next)}
                size="small"
              />
            )}
          </footer>
        </form>
        <ProgressMenu
          step={step}
          kycCompletion={kycCompletion}
          saving={false}
          exitHref={CLIENT_ROUTE_CLIENT_MANAGEMENT}
        />
      </div>
    </div>
  );
};

export default injectIntl(KYCReview);
