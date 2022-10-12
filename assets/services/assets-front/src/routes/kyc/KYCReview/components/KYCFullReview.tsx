import React from 'react';

import { IKYCSection } from 'types/KYCSection';
import KYCSectionReview from './KYCSectionReview';

interface IProps {
  sections: Array<IKYCSection>;
  investorId: string;
  issuerId: string;
  isKycValidated: boolean;
}

const KYCFullReview: React.FC<IProps> = ({
  sections,
  investorId,
  issuerId,
  isKycValidated,
}: IProps) => (
  <>
    {sections.map((section) => (
      <KYCSectionReview
        key={section.key}
        issuerId={issuerId}
        section={section}
        investorId={investorId}
        reviewMode
        isKycValidated={isKycValidated}
      />
    ))}
  </>
);

export default KYCFullReview;
