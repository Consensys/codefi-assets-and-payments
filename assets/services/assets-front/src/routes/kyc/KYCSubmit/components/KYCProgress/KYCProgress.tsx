import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { mdiCheck, mdiCheckCircle, mdiAlert } from '@mdi/js';

import i18n from 'utils/i18n';
import { KYCProgressTexts, KYCSubmitTexts } from 'texts/routes/kyc/KYCSubmit';
import { commonActionsTexts } from 'texts/commun/actions';

import { IProgress } from 'types/Progress';
import { colors } from 'constants/styles';
import { CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE } from 'routesList';

import Icon from 'uiComponents/Icon';
import Button from 'uiComponents/Button';

import { IUser, LinkStatus } from 'User';
import { IKYCTemplate } from 'types/KYCTemplate';

import './KYCProgressStyles.scss';
import { useIntl } from 'react-intl';

interface IProps extends RouteComponentProps<{ issuerId: string }> {
  kycCompletion: Array<IProgress>;
  kycStatus: string;
  template: IKYCTemplate;
  user: IUser;
}

const KYCProgress: React.FC<IProps> = ({
  match: {
    params: { issuerId },
  },
  kycCompletion,
  kycStatus,
  template,
  user,
}: IProps) => {
  const intl = useIntl();
  const isSubmitted = kycStatus === LinkStatus.KYCSUBMITTED;
  const isValidated = kycStatus === LinkStatus.VALIDATED;
  const isInvited = kycStatus === LinkStatus.INVITED;
  const hasRejectedElements =
    kycCompletion.filter(({ rejected }) => !!rejected).length > 0;

  return (
    <div className="_route_fillKyc_kycProgress">
      {(isSubmitted || isValidated) && (
        <div className="submitted">
          <div>
            <Icon icon={mdiCheckCircle} width={16} color={colors.successDark} />{' '}
            {isSubmitted &&
              intl.formatMessage(KYCProgressTexts.informationSentForApproval)}
            {isValidated &&
              intl.formatMessage(KYCProgressTexts.informationApproved)}
          </div>
          {isSubmitted && (
            <p
              dangerouslySetInnerHTML={{
                __html: template['data']['submittedText']
                  ? i18n(intl.locale, template['data']['submittedText'])
                  : intl.formatMessage(
                      KYCProgressTexts.informationSubmittedText,
                    ),
              }}
            />
          )}
        </div>
      )}
      {isInvited && hasRejectedElements && (
        <div className="submitted">
          <div className="error">
            <Icon icon={mdiAlert} width={20} color={colors.warningDark} />
            {intl.formatMessage(KYCProgressTexts.informationSubmittedError)}
          </div>
          <p>
            {intl.formatMessage(
              KYCProgressTexts.informationSubmittedErrorMessage,
            )}{' '}
          </p>
        </div>
      )}
      {isInvited && !hasRejectedElements && (
        <>
          <h1>{intl.formatMessage(KYCSubmitTexts.onBoardingProgressTitle)}</h1>
          <p>
            {intl.formatMessage(KYCSubmitTexts.onBoardingProgressDescription)}
          </p>
        </>
      )}
      <menu>
        <ul>
          {kycCompletion.map(({ key, label, complete, progress, rejected }) => (
            <li key={key}>
              <span className="label">{label[intl.locale]}</span>
              <span
                className={`status${
                  complete
                    ? rejected && isInvited
                      ? ' rejected'
                      : ' complete'
                    : ''
                } `}
              >
                {complete &&
                  isSubmitted &&
                  intl.formatMessage(commonActionsTexts.pendingApproval)}
                {complete && !isSubmitted && !rejected && (
                  <>
                    <Icon
                      icon={mdiCheck}
                      width={16}
                      color={colors.successDark}
                    />{' '}
                    {intl.formatMessage(commonActionsTexts.complete)}
                  </>
                )}
                {complete && rejected && isInvited && (
                  <>
                    <Icon
                      icon={mdiAlert}
                      width={16}
                      color={colors.warningDark}
                    />
                    {intl.formatMessage(
                      KYCProgressTexts.informationUpdateRequired,
                    )}
                  </>
                )}
                {!complete && (
                  <>
                    {intl.formatMessage(commonActionsTexts.inProgress)} (
                    {progress})
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </menu>
      {isInvited && (
        <Button
          width={500}
          href={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
            issuerId,
            step: 'start',
          })}
          label={
            hasRejectedElements
              ? intl.formatMessage(KYCProgressTexts.reviewInformation)
              : intl.formatMessage(KYCSubmitTexts.continueOnboardingButton)
          }
        />
      )}
    </div>
  );
};

export default KYCProgress;
