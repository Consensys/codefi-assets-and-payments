import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';

import { navManagementTexts } from 'texts/routes/issuer/navManagement';

import './NAVManagementStyles.scss';
import { WrappedComponentProps } from 'react-intl';

const NAVManagement: React.FC<RouteComponentProps & WrappedComponentProps> = ({
  intl,
}) => {
  return (
    <div id="_routes_issuer_navManagement">
      <PageTitle title={intl.formatMessage(navManagementTexts.title)} />
    </div>
  );
};

export default withRouter(NAVManagement);
