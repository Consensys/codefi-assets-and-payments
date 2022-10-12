import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import i18n from 'utils/i18n';

import Button from 'uiComponents/Button';
import Logo from 'uiComponents/Logo';

import { KYCSubmitTexts } from 'texts/routes/kyc/KYCSubmit';

import { IKYCTemplate } from 'types/KYCTemplate';

import './FirstConnectionStyles.scss';

import { IUser, UserNature } from 'User';
import { useSelector } from 'react-redux';
import { colors } from 'constants/styles';
import { CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE } from 'routesList';
import { useIntl } from 'react-intl';
import { userSelector } from 'features/user/user.store';
interface IProps extends RouteComponentProps<{ issuerId: string }> {
  template: IKYCTemplate;
}

const FirstConnection: React.FC<IProps> = ({
  template,
  match: {
    params: { issuerId },
  },
}: IProps) => {
  const intl = useIntl();
  const user = useSelector(userSelector) as IUser;
  const userTopSection = template.topSections.find(
    ({ key }) =>
      key ===
      (user.userNature === UserNature.LEGAL
        ? 'legalPersonSection'
        : 'naturalPersonSection'),
  );
  return (
    <div className="_route_fillKyc_firstConnection">
      {template['data']['welcomePageLogo'] && (
        <Logo
          style={{
            width: '78px',
            backgroundColor: colors.main,
          }}
          src={template['data']['welcomePageLogo']}
        />
      )}
      <h1>
        {template['data']['welcomeMessage']
          ? i18n(intl.locale, template['data']['welcomeMessage'])
          : intl.formatMessage(KYCSubmitTexts.welcomeMessage)}
      </h1>
      <span>
        {template['data']['welcomeText']
          ? i18n(intl.locale, template['data']['welcomeText'])
          : intl.formatMessage(KYCSubmitTexts.onboardingSteps)}
      </span>
      {!template['data']['hideSteps'] && (
        <div>
          <ul>
            {userTopSection &&
              userTopSection.sections.map((section, index) => (
                <li key={`section-${index}`}>
                  {i18n(intl.locale, section.label)}
                </li>
              ))}
          </ul>
        </div>
      )}
      <Button
        width="100%"
        href={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
          issuerId,
          step: 'start',
        })}
        label={intl.formatMessage(KYCSubmitTexts.startOnboardingButton)}
      />
    </div>
  );
};

export default FirstConnection;
