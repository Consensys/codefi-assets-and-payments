import React, { FC } from 'react';

import i18n from 'utils/i18n';

import { onBoardingProcessTexts } from 'texts/routes/kyc/onBoardingProcess';
import { IKYCSection } from 'types/KYCSection';

import KYCSection from './KYCSection';
import { IKYCTemplate } from 'types/KYCTemplate';
import { IUser } from 'User';
import { useIntl } from 'react-intl';

interface IProps {
  sections: Array<IKYCSection>;
  issuerId: string;
  template: IKYCTemplate;
  user: IUser;
}

const KycSubmission: FC<IProps> = ({
  sections,
  issuerId,
  template,
  user,
}: IProps) => {
  const intl = useIntl();
  return (
    <>
      <h1>
        {template['data']['reviewTitle']
          ? i18n(intl.locale, template['data']['reviewTitle'])
          : intl.formatMessage(onBoardingProcessTexts.stepsReviewTitle)}
      </h1>
      <p>
        {template['data']['reviewDescription']
          ? i18n(intl.locale, template['data']['reviewDescription'])
          : intl.formatMessage(onBoardingProcessTexts.stepsReviewDescription)}
      </p>
      {sections.map((section) => (
        <KYCSection
          user={user}
          issuerId={issuerId}
          key={section.key}
          section={section}
          reviewMode
          templateName={template.name}
        />
      ))}
    </>
  );
};

export default KycSubmission;
