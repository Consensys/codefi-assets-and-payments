import React from 'react';
import { Link } from 'react-router-dom';

import { commonActionsTexts } from 'texts/commun/actions';

import { CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE } from 'routesList';

import { IKYCSection } from 'types/KYCSection';

import { colors } from 'constants/styles';
import KYCElement from './KYCElement';
import { ElementStatus } from 'routes/Issuer/AssetIssuance/elementsTypes';
import { IUser } from 'User';
import { useIntl } from 'react-intl';
import i18n from 'utils/i18n';

interface IProps {
  label: { [key: string]: string };
  section: IKYCSection;
  reviewMode?: boolean;
  issuerId: string;
  isLoading?: boolean;
  saveElement?: (name: string, values: Array<string>) => void;
  templateName: string;
  user: IUser;
}

const KYCSubSection: React.FC<IProps> = ({
  label,
  reviewMode,
  issuerId,
  section,
  saveElement,
  isLoading,
  templateName,
}: IProps) => {
  const intl = useIntl();
  return (
    <React.Fragment key={i18n(intl.locale, label)}>
      {reviewMode && (
        <div className="subSectionHeader">
          <h2>{i18n(intl.locale, label)}</h2>
          <Link
            to={CLIENT_ROUTE_SUBMIT_KYC_STEP_BY_ROLE.pathBuilder({
              issuerId,
              step: section.key,
            })}
            style={{
              color: colors.main,
            }}
          >
            {intl.formatMessage(commonActionsTexts.edit)}
          </Link>
        </div>
      )}

      {section.elements
        .filter(({ element }) => element.status !== ElementStatus.conditional)
        .map((element, index) => {
          return (
            <KYCElement
              key={`${element.name}-${index}`}
              item={element}
              saveElement={saveElement}
              isLoading={isLoading}
              allSectionItems={section.elements}
              reviewMode={reviewMode}
              templateName={templateName}
            />
          );
        })}
    </React.Fragment>
  );
};

export default KYCSubSection;
