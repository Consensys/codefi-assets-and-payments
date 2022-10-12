import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import PageTitle from 'uiComponents/PageTitle';

import { analyticsMessages } from 'texts/routes/issuer/analytics';

import './AnalyticsStyles.scss';
import { injectIntl, WrappedComponentProps } from 'react-intl';

interface IProps extends WrappedComponentProps, RouteComponentProps {}
const Analytics: React.FC<IProps> = ({ intl }) => {
  return (
    <div id="_routes_issuer_analytics">
      <PageTitle title={intl.formatMessage(analyticsMessages.title)} />
    </div>
  );
};

export default injectIntl(withRouter(Analytics));
