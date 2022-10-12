import React, { FC } from 'react';

import { IKYCSection } from 'types/KYCSection';

import i18n from 'utils/i18n';

import KYCSubSection from './KYCSubSection';
import { IUser } from 'User';
import { useIntl } from 'react-intl';

interface IProps {
  section: IKYCSection;
  reviewMode?: boolean;
  issuerId: string;
  isLoading?: boolean;
  saveElement?: (name: string, values: Array<string>) => void;
  templateName: string;
  user: IUser;
}

const KYCSection: FC<IProps> = ({
  section,
  reviewMode = false,
  saveElement,
  issuerId,
  isLoading,
  templateName,
  user,
}: IProps) => {
  const intl = useIntl();
  return (
    <>
      {!reviewMode && (
        <>
          <h1>{i18n(intl.locale, section.label)}</h1>
          {section.description && (
            <p
              dangerouslySetInnerHTML={{
                __html: i18n(intl.locale, section.description),
              }}
            />
          )}
        </>
      )}

      <KYCSubSection
        key={section.key}
        label={section.label}
        reviewMode={reviewMode}
        issuerId={issuerId}
        section={section}
        saveElement={saveElement}
        isLoading={isLoading}
        templateName={templateName}
        user={user}
      />
    </>
  );
};

export default KYCSection;
