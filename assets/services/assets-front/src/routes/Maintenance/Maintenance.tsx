import React from 'react';
import { useIntl } from 'react-intl';
import { CommonTexts } from 'texts/commun/commonTexts';

import Logo from 'uiComponents/Logo/Logo';
import StyledMaintenance from './StyledMaintenance';

export const Maintenance = () => {
  const intl = useIntl();

  return (
    <StyledMaintenance>
      <Logo withLabel />
      <h2>{intl.formatMessage(CommonTexts.maintenanceInProgress)}</h2>
    </StyledMaintenance>
  );
};
