import React, { FC } from 'react';

import { IKYCSection } from 'types/KYCSection';
import Select from 'uiComponents/Select';
import { ClientCategory, RiskProfile } from 'constants/kycKeys';
import { IUser, UserType } from 'User';
import { useIntl } from 'react-intl';
import { KYCRenewalTexts } from 'texts/routes/kyc/KYCReview';

interface IProps {
  sections: Array<IKYCSection>;
  hasRejectedElements: boolean;
  investor: IUser;
}

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const CategoryAndRiskProfile = ({ hasRejectedElements }: IProps) => {
  const intl = useIntl();
  return (
    <>
      <h2>{intl.formatMessage(KYCRenewalTexts.categoryAndRiskProfile)}</h2>

      <h3>{intl.formatMessage(KYCRenewalTexts.categoryAndRiskProfileDesc)}</h3>

      <Select
        label={intl.formatMessage(
          KYCRenewalTexts.categoryAndRiskProfileCategory,
        )}
        sublabel={intl.formatMessage(
          KYCRenewalTexts.categoryAndRiskProfileCanEdit,
        )}
        options={Object.values(ClientCategory).map((c) => ({
          label: capitalizeFirstLetter(c).split('_').join(' '),
          value: c,
        }))}
        name="category"
        disabled={hasRejectedElements}
        className="select-renewal-date"
        required
        placeholder=" "
      />
      <Select
        label={intl.formatMessage(
          KYCRenewalTexts.categoryAndRiskProfileProfile,
        )}
        sublabel={intl.formatMessage(
          KYCRenewalTexts.categoryAndRiskProfileCanEdit,
        )}
        name="riskProfile"
        options={Object.values(RiskProfile).map((c) => ({
          label: capitalizeFirstLetter(c).split('_').join(' '),
          value: c,
        }))}
        className="select-renewal-date"
        disabled={hasRejectedElements}
        required
        placeholder=" "
      />
    </>
  );
};

const KYCRenewal: FC<IProps> = ({ hasRejectedElements }: IProps) => {
  const intl = useIntl();
  return (
    <>
      <h2>{intl.formatMessage(KYCRenewalTexts.renewalDate)}</h2>

      <h3>{intl.formatMessage(KYCRenewalTexts.renewalDateDesc)}</h3>

      <Select
        label={intl.formatMessage(KYCRenewalTexts.setRenewalDate)}
        name="validityDate"
        sublabel={intl.formatMessage(KYCRenewalTexts.setRenewalDateSubLabel)}
        options={[
          {
            label: intl.formatMessage(KYCRenewalTexts.renewalDate1Year),
            value: '1',
          },
          {
            label: intl.formatMessage(KYCRenewalTexts.renewalDate2Years),
            value: '2',
          },
          {
            label: intl.formatMessage(KYCRenewalTexts.renewalDate5Years),
            value: '5',
          },
        ]}
        className="select-renewal-date"
        required={false}
        disabled={hasRejectedElements}
        placeholder=" "
      />
    </>
  );
};

const Componant: FC<IProps> = (props: IProps) => {
  const {
    investor: { userType: role },
  } = props;
  return (
    <>
      {role === UserType.INVESTOR && <CategoryAndRiskProfile {...props} />}
      <KYCRenewal {...props} />
    </>
  );
};

export default Componant;
