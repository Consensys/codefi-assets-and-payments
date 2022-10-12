import React from 'react';
import { Card } from 'uiComponents/Card';

import { useIntl } from 'react-intl';
import ServerImage from 'uiComponents/ServerImage';
import { InvestmentProductTexts } from 'texts/routes/investor/InvestmentProduct';
import { Link } from 'react-router-dom';
import { IBorrowerInformation } from 'routes/Issuer/AssetIssuance/templatesTypes';

interface IProps {
  borrowerInformation?: IBorrowerInformation;
}

const FundraiserInfo: React.FC<IProps> = ({ borrowerInformation }: IProps) => {
  const intl = useIntl();
  return borrowerInformation ? (
    <Card className="fundraiserInfo">
      <header>
        {intl.formatMessage(InvestmentProductTexts.fundraiserInfo)}
      </header>

      <div>
        {borrowerInformation.logo.length > 1 && (
          <ServerImage
            docId={borrowerInformation.logo[1]}
            alt="fundraiser-avatar"
          />
        )}
        <div>
          <h2>{borrowerInformation.name}</h2>
          <p>{borrowerInformation.description}</p>
          <Link
            to={{ pathname: borrowerInformation.website }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {borrowerInformation.website}
          </Link>
        </div>
      </div>
    </Card>
  ) : (
    <></>
  );
};

export default FundraiserInfo;
