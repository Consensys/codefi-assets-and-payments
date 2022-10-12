import React from 'react';
import Onboarding from 'react-undraw/dist/illustrations/UndrawOnboarding';

import { colors } from 'constants/styles';
import { getConfig } from 'utils/configUtils';

const config = getConfig();

const UndrawOnboarding = () => {
  if (config.name !== 'Aurelium') {
    return <Onboarding primaryColor={colors.main} />;
  } else {
    return <div />;
  }
};

export default UndrawOnboarding;
